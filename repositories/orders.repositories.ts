import { pool } from "@/lib/db/db";
import { withTransaction, txQuery, type PoolClient } from "@/lib/db/transaction";

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_recipient: string;
  shipping_phone: string;
  shipping_address_line_1: string;
  shipping_address_line_2: string | null;
  shipping_area: string | null;
  shipping_city: string;
  shipping_district: string | null;
  shipping_postal_code: string | null;
  shipping_country: string;
  billing_address: any | null;
  subtotal: string;
  discount_total: string;
  shipping_fee: string;
  tax_total: string;
  grand_total: string;
  currency: string;
  payment_method: string | null;
  customer_note: string | null;
  internal_note: string | null;
  placed_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku_snapshot: string | null;
  quantity: number;
  unit_price: string;
  unit_cost: string | null;
  discount_amount: string;
  line_total: string;
  created_at: string;
};

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

function generateOrderNumber(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.\dZ]/g, "").slice(0, 12);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HMT-${stamp}-${rand}`;
}

export async function placeOrder(input: {
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingRecipient: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingArea?: string;
  shippingCity: string;
  shippingDistrict?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  paymentMethod: "cod" | "bkash" | "nagad" | "rocket" | "card" | "bank_transfer" | "other";
  customerNote?: string;
  items: { variantId: string; quantity: number }[];
}): Promise<OrderRow> {
  return withTransaction(async (client) => {
    const variantIds = input.items.map((i) => i.variantId);

    // Rule 1: lock inventory rows for update within this transaction.
    const lockResult = await txQuery(
      client,
      `SELECT variant_id, quantity_on_hand, quantity_reserved
       FROM inventory_balances
       WHERE variant_id = ANY($1::uuid[])
       FOR UPDATE`,
      [variantIds]
    );

    const inventoryByVariant = new Map(
      lockResult.rows.map((r) => [r.variant_id as string, r])
    );

    // Validate stock and compute totals.
    let subtotal = 0;
    const resolvedItems: Array<{
      variantId: string;
      quantity: number;
      unitPrice: number;
      productId: string | null;
      productName: string;
      variantName: string | null;
      sku: string | null;
    }> = [];

    for (const item of input.items) {
      const inv = inventoryByVariant.get(item.variantId);
      if (!inv) {
        const err: any = new Error(`Variant ${item.variantId} has no inventory record`);
        err.statusCode = 400;
        throw err;
      }
      const available = Number(inv.quantity_on_hand) - Number(inv.quantity_reserved);
      if (available < item.quantity) {
        const err: any = new Error(`Insufficient stock for variant ${item.variantId}`);
        err.statusCode = 409;
        err.available = available;
        throw err;
      }

      const variant = await txQuery(
        client,
        `SELECT v.id, v.product_id, v.sku, v.name, COALESCE(v.sale_price, v.regular_price) AS unit_price
         FROM product_variants v
         WHERE v.id = $1 AND v.is_active = TRUE`,
        [item.variantId]
      );
      if (variant.rows.length === 0) {
        const err: any = new Error(`Variant ${item.variantId} is not active`);
        err.statusCode = 400;
        throw err;
      }
      const v = variant.rows[0];
      const unitPrice = Number(v.unit_price);

      resolvedItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        productId: v.product_id,
        productName: v.name,
        variantName: v.name,
        sku: v.sku,
      });
      subtotal += unitPrice * item.quantity;
    }

    // Resolve real product names in one query.
    const productIds = [...new Set(resolvedItems.map((i) => i.productId).filter(Boolean))] as string[];
    const productNames = new Map<string, string>();
    if (productIds.length) {
      const pr = await txQuery(
        client,
        `SELECT id, name FROM products WHERE id = ANY($1::uuid[])`,
        [productIds]
      );
      for (const row of pr.rows) {
        productNames.set(row.id as string, row.name as string);
      }
    }
    const shippingFee = 0;
    const taxTotal = 0;
    const discountTotal = 0;
    const grandTotal = subtotal + shippingFee + taxTotal - discountTotal;

    // Generate a unique order number (retry on unique violation).
    let orderNumber: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateOrderNumber();
      const check = await txQuery(client, `SELECT 1 FROM orders WHERE order_number = $1`, [candidate]);
      if (check.rows.length === 0) {
        orderNumber = candidate;
        break;
      }
    }
    if (!orderNumber) {
      throw new Error("Unable to generate a unique order number");
    }

    // Rule 3: insert order (snapshot; no cost_price / internal_note exposed).
    const orderResult = await txQuery(
      client,
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_recipient, shipping_phone, shipping_address_line_1, shipping_address_line_2,
        shipping_area, shipping_city, shipping_district, shipping_postal_code, shipping_country,
        subtotal, discount_total, shipping_fee, tax_total, grand_total, currency,
        payment_method, customer_note, status, payment_status, fulfillment_status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending','unpaid','unfulfilled'
      )
      RETURNING id, order_number, user_id, status, payment_status, fulfillment_status,
                customer_name, customer_email, customer_phone, shipping_recipient, shipping_phone,
                shipping_address_line_1, shipping_address_line_2, shipping_area, shipping_city,
                shipping_district, shipping_postal_code, shipping_country, billing_address,
                subtotal, discount_total, shipping_fee, tax_total, grand_total, currency,
                payment_method, customer_note, internal_note, placed_at, confirmed_at,
                cancelled_at, created_at, updated_at`,
      [
        orderNumber,
        input.userId ?? null,
        input.customerName,
        input.customerEmail ?? null,
        input.customerPhone,
        input.shippingRecipient,
        input.shippingPhone,
        input.shippingAddressLine1,
        input.shippingAddressLine2 ?? null,
        input.shippingArea ?? null,
        input.shippingCity,
        input.shippingDistrict ?? null,
        input.shippingPostalCode ?? null,
        input.shippingCountry ?? "Bangladesh",
        String(subtotal),
        String(discountTotal),
        String(shippingFee),
        String(taxTotal),
        String(grandTotal),
        "BDT",
        input.paymentMethod,
        input.customerNote ?? null,
      ]
    );
    const order = orderResult.rows[0] as OrderRow;

    // Rule 3 & 4: reserve stock + write ledger movements; insert order items.
    for (const item of resolvedItems) {
      await txQuery(
        client,
        `UPDATE inventory_balances
         SET quantity_reserved = quantity_reserved + $1, updated_at = now()
         WHERE variant_id = $2`,
        [item.quantity, item.variantId]
      );
      await txQuery(
        client,
        `INSERT INTO inventory_movements (variant_id, movement_type, quantity_delta, reference_type, reference_id, note)
         VALUES ($1, 'reservation', $2, 'order', $3, $4)`,
        [item.variantId, item.quantity, order.id, `Reserved for order ${order.order_number}`]
      );

      const lineTotal = Math.round((item.unitPrice * item.quantity) * 100) / 100;
      await txQuery(
        client,
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_name, sku_snapshot,
          quantity, unit_price, unit_cost, discount_amount, line_total
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          order.id,
          item.productId ?? null,
          item.variantId,
          productNames.get(item.productId ?? "") ?? item.productName,
          item.variantName,
          item.sku,
          item.quantity,
          String(item.unitPrice),
          null, // unit_cost intentionally not snapshotted (rule 7)
          String(0),
          String(lineTotal),
        ]
      );
    }

    // Rule 6: record initial status transition.
    await txQuery(
      client,
      `INSERT INTO order_status_history (order_id, old_status, new_status, note)
       VALUES ($1, NULL, $2, $3)`,
      [order.id, "pending", "Order placed"]
    );

    return order;
  });
}

export type { PoolClient };

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const orderResult = await pool.query<OrderRow>(
    `SELECT id, order_number, user_id, status, payment_status, fulfillment_status,
            customer_name, customer_email, customer_phone, shipping_recipient, shipping_phone,
            shipping_address_line_1, shipping_address_line_2, shipping_area, shipping_city,
            shipping_district, shipping_postal_code, shipping_country, billing_address,
            subtotal, discount_total, shipping_fee, tax_total, grand_total, currency,
            payment_method, customer_note, placed_at, confirmed_at, cancelled_at,
            created_at, updated_at
     FROM orders WHERE id = $1`,
    [orderId]
  );
  if (orderResult.rows.length === 0) return null;
  const order = orderResult.rows[0];

  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT id, order_id, product_id, variant_id, product_name, variant_name, sku_snapshot,
            quantity, unit_price, unit_cost, discount_amount, line_total, created_at
     FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );

  return { ...order, items: itemsResult.rows };
}

export async function listOrders(params?: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: OrderRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const values: unknown[] = [];
  const conditions: string[] = [];
  if (params?.userId) {
    values.push(params.userId);
    conditions.push(`user_id = $${values.length}`);
  }
  if (params?.status) {
    values.push(params.status);
    conditions.push(`status = $${values.length}`);
  }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const countResult = await pool.query(`SELECT COUNT(*)::int FROM orders ${where}`, values);
  const total = Number(countResult.rows[0].count);

  const dataResult = await pool.query<OrderRow>(
    `SELECT id, order_number, user_id, status, payment_status, fulfillment_status,
            customer_name, customer_email, customer_phone, shipping_recipient, shipping_phone,
            shipping_address_line_1, shipping_address_line_2, shipping_area, shipping_city,
            shipping_district, shipping_postal_code, shipping_country, billing_address,
            subtotal, discount_total, shipping_fee, tax_total, grand_total, currency,
            payment_method, customer_note, placed_at, confirmed_at, cancelled_at,
            created_at, updated_at
     FROM orders ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset]
  );

  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Rule 6: record every status transition. Updates orders.status and appends a
 * history row. Returns the updated order.
 */
export async function transitionOrderStatus({
  orderId,
  newStatus,
  note,
  changedById,
}: {
  orderId: string;
  newStatus: string;
  note?: string;
  changedById?: string;
}) {
  return withTransaction(async (client) => {
    const current = await txQuery(
      client,
      `SELECT status FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    if (current.rows.length === 0) {
      const err: any = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    const oldStatus = current.rows[0].status as string;
    if (oldStatus === newStatus) {
      return current.rows[0];
    }

    await txQuery(
      client,
      `UPDATE orders SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, order_number, status`,
      [newStatus, orderId]
    );

    await txQuery(
      client,
      `INSERT INTO order_status_history (order_id, old_status, new_status, note, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, oldStatus, newStatus, note ?? null, changedById ?? null]
    );

    return { orderId, oldStatus, newStatus };
  });
}

/**
 * Rule 4: fulfilment — decrement on_hand and reserved atomically, write a
 * 'sale' ledger movement, and mark the order fulfilled.
 */
export async function fulfilOrder({
  orderId,
  changedById,
}: {
  orderId: string;
  changedById?: string;
}) {
  return withTransaction(async (client) => {
    const order = await txQuery(
      client,
      `SELECT id, status, fulfillment_status FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    if (order.rows.length === 0) {
      const err: any = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    const o = order.rows[0];
    if (o.fulfillment_status === "fulfilled") {
      return { orderId, alreadyFulfilled: true };
    }

    const items = await txQuery(
      client,
      `SELECT variant_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    for (const item of items.rows) {
      await txQuery(
        client,
        `UPDATE inventory_balances
         SET quantity_on_hand = GREATEST(quantity_on_hand - $1, 0),
             quantity_reserved = GREATEST(quantity_reserved - $1, 0),
             updated_at = now()
         WHERE variant_id = $2`,
        [item.quantity, item.variant_id]
      );
      await txQuery(
        client,
        `INSERT INTO inventory_movements (variant_id, movement_type, quantity_delta, reference_type, reference_id, note)
         VALUES ($1, 'sale', -$2, 'order', $3, $4)`,
        [item.variant_id, item.quantity, orderId, `Fulfilled order ${o.order_number}`]
      );
    }

    await txQuery(
      client,
      `UPDATE orders SET fulfillment_status = 'fulfilled', status = 'delivered', updated_at = now()
       WHERE id = $1`,
      [orderId]
    );
    await txQuery(
      client,
      `INSERT INTO order_status_history (order_id, old_status, new_status, note, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, o.status, "delivered", "Order fulfilled", changedById ?? null]
    );

    return { orderId, fulfilled: true };
  });
}


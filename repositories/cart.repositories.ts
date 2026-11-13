import { pool } from "@/lib/db/db";

export type CartRow = {
  id: string;
  user_id: string | null;
  session_key: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  variant_sku: string | null;
  variant_name: string | null;
  regular_price: string | null;
  sale_price: string | null;
  product_name: string | null;
  product_id: string | null;
  quantity_available: number | null;
};

export async function getOrCreateCart({
  userId,
  sessionKey,
  currency = "BDT",
}: {
  userId?: string | null;
  sessionKey?: string | null;
  currency?: string;
}): Promise<CartRow> {
  if (userId) {
    const existing = await pool.query<CartRow>(
      `SELECT id, user_id, session_key, currency, created_at, updated_at
       FROM carts WHERE user_id = $1`,
      [userId]
    );
    if (existing.rows.length) {
      return existing.rows[0];
    }
    const result = await pool.query<CartRow>(
      `INSERT INTO carts (user_id, currency)
       VALUES ($1, $2)
       RETURNING id, user_id, session_key, currency, created_at, updated_at`,
      [userId, currency]
    );
    return result.rows[0];
  }

  if (!sessionKey) {
    throw new Error("Either user_id or session_key is required");
  }

  const existing = await pool.query<CartRow>(
    `SELECT id, user_id, session_key, currency, created_at, updated_at
     FROM carts WHERE session_key = $1`,
    [sessionKey]
  );
  if (existing.rows.length) {
    return existing.rows[0];
  }
  const result = await pool.query<CartRow>(
    `INSERT INTO carts (session_key, currency)
     VALUES ($1, $2)
     RETURNING id, user_id, session_key, currency, created_at, updated_at`,
    [sessionKey, currency]
  );
  return result.rows[0];
}

export async function getCartById(cartId: string): Promise<CartRow | null> {
  const result = await pool.query<CartRow>(
    `SELECT id, user_id, session_key, currency, created_at, updated_at
     FROM carts WHERE id = $1`,
    [cartId]
  );
  return result.rows[0] ?? null;
}

export async function listCartItems(cartId: string): Promise<CartItemRow[]> {
  const result = await pool.query<CartItemRow>(
    `SELECT ci.id, ci.cart_id, ci.variant_id, ci.quantity, ci.added_at, ci.updated_at,
            v.sku AS variant_sku, v.name AS variant_name,
            v.regular_price, v.sale_price,
            p.name AS product_name, p.id AS product_id,
            (ib.quantity_on_hand - ib.quantity_reserved) AS quantity_available
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.variant_id
     LEFT JOIN products p ON p.id = v.product_id
     LEFT JOIN inventory_balances ib ON ib.variant_id = v.id
     WHERE ci.cart_id = $1
     ORDER BY ci.added_at ASC`,
    [cartId]
  );
  return result.rows;
}

export async function addCartItem(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<CartItemRow> {
  const result = await pool.query<CartItemRow>(
    `INSERT INTO cart_items (cart_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, variant_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                   updated_at = now()
     RETURNING id, cart_id, variant_id, quantity, added_at, updated_at`,
    [cartId, variantId, quantity]
  );
  return result.rows[0];
}

export async function updateCartItemQuantity(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<CartItemRow | null> {
  const result = await pool.query<CartItemRow>(
    `UPDATE cart_items
     SET quantity = $1, updated_at = now()
     WHERE cart_id = $2 AND variant_id = $3
     RETURNING id, cart_id, variant_id, quantity, added_at, updated_at`,
    [quantity, cartId, variantId]
  );
  return result.rows[0] ?? null;
}

export async function removeCartItem(cartId: string, variantId: string) {
  await pool.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND variant_id = $2`,
    [cartId, variantId]
  );
}

export async function clearCart(cartId: string) {
  await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
}


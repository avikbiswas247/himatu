import { pool } from "@/lib/db/db";
import { txQuery, type PoolClient } from "@/lib/db/transaction";

export type PaymentRow = {
  id: string;
  order_id: string;
  payment_reference: string | null;
  provider: string;
  payment_type: string;
  status: string;
  amount: string;
  currency: string;
  provider_transaction_id: string | null;
  idempotency_key: string | null;
  paid_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  failure_reason: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
};

export async function findPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentRow | null> {
  const result = await pool.query<PaymentRow>(
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE idempotency_key = $1 LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

export async function findPaymentByProviderTransaction(
  provider: string,
  providerTransactionId: string
): Promise<PaymentRow | null> {
  const result = await pool.query<PaymentRow>(
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE provider = $1 AND provider_transaction_id = $2 LIMIT 1`,
    [provider, providerTransactionId]
  );
  return result.rows[0] ?? null;
}

export async function getPaymentById(id: string): Promise<PaymentRow | null> {
  const result = await pool.query<PaymentRow>(
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listPaymentsForOrder(orderId: string): Promise<PaymentRow[]> {
  const result = await pool.query<PaymentRow>(
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE order_id = $1 ORDER BY created_at DESC`,
    [orderId]
  );
  return result.rows;
}

export type { PoolClient };

import { withTransaction } from "@/lib/db/transaction";

/**
 * Rule 5: payment verification is idempotent using idempotency_key and/or
 * provider_transaction_id. Re-verifying with the same key returns the existing
 * payment without creating a duplicate or double-crediting the order.
 */
export async function verifyPayment(input: {
  orderId: string;
  provider: "cod" | "bkash" | "nagad" | "rocket" | "card" | "bank_transfer" | "other";
  amount: number;
  providerTransactionId: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ payment: PaymentRow; orderId: string; alreadyProcessed: boolean }> {
  return withTransaction(async (client) => {
    // Rule 5: idempotency — return existing payment if already processed.
    const existing = await findPaymentByIdempotencyKeyTx(client, input.idempotencyKey);
    if (existing) {
      return { payment: existing, orderId: existing.order_id, alreadyProcessed: true };
    }

    const byProviderTx = await findPaymentByProviderTransactionTx(
      client,
      input.provider,
      input.providerTransactionId
    );
    if (byProviderTx) {
      return { payment: byProviderTx, orderId: byProviderTx.order_id, alreadyProcessed: true };
    }

    const paymentReference = `PAY-${input.idempotencyKey.slice(0, 12)}`;

    const result = await txQuery(
      client,
      `INSERT INTO payments (
        order_id, payment_reference, provider, payment_type, status, amount,
        currency, provider_transaction_id, idempotency_key, metadata
      ) VALUES ($1, $2, $3, 'full', 'paid', $4, $5, $6, $7, $8)
      RETURNING id, order_id, payment_reference, provider, payment_type, status,
                amount, currency, provider_transaction_id, idempotency_key,
                paid_at, verified_by, verified_at, failure_reason, metadata,
                created_at, updated_at`,
      [
        input.orderId,
        paymentReference,
        input.provider,
        String(input.amount),
        "BDT",
        input.providerTransactionId,
        input.idempotencyKey,
        JSON.stringify(input.metadata ?? {}),
      ]
    );
    const payment = result.rows[0] as PaymentRow;

    // Mark the order as paid.
    await txQuery(
      client,
      `UPDATE orders SET payment_status = 'paid', updated_at = now() WHERE id = $1`,
      [input.orderId]
    );

    await txQuery(
      client,
      `INSERT INTO order_status_history (order_id, old_status, new_status, note)
       VALUES ($1, 'unpaid', 'paid', $2)`,
      [input.orderId, `Payment verified via ${input.provider}`]
    );

    return { payment, orderId: input.orderId, alreadyProcessed: false };
  });
}

async function findPaymentByIdempotencyKeyTx(
  client: PoolClient,
  idempotencyKey: string
): Promise<PaymentRow | null> {
  const result = await txQuery(
    client,
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE idempotency_key = $1 LIMIT 1`,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

async function findPaymentByProviderTransactionTx(
  client: PoolClient,
  provider: string,
  providerTransactionId: string
): Promise<PaymentRow | null> {
  const result = await txQuery(
    client,
    `SELECT id, order_id, payment_reference, provider, payment_type, status,
            amount, currency, provider_transaction_id, idempotency_key,
            paid_at, verified_by, verified_at, failure_reason, metadata,
            created_at, updated_at
     FROM payments WHERE provider = $1 AND provider_transaction_id = $2 LIMIT 1`,
    [provider, providerTransactionId]
  );
  return result.rows[0] ?? null;
}


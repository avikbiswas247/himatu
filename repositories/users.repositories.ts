import { pool } from "@/lib/db/db";
import type { PoolClient } from "pg";

/**
 * User repository.
 * Application rule 7: password_hash is never selected/returned by default.
 */

export type UserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserCreateInput = {
  email?: string | null;
  phone?: string | null;
  passwordHash: string;
  fullName: string;
};

export async function createUser(client: PoolClient, input: UserCreateInput) {
  const result = await client.query(
    `INSERT INTO users (email, phone, password_hash, full_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, phone, full_name, email_verified_at, phone_verified_at,
                is_active, last_login_at, created_at, updated_at`,
    [input.email ?? null, input.phone ?? null, input.passwordHash, input.fullName]
  );
  return result.rows[0] as UserRow;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query(
    `SELECT id, email, phone, full_name, email_verified_at, phone_verified_at,
            is_active, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return (result.rows[0] as UserRow) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query(
    `SELECT id, email, phone, full_name, email_verified_at, phone_verified_at,
            is_active, last_login_at, created_at, updated_at
     FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return (result.rows[0] as UserRow) ?? null;
}

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const result = await pool.query(
    `SELECT id, email, phone, full_name, email_verified_at, phone_verified_at,
            is_active, last_login_at, created_at, updated_at
     FROM users WHERE phone = $1 LIMIT 1`,
    [phone]
  );
  return (result.rows[0] as UserRow) ?? null;
}

/**
 * Returns the user including password_hash. Only for authentication flows —
 * never expose this in public API responses.
 */
export async function findUserByEmailWithPassword(
  email: string
): Promise<(UserRow & { password_hash: string }) | null> {
  const result = await pool.query(
    `SELECT id, email, phone, full_name, password_hash, email_verified_at,
            phone_verified_at, is_active, last_login_at, created_at, updated_at
     FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return (result.rows[0] as unknown as UserRow & { password_hash: string }) ?? null;
}

export async function updateLastLogin(id: string) {
  await pool.query(
    `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
    [id]
  );
}

export async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  active?: boolean;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const values: unknown[] = [];
  let where = "WHERE is_active = TRUE";
  if (params?.active === false) {
    where = "WHERE TRUE";
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int FROM users ${where}`,
    values
  );
  const total = Number(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT id, email, phone, full_name, email_verified_at, phone_verified_at,
            is_active, last_login_at, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset]
  );

  return {
    data: dataResult.rows as UserRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type { PoolClient };


import { pool } from "@/lib/db/db";

export async function getOrCreateWishlist(userId: string): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM wishlists WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  if (existing.rows.length) {
    return existing.rows[0].id as string;
  }
  const result = await pool.query(
    `INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id`,
    [userId]
  );
  return result.rows[0].id as string;
}

export async function listWishlistItems(userId: string) {
  const wishlistId = await getOrCreateWishlist(userId);
  const result = await pool.query(
    `SELECT wi.product_id, wi.added_at,
            p.name AS product_name, p.slug, p.sku,
            MIN(COALESCE(v.sale_price, v.regular_price)) AS starting_price,
            pi.image_url AS primary_image_url
     FROM wishlist_items wi
     JOIN products p ON p.id = wi.product_id
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary
     WHERE wi.wishlist_id = $1
     GROUP BY wi.product_id, wi.added_at, p.name, p.slug, p.sku, pi.image_url
     ORDER BY wi.added_at DESC`,
    [wishlistId]
  );
  return result.rows;
}

export async function addWishlistItem(userId: string, productId: string) {
  const wishlistId = await getOrCreateWishlist(userId);
  const result = await pool.query(
    `INSERT INTO wishlist_items (wishlist_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (wishlist_id, product_id) DO NOTHING
     RETURNING product_id, added_at`,
    [wishlistId, productId]
  );
  return result.rows[0];
}

export async function removeWishlistItem(userId: string, productId: string) {
  const wishlistId = await getOrCreateWishlist(userId);
  await pool.query(
    `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2`,
    [wishlistId, productId]
  );
}

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const wishlistId = await getOrCreateWishlist(userId);
  const result = await pool.query(
    `SELECT 1 FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2 LIMIT 1`,
    [wishlistId, productId]
  );
  return result.rows.length > 0;
}


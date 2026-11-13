import { pool } from "@/lib/db/db";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  product_code: string | null;
  brand_id: string | null;
  description: string | null;
  product_story: string | null;
  materials: string | null;
  specifications: any;
  product_type: string;
  status: string;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  brand_name: string | null;
  primary_image_url: string | null;
  variant_count: number;
  starting_price: string | null;
};

export type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes: any;
  regular_price: string;
  sale_price: string | null;
  cost_price: string | null;
  currency: string;
  weight_grams: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Public catalogue listing — uses the product_catalogue_summary view.
 * Never returns cost_price (rule 7).
 */
export async function listProducts(params?: {
  category?: string;
  brand?: string;
  status?: string;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const values: unknown[] = [];
  const conditions: string[] = ["p.status = 'active'"];

  if (params?.brand) {
    values.push(params.brand);
    conditions.push(`b.id = $${values.length}`);
  }
  if (params?.category) {
    values.push(params.category);
    conditions.push(`pc.category_id = $${values.length}`);
  }
  if (params?.isFeatured !== undefined) {
    values.push(params.isFeatured);
    conditions.push(`p.is_featured = $${values.length}`);
  }
  if (params?.search) {
    values.push(`%${params.search}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
  }

  const where = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT p.id)::int
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN product_categories pc ON pc.product_id = p.id
     ${where.length ? "WHERE " + where : ""}`,
    values
  );
  const total = Number(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT p.id, p.name, p.slug, p.sku, p.status, p.is_featured, b.name AS brand_name,
            pi.image_url AS primary_image_url, COUNT(DISTINCT v.id) AS variant_count,
            MIN(COALESCE(v.sale_price, v.regular_price)) AS starting_price
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active
     ${where.length ? "WHERE " + where : ""}
     GROUP BY p.id, b.name, pi.image_url
     ORDER BY p.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset]
  );

  return {
    data: dataResult.rows as ProductRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const result = await pool.query(
    `SELECT p.id, p.name, p.slug, p.sku, p.status, p.is_featured, b.name AS brand_name,
            pi.image_url AS primary_image_url, COUNT(DISTINCT v.id) AS variant_count,
            MIN(COALESCE(v.sale_price, v.regular_price)) AS starting_price
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active
     WHERE p.slug = $1
     GROUP BY p.id, b.name, pi.image_url
     LIMIT 1`,
    [slug]
  );
  return (result.rows[0] as ProductRow) ?? null;
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const result = await pool.query(
    `SELECT p.id, p.name, p.slug, p.sku, p.status, p.is_featured, b.name AS brand_name,
            pi.image_url AS primary_image_url, COUNT(DISTINCT v.id) AS variant_count,
            MIN(COALESCE(v.sale_price, v.regular_price)) AS starting_price
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active
     WHERE p.id = $1
     GROUP BY p.id, b.name, pi.image_url
     LIMIT 1`,
    [id]
  );
  return (result.rows[0] as ProductRow) ?? null;
}

/**
 * Variants for a product, joined with inventory availability.
 * cost_price is intentionally excluded (rule 7).
 */
export async function getVariantsForProduct(productId: string): Promise<VariantRow[]> {
  const result = await pool.query(
    `SELECT v.id, v.product_id, v.sku, v.name, v.attributes, v.regular_price,
            v.sale_price, v.currency, v.weight_grams, v.is_default, v.is_active,
            v.created_at, v.updated_at,
            ib.quantity_on_hand, ib.quantity_reserved,
            (ib.quantity_on_hand - ib.quantity_reserved) AS quantity_available
     FROM product_variants v
     LEFT JOIN inventory_balances ib ON ib.variant_id = v.id
     WHERE v.product_id = $1
     ORDER BY v.is_default DESC, v.created_at ASC`,
    [productId]
  );
  return result.rows as VariantRow[];
}

export async function getVariantById(variantId: string) {
  const result = await pool.query(
    `SELECT v.id, v.product_id, v.sku, v.name, v.attributes, v.regular_price,
            v.sale_price, v.currency, v.weight_grams, v.is_default, v.is_active
     FROM product_variants v
     WHERE v.id = $1`,
    [variantId]
  );
  return (result.rows[0] as VariantRow) ?? null;
}


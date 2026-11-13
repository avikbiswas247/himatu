import { NextRequest } from "next/server";

import { getProductBySlug, getVariantsForProduct, getVariantById } from "@/repositories/product.repositories";
import { json, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) {
      return errorResponse("Product not found", 404);
    }
    const variants = await getVariantsForProduct(product.id);
    return json({ product, variants });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to load product", err?.statusCode ?? 500);
  }
}

import { NextRequest } from "next/server";

import { listProducts } from "@/repositories/product.repositories";
import { productQuerySchema } from "@/lib/validators/schemas";
import { json, errorResponse } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = {
      category: searchParams.get("category") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      isFeatured: searchParams.get("isFeatured") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    };
    const params = productQuerySchema.parse(raw);
    const result = await listProducts(params);
    return json({ data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to load products", err?.statusCode ?? 500);
  }
}

export async function POST() {
  return errorResponse("Not implemented", 501);
}

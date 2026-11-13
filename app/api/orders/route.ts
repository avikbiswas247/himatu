import { NextRequest } from "next/server";

import { listOrders } from "@/repositories/orders.repositories";
import { z } from "zod";
import { json, errorResponse } from "@/lib/api/response";

const listSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = listSchema.parse({
      userId: searchParams.get("userId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const result = await listOrders(params);
    return json({ data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to load orders", err?.statusCode ?? 500);
  }
}

export async function POST() {
  return errorResponse("Use /api/checkout to place orders", 405);
}

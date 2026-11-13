import { NextRequest } from "next/server";

import { getOrderById } from "@/repositories/orders.repositories";
import { json, errorResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return errorResponse("Order not found", 404);
    }
    return json({ order });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to load order", err?.statusCode ?? 500);
  }
}

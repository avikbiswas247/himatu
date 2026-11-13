import { NextRequest } from "next/server";

import { transitionOrderStatus, fulfilOrder } from "@/repositories/orders.repositories";
import { orderStatusSchema } from "@/lib/validators/schemas";
import { z } from "zod";
import { json, errorResponse } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = z.object({ action: z.enum(["transition", "fulfil"]).default("transition") }).parse(body);

    if (action === "fulfil") {
      const result = await fulfilOrder({ orderId: id });
      return json({ result });
    }

    const input = orderStatusSchema.parse({ ...body, orderId: id });
    const result = await transitionOrderStatus({
      orderId: input.orderId,
      newStatus: input.newStatus,
      note: input.note ?? undefined,
      changedById: input.changedById ?? undefined,
    });
    return json({ result });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to transition order", err?.statusCode ?? 500);
  }
}

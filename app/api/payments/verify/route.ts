import { NextRequest } from "next/server";

import { verifyPayment, getPaymentById } from "@/repositories/checkout_details.repositories";
import { verifyPaymentSchema } from "@/lib/validators/schemas";
import { json, errorResponse } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = verifyPaymentSchema.parse(body);

    const { payment, orderId, alreadyProcessed } = await verifyPayment({
      orderId: input.orderId,
      provider: input.provider,
      amount: input.amount,
      providerTransactionId: input.providerTransactionId,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata,
    });

    return json({
      payment,
      orderId,
      alreadyProcessed,
      message: alreadyProcessed ? "Payment already processed (idempotent)" : "Payment verified",
    });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to verify payment", err?.statusCode ?? 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return errorResponse("id query param is required", 400);
    }
    const payment = await getPaymentById(id);
    if (!payment) {
      return errorResponse("Payment not found", 404);
    }
    return json({ payment });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to load payment", err?.statusCode ?? 500);
  }
}

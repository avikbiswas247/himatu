import { NextRequest } from "next/server";

import { getOrCreateCart, listCartItems } from "@/repositories/cart.repositories";
import { z } from "zod";
import { json, errorResponse } from "@/lib/api/response";

const cartBodySchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  sessionKey: z.string().min(1).optional().nullable(),
  currency: z.string().length(3).default("BDT"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionKey, currency } = cartBodySchema.parse(body);
    if (!userId && !sessionKey) {
      return errorResponse("userId or sessionKey is required", 400);
    }
    const cart = await getOrCreateCart({ userId: userId ?? null, sessionKey: sessionKey ?? null, currency });
    const items = await listCartItems(cart.id);
    return json({ cart, items });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to get cart", err?.statusCode ?? 500);
  }
}

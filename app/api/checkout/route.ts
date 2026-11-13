import { NextRequest } from "next/server";

import { placeOrder } from "@/repositories/orders.repositories";
import { placeOrderSchema } from "@/lib/validators/schemas";
import { json, errorResponse, requireBody } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = requireBody(body, placeOrderSchema);

    // If a cart context is implied, items come from the body directly.
    const order = await placeOrder({
      userId: undefined, // set from session/auth in a real app
      customerName: input.customerName,
      customerEmail: input.customerEmail ?? undefined,
      customerPhone: input.customerPhone,
      shippingRecipient: input.shippingRecipient,
      shippingPhone: input.shippingPhone,
      shippingAddressLine1: input.shippingAddressLine1,
      shippingAddressLine2: input.shippingAddressLine2 ?? undefined,
      shippingArea: input.shippingArea ?? undefined,
      shippingCity: input.shippingCity,
      shippingDistrict: input.shippingDistrict ?? undefined,
      shippingPostalCode: input.shippingPostalCode ?? undefined,
      shippingCountry: input.shippingCountry ?? "Bangladesh",
      paymentMethod: input.paymentMethod,
      customerNote: input.customerNote ?? undefined,
      items: input.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    });

    return json({ order }, 201);
  } catch (err: any) {
    if (err?.statusCode === 409) {
      return errorResponse(err.message, 409, { stock: [err.message] });
    }
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to place order", err?.statusCode ?? 500);
  }
}

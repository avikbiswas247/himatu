import { NextRequest } from "next/server";

import {
  getCartById,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  listCartItems,
} from "@/repositories/cart.repositories";
import { z } from "zod";
import { json, errorResponse } from "@/lib/api/response";

const itemBodySchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(999),
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId");
    if (!cartId) {
      return errorResponse("cartId is required", 400);
    }
    const cart = await getCartById(cartId);
    if (!cart) {
      return errorResponse("Cart not found", 404);
    }
    const body = await req.json();
    const { variantId, quantity } = itemBodySchema.parse(body);
    const item = await addCartItem(cartId, variantId, quantity);
    return json({ item }, 201);
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to add cart item", err?.statusCode ?? 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId");
    const variantId = searchParams.get("variantId");
    if (!cartId || !variantId) {
      return errorResponse("cartId and variantId are required", 400);
    }
    const body = await req.json();
    const { quantity } = z.object({ quantity: z.coerce.number().int().min(1).max(999) }).parse(body);
    const item = await updateCartItemQuantity(cartId, variantId, quantity);
    if (!item) {
      return errorResponse("Cart item not found", 404);
    }
    return json({ item });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to update cart item", err?.statusCode ?? 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId");
    const variantId = searchParams.get("variantId");
    if (!cartId || !variantId) {
      return errorResponse("cartId and variantId are required", 400);
    }
    await removeCartItem(cartId, variantId);
    return json({ ok: true });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to remove cart item", err?.statusCode ?? 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cartId = searchParams.get("cartId");
    if (!cartId) {
      return errorResponse("cartId is required", 400);
    }
    const items = await listCartItems(cartId);
    return json({ items });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to load cart items", err?.statusCode ?? 500);
  }
}

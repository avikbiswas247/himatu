import { NextRequest } from "next/server";

import {
  getOrCreateWishlist,
  listWishlistItems,
  addWishlistItem,
  removeWishlistItem,
  isWishlisted,
} from "@/repositories/wishlist.repository";
import { addWishlistItemSchema } from "@/lib/validators/schemas";
import { z } from "zod";
import { json, errorResponse } from "@/lib/api/response";

const userParamSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = userParamSchema.parse({ userId: searchParams.get("userId") });
    const items = await listWishlistItems(userId);
    return json({ items });
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to load wishlist", err?.statusCode ?? 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = userParamSchema.parse({ userId: searchParams.get("userId") });
    const body = await req.json();
    const { productId } = addWishlistItemSchema.parse(body);
    const item = await addWishlistItem(userId, productId);
    return json({ item }, 201);
  } catch (err: any) {
    if (err?.issues) return errorResponse("Validation failed", 400, err.fields);
    return errorResponse(err?.message ?? "Failed to add wishlist item", err?.statusCode ?? 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = userParamSchema.parse({ userId: searchParams.get("userId") });
    const productId = searchParams.get("productId");
    if (!productId) {
      return errorResponse("productId is required", 400);
    }
    await removeWishlistItem(userId, productId);
    return json({ ok: true });
  } catch (err: any) {
    return errorResponse(err?.message ?? "Failed to remove wishlist item", err?.statusCode ?? 500);
  }
}

export async function HEAD(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = userParamSchema.parse({ userId: searchParams.get("userId") });
    const productId = searchParams.get("productId");
    if (!productId) {
      return new Response(null, { status: 400 });
    }
    const listed = await isWishlisted(userId, productId);
    return new Response(null, { status: listed ? 200 : 404 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

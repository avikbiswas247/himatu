import { z } from "zod";

/**
 * Zod validation schemas for incoming request bodies.
 * All user input is validated here before reaching the database layer.
 * Application rule 8: parameterized SQL is used everywhere; these schemas keep
 * input typed and safe.
 */

export const uuidSchema = z.string().uuid("Invalid UUID");

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

// ---------- Products ----------

export const productQuerySchema = z
  .object({
    category: z.string().optional(),
    brand: z.string().optional(),
    status: z.enum(["draft", "active", "archived"]).optional(),
    isFeatured: z.coerce.boolean().optional(),
    search: z.string().optional(),
  })
  .strict();

// ---------- Cart ----------

export const addToCartSchema = z.object({
  variantId: uuidSchema,
  quantity: z.coerce.number().int().min(1).max(999),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(999),
});

// ---------- Checkout / Order ----------

export const placeOrderSchema = z.object({
  customerName: z.string().min(1).max(160),
  customerEmail: z.string().email().max(255).optional().nullable(),
  customerPhone: z.string().min(1).max(30),
  shippingRecipient: z.string().min(1).max(160),
  shippingPhone: z.string().min(1).max(30),
  shippingAddressLine1: z.string().min(1),
  shippingAddressLine2: z.string().optional().default(""),
  shippingArea: z.string().max(120).optional().default(""),
  shippingCity: z.string().min(1).max(120),
  shippingDistrict: z.string().max(120).optional().default(""),
  shippingPostalCode: z.string().max(20).optional().default(""),
  shippingCountry: z.string().max(100).default("Bangladesh"),
  paymentMethod: z.enum([
    "cod",
    "bkash",
    "nagad",
    "rocket",
    "card",
    "bank_transfer",
    "other",
  ]),
  customerNote: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        variantId: uuidSchema,
        quantity: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1, "At least one item is required"),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

// ---------- Payment verification ----------

export const verifyPaymentSchema = z.object({
  orderId: uuidSchema,
  provider: z.enum([
    "cod",
    "bkash",
    "nagad",
    "rocket",
    "card",
    "bank_transfer",
    "other",
  ]),
  amount: z.coerce.number().positive(),
  providerTransactionId: z.string().min(1).max(160),
  idempotencyKey: z.string().min(1).max(160),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// ---------- Status transitions ----------

export const orderStatusSchema = z.object({
  orderId: uuidSchema,
  newStatus: z.enum([
    "pending",
    "confirmed",
    "processing",
    "partially_shipped",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ]),
  note: z.string().optional().default(""),
  changedById: uuidSchema.optional(),
});

// ---------- Wishlist ----------

export const addWishlistItemSchema = z.object({
  productId: uuidSchema,
});

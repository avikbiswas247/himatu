"use client";

const BASE = "";

async function request(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input.toString(), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err: any = new Error(
      data?.error?.message || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.fields = data?.error?.fields;
    throw err;
  }

  return data;
}

export const api = {
  get: (url: string, params?: Record<string, string | number | boolean>) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return request(`${BASE}${url}${qs}`);
  },
  post: (url: string, body?: unknown) =>
    request(`${BASE}${url}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (url: string, body?: unknown) =>
    request(`${BASE}${url}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (url: string) =>
    request(`${BASE}${url}`, { method: "DELETE" }),
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  is_featured: boolean;
  brand_name: string | null;
  primary_image_url: string | null;
  variant_count: number;
  starting_price: string | null;
};

export type ProductDetail = Product & {
  description: string | null;
  product_story: string | null;
  materials: string | null;
  specifications: any;
  product_type: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes: any;
  regular_price: string;
  sale_price: string | null;
  currency: string;
  weight_grams: number | null;
  is_default: boolean;
  is_active: boolean;
  quantity_on_hand: number | null;
  quantity_reserved: number | null;
  quantity_available: number | null;
};

export type CartItem = {
  id: string;
  variant_id: string;
  quantity: number;
  variant_sku: string | null;
  variant_name: string | null;
  regular_price: string | null;
  sale_price: string | null;
  product_name: string | null;
  product_id: string | null;
  quantity_available: number | null;
};

export type Cart = {
  id: string;
  user_id: string | null;
  session_key: string | null;
  currency: string;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  grand_total: string;
  currency: string;
  created_at: string;
  items: any[];
};

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Bag – Nike",
};

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const session = localStorage.getItem("cart_session");
      if (!session) {
        setLoading(false);
        return;
      }
      const res = await api.get("/api/carts", { sessionKey: session });
      setCart(res.cart);
      const itemRes = await api.get(`/api/cart/items?cartId=${res.cart.id}`);
      setItems(itemRes.items || []);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (variantId: string, quantity: number) => {
    const session = localStorage.getItem("cart_session");
    if (!session) return;
    try {
      await api.patch(`/api/cart/items?cartId=${session}&variantId=${variantId}`, { quantity });
      await loadCart();
    } catch (err: any) {
      setMessage(err.message || "Failed to update");
    }
  };

  const removeItem = async (variantId: string) => {
    const session = localStorage.getItem("cart_session");
    if (!session) return;
    try {
      await api.delete(`/api/cart/items?cartId=${session}&variantId=${variantId}`);
      await loadCart();
    } catch (err: any) {
      setMessage(err.message || "Failed to remove");
    }
  };

  const subtotal = items.reduce((s, i) => s + Number(i.regular_price || 0) * i.quantity, 0);

  if (loading) {
    return (
      <div className="bg-white text-black min-h-screen flex flex-col items-center justify-center py-24">
        <Navbar />
        <h1 className="text-[48px] font-black uppercase tracking-tight">Loading…</h1>
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <div className="bg-white text-black min-h-screen py-24 px-6">
        <Navbar />
        <div className="mx-auto max-w-[1400px] text-center">
          <h1 className="text-[48px] font-black uppercase tracking-tight mb-6">Your bag is empty</h1>
          <p className="text-[13px] text-black/60 mb-10">Add some products to get started.</p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-black/90"
          >
            Shop collection
            <span className="ml-2 text-[10px]">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-16 px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="mb-12 text-[32px] font-black uppercase tracking-tight">Your bag</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            <div className="lg:col-span-3 space-y-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-4 items-center gap-8 border-b border-black/20 pb-8"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src="/photos/Gear5.png"
                      alt={item.product_name || "Product"}
                      className="w-20 h-20 object-cover"
                    />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-black/50">
                        {item.product_name || "Product"}
                      </span>
                      <span className="block text-[12px] font-bold text-black">
                        {item.variant_name || item.variant_sku}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-4">
                    <button
                      onClick={() => updateQty(item.variant_id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-black text-[10px] font-bold hover:bg-black hover:text-white"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQty(item.variant_id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center border-b-0 border-b focus:border-b-2"
                    />
                    <button
                      onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-black text-[10px] font-bold hover:bg-black hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[14px] font-bold text-black">
                    BDT {(Number(item.regular_price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.variant_id)}
                    className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1 space-y-8">
              <div className="border border-black p-8">
                <div className="flex justify-between mb-4 text-[13px] font-bold">
                  <span>Subtotal</span>
                  <span>BDT {subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-black pt-4 flex justify-between text-[13px] font-bold">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <Button onClick={() => (window.location.href = "/checkout")} className="w-full">
                Checkout
              </Button>

              {message && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-black/60">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


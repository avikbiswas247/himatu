"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Checkout – Nike",
};

export default function CheckoutPage() {
  const [step, setStep] = useState<"info" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const form: any = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingRecipient: "",
    shippingPhone: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingArea: "",
    shippingCity: "",
    shippingDistrict: "",
    shippingPostalCode: "",
    shippingCountry: "Bangladesh",
    paymentMethod: "cod",
    customerNote: "",
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const session = localStorage.getItem("cart_session");
    if (!session) {
      setMessage("Your bag is empty");
      setLoading(false);
      return;
    }

    try {
      const cartRes = await api.get(`/api/cart/items?cartId=${session}`);
      const items = (cartRes.items || []).map((i: any) => ({
        variantId: i.variant_id,
        quantity: i.quantity,
      }));

      if (items.length === 0) {
        setMessage("Your bag is empty");
        setLoading(false);
        return;
      }

      await api.post("/api/checkout", {
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone,
        shippingRecipient: form.shippingRecipient,
        shippingPhone: form.shippingPhone,
        shippingAddressLine1: form.shippingAddressLine1,
        shippingAddressLine2: form.shippingAddressLine2 || undefined,
        shippingArea: form.shippingArea || undefined,
        shippingCity: form.shippingCity,
        shippingDistrict: form.shippingDistrict || undefined,
        shippingPostalCode: form.shippingPostalCode || undefined,
        shippingCountry: form.shippingCountry,
        paymentMethod: form.paymentMethod,
        customerNote: form.customerNote || undefined,
        items,
      });

      setStep("success");
      localStorage.removeItem("cart_session");
    } catch (err: any) {
      setMessage(err.message || "Failed to place order");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white text-black">
      <Navbar />

      {step === "success" ? (
        <section className="py-24 px-6">
          <div className="mx-auto max-w-[1400px] text-center">
            <h1 className="mb-6 text-[48px] font-black uppercase tracking-tight">
              Order confirmed
            </h1>
            <p className="text-[13px] text-black/60 mb-10">
              Thank you for your purchase.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center px-8 py-4 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-black/90"
            >
              View orders
              <span className="ml-2 text-[10px]">→</span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="py-16 px-6">
          <div className="mx-auto max-w-[1400px]">
            <h1 className="mb-12 text-[32px] font-bold uppercase tracking-tight">
              Shipping information
            </h1>

            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label htmlFor="customerName">Full name</Label>
                  <Input
                    id="customerName"
                    required
                    value={form.customerName}
                    onChange={(e) => (form.customerName = e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => (form.customerEmail = e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    required
                    value={form.customerPhone}
                    onChange={(e) => (form.customerPhone = e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shippingRecipient">Shipping recipient</Label>
                  <Input
                    id="shippingRecipient"
                    required
                    value={form.shippingRecipient}
                    onChange={(e) => (form.shippingRecipient = e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shippingPhone">Shipping phone</Label>
                  <Input
                    id="shippingPhone"
                    required
                    value={form.shippingPhone}
                    onChange={(e) => (form.shippingPhone = e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shippingAddressLine1">Address line 1</Label>
                  <Input
                    id="shippingAddressLine1"
                    required
                    value={form.shippingAddressLine1}
                    onChange={(e) => (form.shippingAddressLine1 = e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shippingAddressLine2">Address line 2</Label>
                  <Input
                    id="shippingAddressLine2"
                    value={form.shippingAddressLine2}
                    onChange={(e) => (form.shippingAddressLine2 = e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    required
                    value={form.shippingCity}
                    onChange={(e) => (form.shippingCity = e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment method</Label>
                  <select
                    id="paymentMethod"
                    value={form.paymentMethod}
                    onChange={(e) => (form.paymentMethod = e.target.value as any)}
                    className="block w-full border-0 border-b border-black/30 bg-transparent px-4 py-3 text-black font-sans text-sm outline-none focus:border-b-2 focus:border-black"
                  >
                    <option value="cod">Cash on delivery</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank transfer</option>
                  </select>
                </div>
              </div>

              {message && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-900">
                  {message}
                </p>
              )}

              <Button
                type="submit"
                onClick={handlePlaceOrder}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Placing order…" : "Place order"}
              </Button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

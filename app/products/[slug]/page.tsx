import { getProductBySlug, getVariantsForProduct } from "@/repositories/product.repositories";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Product – Nike",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const variants = await getVariantsForProduct(slug);

  if (!product) {
    return (
      <div className="bg-white text-black min-h-screen flex flex-col items-center justify-center py-24 px-6">
        <Navbar />
        <h1 className="text-[48px] font-black uppercase tracking-tight">Not found</h1>
        <Link href="/products" className="mt-8 text-[11px] font-bold uppercase tracking-widest hover:text-black/60">
          Back to products
          <span className="ml-1 text-[10px]">→</span>
        </Link>
      </div>
    );
  }

  const primaryImage = product.primary_image_url || "/photos/Gear5.png";

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-12 px-6">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/products"
            className="inline-block mb-8 text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
          >
            ← Back to products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="relative aspect-[1] bg-black/5">
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-8">
              <div>
                {product.brand_name && (
                  <span className="block mb-2 text-[10px] font-bold uppercase tracking-widest text-black/50">
                    {product.brand_name}
                  </span>
                )}
                <h1 className="mb-4 text-[40px] font-black uppercase leading-tight">
                  {product.name}
                </h1>
              </div>

              <VariantSelector variants={variants} productId={product.id} />

              {product.description && (
                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest">
                    Description
                  </h3>
                  <p className="text-[13px] leading-relaxed text-black/80">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VariantSelector({ variants, productId }: { variants: any[]; productId: string }) {
  const [selected, setSelected] = useState<string | null>(variants[0]?.id || null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  const variant = variants.find((v) => v.id === selected);
  const price = variant
    ? `BDT ${Number(variant.sale_price || variant.regular_price).toFixed(2)}`
    : "Price on request";

  const handleAddToCart = async () => {
    if (!selected) return;
    setMessage("");
    try {
      let session = localStorage.getItem("cart_session");
      let cartId: string;

      if (!session) {
        const cart = await api.post("/api/carts", { sessionKey: `cart_${Date.now()}` });
        cartId = cart.cart.id;
        localStorage.setItem("cart_session", cartId);
      } else {
        cartId = session;
      }

      await api.post("/api/cart/items", {
        cartId,
        variantId: selected,
        quantity: qty,
      });
      setMessage("Added to bag");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to add to bag");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Size / Variant</Label>
        <div className="grid grid-cols-2 gap-3">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`flex flex-col items-center justify-center py-4 border rounded-none text-[12px] font-bold uppercase tracking-widest transition-colors ${
                selected === v.id
                  ? "border-black bg-black text-white"
                  : "border-black/30 text-black hover:border-black"
              }`}
            >
              <span>{v.name}</span>
              <span className="mt-1 text-[10px] font-bold text-black/50">
                {v.sku}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Price</Label>
        <span className="text-[20px] font-black tracking-tight">{price}</span>
        {variant?.sale_price && (
          <span className="text-[12px] font-bold text-black/50 line-through">
            BDT ${Number(variant.regular_price).toFixed(2)}
          </span>
        )}
      </div>

      <div>
        <Label>Quantity</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center border-b-0 border-b focus:border-b-2"
          />
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        className="w-full"
        disabled={!selected}
      >
        Add to bag
      </Button>

      {message && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-black/60">
          {message}
        </p>
      )}
    </div>
  );
}


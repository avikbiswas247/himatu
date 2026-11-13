"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Manage products – Nike",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      const res = await api.get("/api/products", { search, page: 1, pageSize: 50 });
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white text-black min-h-screen flex flex-col items-center justify-center py-24">
        <Navbar />
        <h1 className="text-[48px] font-black uppercase tracking-tight">Loading…</h1>
      </div>
    );
  }

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-16 px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="mb-2 text-[32px] font-black uppercase tracking-tight">Manage products</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                Product catalogue
              </p>
            </div>
            <Link
              href="/products"
              className="px-6 py-3 border border-black text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
            >
              View storefront
            </Link>
          </div>

          <div className="flex items-end gap-4 mb-8">
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80"
            />
            <Button
              onClick={() => (window.location.href = "/admin/products/new")}
              className="px-8 py-3"
            >
              Add product
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Image</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Name</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">SKU</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Price</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Status</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-black/10 hover:bg-black/5 transition-colors"
                  >
                    <td className="py-4">
                      <div className="w-12 h-12 overflow-hidden bg-black/5 flex-shrink-0">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-black/30">IMG</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-[13px] font-bold">{product.name}</td>
                    <td className="py-4 text-[12px] text-black/60">{product.sku || "—"}</td>
                    <td className="py-4 text-[13px] font-bold">
                      BDT {Number(product.starting_price || 0).toFixed(2)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block px-2 py-0.5 border rounded-none text-[9px] font-bold uppercase tracking-widest ${
                          product.status === "active"
                            ? "border-black text-black"
                            : "border-black/30 text-black/60"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60 mr-4"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-[20px] font-black uppercase tracking-tight mb-4">No products found</h2>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

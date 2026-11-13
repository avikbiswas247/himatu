"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export type ProductCardProps = {
  product: any;
};

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const image = product.primary_image_url || "/photos/Gear5.png";
  const price = product.starting_price
    ? `BDT ${Number(product.starting_price).toFixed(2)}`
    : "Price on request";

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden bg-white cursor-pointer"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {hovered && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline">
              <Link href={`/products/${product.slug}`}>View product</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="mt-4 px-2">
        <Link
          href={`/products/${product.slug}`}
          className="block mb-1 text-[13px] font-bold uppercase tracking-widest text-black hover:text-black/60"
        >
          {product.name}
        </Link>
        <span className="text-[12px] font-bold tracking-tight text-black">{price}</span>
      </div>
    </article>
  );
}

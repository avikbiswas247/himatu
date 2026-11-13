import Link from "next/link";
import { listProducts } from "@/repositories/product.repositories";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Nike",
  description: "Just do it.",
};

export default async function Home() {
  const { data: products } = await listProducts({ pageSize: 8 });

  return (
    <div className="bg-white text-black">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[85vh] w-full flex items-center justify-center bg-black overflow-hidden">
        <img
          src="/photos/Gear5.png"
          alt="Nike Hero"
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-60"
        />
        <div className="mx-auto max-w-[1400px] px-6 text-center">
          <span className="inline-block mb-4 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-black">
            New season
          </span>
          <h1 className="mb-6 text-[8vw] font-black uppercase leading-none">
            Just Do It.
          </h1>
          <p className="mb-8 text-[14px] font-semibold tracking-tight max-w-md mx-auto opacity-80">
            Elevate your game with the latest from Nike.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-black/90"
          >
            Shop collection
            <span className="ml-2 text-[10px]">→</span>
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-[24px] font-black uppercase tracking-tight">Featured</h2>
            <Link
              href="/products"
              className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
            >
              View all
              <span className="ml-1 text-[10px]">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {(products || []).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const image = product.primary_image_url || "/photos/Gear5.png";
  const price = product.starting_price
    ? `BDT ${Number(product.starting_price).toFixed(2)}`
    : "Price on request";

  return (
    <article className="group relative overflow-hidden bg-white">
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/products/${product.slug}`}
            className="px-6 py-3 border border-white text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-black"
          >
            View product
          </Link>
        </div>
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

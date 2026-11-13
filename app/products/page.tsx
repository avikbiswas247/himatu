import { listProducts } from "@/repositories/product.repositories";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Products – Nike",
  description: "Shop the latest Nike collection.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const brand = typeof searchParams.brand === "string" ? searchParams.brand : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;

  const { data: products, total, page: currentPage, totalPages } = await listProducts({
    category,
    brand,
    search,
    page,
    pageSize: 24,
  });

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-16 px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-[32px] font-black uppercase tracking-tight mb-2">
                {search ? `Search results for "${search}"` : "All products"}
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                {total} results
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
            >
              Admin
              <span className="ml-1 text-[10px]">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {(products || []).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-between">
              {currentPage > 1 && (
                <Link
                  href={`?page=${currentPage - 1}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                  className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={`?page=${currentPage + 1}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                  className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
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

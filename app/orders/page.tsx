import { listOrders } from "@/repositories/orders.repositories";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Orders – Nike",
};

export default async function OrdersPage() {
  const { data: orders } = await listOrders({ pageSize: 20 });

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-16 px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="mb-12 text-[32px] font-black uppercase tracking-tight">Your orders</h1>

          {(orders || []).length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-[20px] font-black uppercase tracking-tight mb-4">No orders yet</h2>
              <p className="text-[13px] text-black/60 mb-8">Start shopping to see your orders here.</p>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-black/90"
              >
                Shop collection
                <span className="ml-2 text-[10px]">→</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-4 text-[11px] font-bold uppercase tracking-widest text-black/50">Order #</th>
                    <th className="pb-4 text-[11px] font-bold uppercase tracking-widest text-black/50">Date</th>
                    <th className="pb-4 text-[11px] font-bold uppercase tracking-widest text-black/50">Status</th>
                    <th className="pb-4 text-[11px] font-bold uppercase tracking-widest text-black/50 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).map((order: any) => (
                    <tr
                      key={order.id}
                      className="border-b border-black/10 hover:bg-black/5 transition-colors"
                    >
                      <td className="py-4 text-[13px] font-bold">
                        {order.order_number}
                      </td>
                      <td className="py-4 text-[13px] text-black/60">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-3 py-1 border rounded-none text-[10px] font-bold uppercase tracking-widest ${
                            order.status === "delivered"
                              ? "border-black text-black"
                              : order.status === "cancelled"
                              ? "border-black/40 text-black/40"
                              : "border-black/30 text-black/60"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-[13px] font-bold text-right">
                        BDT {Number(order.grand_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

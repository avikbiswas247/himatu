"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Manage orders – Nike",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get("/api/orders", { page: 1, pageSize: 50 });
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.post(`/api/orders/${orderId}/status`, {
        action: "transition",
        newStatus,
        note: "Updated from admin dashboard",
      });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
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
              <h1 className="mb-2 text-[32px] font-black uppercase tracking-tight">Manage orders</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                Order management
              </p>
            </div>
            <Link
              href="/checkout"
              className="px-6 py-3 border border-black text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
            >
              Place new order
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Order #</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Customer</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Date</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Total</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Status</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-black/10 hover:bg-black/5 transition-colors"
                  >
                    <td className="py-4 text-[13px] font-bold">{order.order_number}</td>
                    <td className="py-4 text-[13px]">{order.customer_name}</td>
                    <td className="py-4 text-[12px] text-black/60">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-[13px] font-bold text-right">
                      BDT {Number(order.grand_total).toFixed(2)}
                    </td>
                    <td className="py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="border-0 border-b border-black/30 bg-transparent px-2 py-1 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-b-2 focus:border-black"
                      >
                        {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-[20px] font-black uppercase tracking-tight mb-4">No orders found</h2>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

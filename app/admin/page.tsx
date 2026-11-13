import { listOrders } from "@/repositories/orders.repositories";
import { listUsers } from "@/repositories/users.repositories";
import { listProducts } from "@/repositories/product.repositories";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard – Nike",
};

export default async function AdminDashboard() {
  const [ordersData, usersData, productsData] = await Promise.all([
    listOrders({ pageSize: 5 }),
    listUsers({ pageSize: 5 }),
    listProducts({ pageSize: 5 }),
  ]);

  const orders = ordersData.data || [];
  const users = usersData.data || [];
  const products = productsData.data || [];

  return (
    <div className="bg-white text-black">
      <Navbar />

      <section className="py-16 px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h1 className="mb-2 text-[32px] font-black uppercase tracking-tight">Admin dashboard</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                HIMATU · Commerce management
              </p>
            </div>
            <Link
              href="/admin/products"
              className="px-6 py-3 border border-black text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
            >
              Manage products
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <StatCard title="Total orders" value={ordersData.total} trend="+12% vs last month" />
            <StatCard title="Total customers" value={usersData.total} trend="+8% vs last month" />
            <StatCard title="Active products" value={productsData.total} trend="+5 new this week" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <RecentOrders orders={orders} />
            <RecentUsers users={users} />
            <FeaturedProducts products={products} />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string; value: number; trend: string }) {
  return (
    <div className="border border-black p-8">
      <div className="flex justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{title}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{trend}</span>
      </div>
      <div className="text-[32px] font-black tracking-tight">{value}</div>
    </div>
  );
}

function RecentOrders({ orders }: { orders: any[] }) {
  return (
    <div>
      <h2 className="mb-8 text-[14px] font-bold uppercase tracking-widest">Recent orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-black/50">Order #</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Total</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-black/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr
                key={order.id}
                className="border-b border-black/10 hover:bg-black/5 transition-colors"
              >
                <td className="py-3 text-[12px] font-bold">{order.order_number}</td>
                <td className="py-3 text-[12px] font-bold text-right">
                  BDT {Number(order.grand_total).toFixed(2)}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block px-2 py-0.5 border rounded-none text-[9px] font-bold uppercase tracking-widest ${
                      order.status === "delivered"
                        ? "border-black text-black"
                        : "border-black/30 text-black/60"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/admin/orders"
        className="block mt-6 text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
      >
        View all orders
        <span className="ml-1 text-[10px]">→</span>
      </Link>
    </div>
  );
}
function RecentUsers({ users }: { users: any[] }) {
  return (
    <div>
      <h2 className="mb-8 text-[14px] font-bold uppercase tracking-widest">Recent customers</h2>
      <div className="space-y-4">
        {users.map((user: any) => (
          <div
            key={user.id}
            className="flex items-center gap-4 border-b border-black/10 pb-4"
          >
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <span className="text-[10px] font-bold">{user.full_name?.charAt(0) || "?"}</span>
            </div>
            <div>
              <div className="text-[12px] font-bold">{user.full_name}</div>
              <div className="text-[11px] text-black/50">{user.email || user.phone}</div>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/admin/users"
        className="block mt-6 text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
      >
        View all users
        <span className="ml-1 text-[10px]">→</span>
      </Link>
    </div>
  );
}
function FeaturedProducts({ products }: { products: any[] }) {
  return (
    <div>
      <h2 className="mb-8 text-[14px] font-bold uppercase tracking-widest">Featured products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {products.map((product: any) => (
          <div
            key={product.id}
            className="flex items-center gap-4 border-b border-black/10 pb-4"
          >
            <div className="w-16 h-16 overflow-hidden bg-black/5 flex-shrink-0">
              {product.primary_image_url ? (
                <img
                  src={product.primary_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-black/30">IMG</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-[12px] font-bold">{product.name}</div>
              <div className="text-[11px] text-black/50">{product.sku || "—"}</div>
            </div>
            <div className="text-[12px] font-bold ml-auto">
              BDT {Number(product.starting_price || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/admin/products"
        className="block mt-6 text-[11px] font-bold uppercase tracking-widest hover:text-black/60"
      >
        View all products
        <span className="ml-1 text-[10px]">→</span>
      </Link>
    </div>
  );
}

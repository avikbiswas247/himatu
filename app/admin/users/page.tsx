"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api/client";

export const metadata = {
  title: "Manage users – Nike",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/users", { page: 1, pageSize: 50 });
      setUsers(res.data || []);
    } catch {
      setUsers([]);
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
              <h1 className="mb-2 text-[32px] font-black uppercase tracking-tight">Manage users</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/50">
                Customer management
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Avatar</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Name</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Email</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Phone</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50">Status</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr
                    key={user.id}
                    className="border-b border-black/10 hover:bg-black/5 transition-colors"
                  >
                    <td className="py-4">
                      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold">{user.full_name?.charAt(0) || "?"}</span>
                      </div>
                    </td>
                    <td className="py-4 text-[13px] font-bold">{user.full_name}</td>
                    <td className="py-4 text-[12px] text-black/60">{user.email || "—"}</td>
                    <td className="py-4 text-[12px] text-black/60">{user.phone || "—"}</td>
                    <td className="py-4">
                      <span
                        className={`inline-block px-2 py-0.5 border rounded-none text-[9px] font-bold uppercase tracking-widest ${
                          user.is_active !== false
                            ? "border-black text-black"
                            : "border-black/30 text-black/60"
                        }`}
                      >
                        {user.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 text-[12px] text-black/60 text-right">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-[20px] font-black uppercase tracking-tight mb-4">No users found</h2>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

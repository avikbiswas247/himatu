"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const topLinks = [
  { label: "NEW", href: "/products?status=new" },
  { label: "MEN", href: "/products?category=men" },
  { label: "WOMEN", href: "/products?category=women" },
  { label: "KIDS", href: "/products?category=kids" },
  { label: "ACCESSORIES", href: "/products?category=accessories" },
];

const accountLinks = [
  { label: "Profile", href: "/account" },
  { label: "Orders", href: "/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Sign out", href: "/login" },
];

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
  { label: "Admin", href: "/admin" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const handleCart = async () => {
    try {
      const res = await api.get("/api/carts", {
        sessionKey: typeof window !== "undefined" ? (localStorage.getItem("cart_session") || "") : "",
      });
      if (res?.cart?.id) {
        localStorage.setItem("cart_session", res.cart.id);
        const items = await api.get(`/api/cart/items?cartId=${res.cart.id}`);
        setCartCount(items.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {/* Top promo bar */}
      <div className="bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-1.5 flex items-center justify-between">
        <span>Free shipping on all orders</span>
        <span>NikePlus member exclusive access</span>
      </div>

      {/* Main nav */}
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[14px] font-black uppercase tracking-tighter">NIKE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-black">
            {topLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`hover:text-black/60 transition-colors ${pathname === l.href ? "text-black/60" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[11px] font-bold uppercase hover:text-black/60"
            >
              <Search className="w-4 h-4" />
              <span className="ml-1">Search</span>
            </button>
            <button onClick={handleCart} className="relative p-2">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <Link href="/admin" className="p-2 text-[11px] font-bold uppercase hover:text-black/60">
              Admin
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black">
              <button
                onClick={() => setMenuOpen(false)}
                className="text-[11px] font-bold uppercase"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 mr-2" /> Close
              </button>
              <Link href="/" className="text-[14px] font-black uppercase tracking-tighter">NIKE</Link>
            </div>
            <div className="px-6 py-6 space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-2 block">Shop</span>
                {topLinks.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-[13px] font-bold py-2 hover:bg-black/5"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-2 block">Account</span>
                {accountLinks.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-[13px] font-bold py-2 hover:bg-black/5"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="space-y-4 pt-4 border-t border-black/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-2 block">More</span>
                {footerLinks.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-[13px] font-bold py-2 hover:bg-black/5"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black">
              <button
                onClick={() => setSearchOpen(false)}
                className="text-[11px] font-bold uppercase"
                aria-label="Close search"
              >
                <X className="w-4 h-4 mr-2" /> Close
              </button>
              <Link href="/" className="text-[14px] font-black uppercase tracking-tighter">NIKE</Link>
            </div>
            <form onSubmit={handleSearch} className="px-6 py-6">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
              />
            </form>
          </div>
        )}
      </header>
    </>
  );
}


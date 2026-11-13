
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, UserRound } from "lucide-react";

type MenuGroup = {
  title: string;
  links: { label: string; href: string }[];
};

type MenuData = {
  heading: string;
  groups: MenuGroup[];
  feature: {
    title: string;
    description: string;
    href: string;
  };
};

const menus: Record<string, MenuData> = {
  NEW: {
    heading: "Just landed",
    groups: [
      {
        title: "Discover",
        links: [
          { label: "Shop all new", href: "/collections/new" },
          { label: "Latest arrivals", href: "/collections/new" },
          { label: "Trending now", href: "/collections/trending" },
        ],
      },
      {
        title: "Explore Himatu",
        links: [
          { label: "Best sellers", href: "/collections/best-sellers" },
          { label: "Featured products", href: "/collections/featured" },
          { label: "Shop all", href: "/shop" },
        ],
      },
    ],
    feature: {
      title: "Something new is here.",
      description: "Discover the latest from Himatu.",
      href: "/collections/new",
    },
  },

  DESKBOTS: {
    heading: "Meet your next companion",
    groups: [
      {
        title: "Shop",
        links: [
          { label: "All DeskBots", href: "/collections/desk-bots" },
          { label: "New arrivals", href: "/collections/new-desk-bots" },
          { label: "Best sellers", href: "/collections/best-sellers" },
        ],
      },
      {
        title: "Discover",
        links: [
          { label: "AI companions", href: "/collections/ai-companions" },
          { label: "Desk accessories", href: "/collections/accessories" },
          { label: "Our technology", href: "/about" },
        ],
      },
    ],
    feature: {
      title: "More than a desk accessory.",
      description: "Find a little personality for your workspace.",
      href: "/collections/desk-bots",
    },
  },

  ANIME: {
    heading: "Made for your fandom",
    groups: [
      {
        title: "Shop by collection",
        links: [
          { label: "All anime", href: "/collections/anime" },
          { label: "One Piece", href: "/collections/one-piece" },
          { label: "Bleach", href: "/collections/bleach" },
        ],
      },
      {
        title: "More to explore",
        links: [
          { label: "Attack on Titan", href: "/collections/attack-on-titan" },
          { label: "Collectibles", href: "/collections/collectibles" },
          { label: "New releases", href: "/collections/new-anime" },
        ],
      },
    ],
    feature: {
      title: "Your world. Your collection.",
      description: "Explore pieces inspired by the stories you love.",
      href: "/collections/anime",
    },
  },

  APPAREL: {
    heading: "Wear what you love",
    groups: [
      {
        title: "Clothing",
        links: [
          { label: "All apparel", href: "/collections/apparel" },
          { label: "T-shirts", href: "/collections/t-shirts" },
          { label: "Hoodies", href: "/collections/hoodies" },
        ],
      },
      {
        title: "Discover",
        links: [
          { label: "New arrivals", href: "/collections/new-apparel" },
          { label: "Graphic tees", href: "/collections/graphic-tees" },
          { label: "Best sellers", href: "/collections/best-sellers" },
        ],
      },
    ],
    feature: {
      title: "Make it yours.",
      description: "Everyday essentials with a little more character.",
      href: "/collections/apparel",
    },
  },

  ACCESSORIES: {
    heading: "The finishing touches",
    groups: [
      {
        title: "Shop accessories",
        links: [
          { label: "All accessories", href: "/collections/accessories" },
          { label: "Bags", href: "/collections/bags" },
          { label: "Desk accessories", href: "/collections/desk-accessories" },
        ],
      },
      {
        title: "Discover",
        links: [
          { label: "New arrivals", href: "/collections/new-accessories" },
          { label: "Gift ideas", href: "/collections/gifts" },
          { label: "Shop all", href: "/shop" },
        ],
      },
    ],
    feature: {
      title: "Small details. Big personality.",
      description: "Find the finishing touch for your setup.",
      href: "/collections/accessories",
    },
  },

  COLLECTIBLES: {
    heading: "Worth collecting",
    groups: [
      {
        title: "Collections",
        links: [
          { label: "All collectibles", href: "/collections/collectibles" },
          { label: "Figures", href: "/collections/figures" },
          { label: "Limited editions", href: "/collections/limited-editions" },
        ],
      },
      {
        title: "Explore",
        links: [
          { label: "Anime collectibles", href: "/collections/anime-collectibles" },
          { label: "Featured pieces", href: "/collections/featured" },
          { label: "New arrivals", href: "/collections/new" },
        ],
      },
    ],
    feature: {
      title: "Find your next favourite.",
      description: "Discover pieces made to be displayed.",
      href: "/collections/collectibles",
    },
  },
};

const categories = Object.keys(menus);

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Close the menu when the user presses Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const currentMenu = activeMenu ? menus[activeMenu] : null;

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full bg-white text-black"
        
      >
        {/* Main navigation */}
        <div className="relative flex h-20 items-center justify-between px-5 md:px-10">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Himatu home"
            className="flex flex-1 items-center"
            onFocus={() => setActiveMenu(null)}
          >
            <img
              src="/photos/HIMATU-LOGO-BLACK.png"
              alt="Himatu"
              width={75}
              height={75}
              className="h-14 w-14 object-contain"
            />
          </Link>

          {/* Desktop category links */}
          <nav
            className="hidden flex-1 items-center justify-center gap-6 lg:flex"
            aria-label="Main navigation"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-expanded={activeMenu === category}
                aria-controls="himatu-mega-menu"
                onMouseEnter={() => setActiveMenu(category)}
                onFocus={() => setActiveMenu(category)}
                onClick={() =>
                  setActiveMenu((current) =>
                    current === category ? null : category
                  )
                }
                onMouseLeave={() => setActiveMenu(null)}
                className={`relative whitespace-nowrap py-3 text-xs font-semibold
                  uppercase tracking-wide transition-colors
                  after:absolute after:bottom-1 after:left-0 after:h-px
                  after:w-full after:origin-left after:bg-current
                  after:transition-transform after:duration-200
                  ${
                    activeMenu === category
                      ? "after:scale-x-100"
                      : "after:scale-x-0 hover:after:scale-x-100"
                  }`}
              >
                {category}
              </button>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex flex-1 items-center justify-end gap-4">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-full p-2 transition-colors hover:bg-neutral-100"
            >
              <Search size={20} strokeWidth={1.7} />
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              className="hidden rounded-full p-2 transition-colors hover:bg-neutral-100 sm:inline-flex"
            >
              <UserRound size={20} strokeWidth={1.7} />
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping bag"
              className="rounded-full p-2 transition-colors hover:bg-neutral-100"
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        {/* Mega menu panel */}
        <div
          id="himatu-mega-menu"
          aria-label="Category submenu"
          aria-hidden={!currentMenu}
          className={`absolute left-0 top-full w-full overflow-hidden
            border-t border-neutral-100 bg-white shadow-sm
            transition-[opacity,visibility,transform] duration-200 ease-out
            ${
              currentMenu
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-2 opacity-0"
            }`}
        >
          {currentMenu && (
            <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-8 md:px-12">
              <h2 className="mb-8 text-2xl font-semibold tracking-tight">
                {currentMenu.heading}
              </h2>

              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {currentMenu.groups.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-4 text-sm font-semibold">
                      {group.title}
                    </h3>

                    <ul className="space-y-3">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={() => setActiveMenu(null)}
                            className="text-sm text-neutral-500 transition-colors hover:text-black"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Editorial feature card */}
                <Link
                  href={currentMenu.feature.href}
                  onClick={() => setActiveMenu(null)}
                  className="group col-span-2 flex min-h-40 flex-col
                    justify-between bg-neutral-100 p-6 transition-colors
                    hover:bg-neutral-200 md:col-span-2"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    HIMATU / DISCOVER
                  </span>

                  <div>
                    <h3 className="mb-2 text-xl font-semibold tracking-tight">
                      {currentMenu.feature.title}
                    </h3>

                    <p className="text-sm text-neutral-600">
                      {currentMenu.feature.description}
                    </p>

                    <span className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                      Explore collection
                      <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Dim the page behind the menu; click it to close */}
      {activeMenu && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setActiveMenu(null)}
          className="fixed inset-x-0 bottom-0 top-20 z-40
            cursor-default bg-black/30"
        />
      )}
    </>
  );
}

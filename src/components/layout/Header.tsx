import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Leaf,
  Search,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Plant, PlantStatus } from "../../types/store";

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const {
    tenantId,
    cartCount,
    wishlist,
    activeCategories,
    searchPlants,
    openCart,
    openPlantAdvisor,
    isAdminLoggedIn,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Live server-side search via Convex
  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));
  const liveSearchResults = useQuery(
    api.modules.storefront.index.searchProducts,
    isRealTenant && searchQuery.trim()
      ? { tenantId: tenantId as Id<"tenants">, query: searchQuery.trim(), limit: 5 }
      : "skip",
  );

  // Real-time search computed directly via useMemo
  const searchResults: Plant[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    if (liveSearchResults && liveSearchResults.length > 0) {
      return liveSearchResults.map((p) => ({
        _id: p._id,
        tenantId: p.tenantId,
        categoryIds: p.categoryIds,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        careDetails: p.careDetails,
        careLevel: "Easy",
        light: "Bright indirect light",
        watering: "Weekly",
        price: p.price,
        mrp: p.mrp,
        stockQty: p.stockQty,
        imageUrls: p.imageUrls,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isTrending: p.isTrending,
        status: p.status as PlantStatus,
      }));
    }
    return searchPlants(searchQuery).slice(0, 5);
  }, [searchQuery, liveSearchResults, searchPlants]);

  // Click outside search containers to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = searchContainerRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* 1. Announcement Banner */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="font-medium">
              Free doorstep express delivery over ₹499 • Use code{" "}
              <strong className="text-white underline tracking-wider">GREEN10</strong> for 10%
              off
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-emerald-200">
            <button
              onClick={() => onNavigate("track")}
              className="hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" /> Track Order
            </button>
            <span className="text-emerald-700">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Live Plant Guarantee
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate("storefront")}
            className="flex items-center gap-2.5 text-emerald-800 hover:opacity-90 transition group cursor-pointer text-left shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-stone-900 block leading-none">
                Verdant<span className="text-emerald-700 font-extrabold">.</span>
              </span>
              <span className="text-[10px] tracking-widest font-bold text-stone-500 uppercase block">
                Plant Nursery
              </span>
            </div>
          </button>

          {/* Desktop Search Bar */}
          <div
            ref={searchContainerRef}
            className="hidden md:flex flex-1 max-w-md relative mx-4"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search indoor plants, succulents, planters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-stone-100/80 hover:bg-stone-100 focus:bg-white pl-10 pr-4 py-2.5 rounded-full text-sm text-stone-900 placeholder:text-stone-400 border border-transparent focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-3 bg-stone-50 border-b border-stone-100 text-xs font-bold text-stone-500 uppercase tracking-wider flex justify-between">
                  <span>Matching Plants ({searchResults.length})</span>
                  <span>Press enter to see all</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-stone-500">
                    No plants matched &quot;{searchQuery}&quot;. Try searching &quot;Monstera&quot; or &quot;Snake&quot;.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
                    {searchResults.map((plant: Plant) => (
                      <button
                        key={plant._id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery("");
                          onNavigate("categoryPlants", plant.categoryIds[0]);
                        }}
                        className="w-full p-3 flex items-center gap-3 hover:bg-stone-50 transition text-left cursor-pointer"
                      >
                        <img
                          src={plant.imageUrls[0]}
                          alt={plant.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {plant.name}
                          </h4>
                          <p className="text-xs text-stone-500 truncate">
                            {plant.light} • {plant.watering}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-800 block">
                            ₹{plant.price}
                          </span>
                          {plant.mrp && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{plant.mrp}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-stone-700">
            <button
              onClick={() => onNavigate("storefront")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                currentRoute === "storefront"
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "hover:bg-stone-100"
              }`}
            >
              Home
            </button>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  currentRoute === "categories" || currentRoute === "categoryPlants"
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "hover:bg-stone-100"
                }`}
              >
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {categoriesDropdownOpen && (
                <div
                  onMouseLeave={() => setCategoriesDropdownOpen(false)}
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fade-in"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Browse by Category
                  </div>
                  {activeCategories.slice(0, 6).map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setCategoriesDropdownOpen(false);
                        onNavigate("categoryPlants", cat._id);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        {cat.assignedPlantCount ?? 0}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setCategoriesDropdownOpen(false);
                        onNavigate("categories");
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Categories</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate("trending")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                currentRoute === "trending"
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "hover:bg-stone-100"
              }`}
            >
              Trending Plants
            </button>
          </nav>

          {/* Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Plant Advisor AI */}
            <button
              type="button"
              onClick={openPlantAdvisor}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Plant Advisor AI</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate("trending")}
              title="Saved Wishlist"
              className="relative p-2.5 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-full shadow-sm shadow-emerald-700/20 transition cursor-pointer group active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              <span className="bg-emerald-900/60 text-white text-xs font-extrabold px-2 py-0.5 rounded-full min-w-5 text-center">
                {cartCount}
              </span>
            </button>

            {/* Admin Portal Gateway */}
            <button
              onClick={() => onNavigate(isAdminLoggedIn ? "dashboard" : "login")}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isAdminLoggedIn
                  ? "bg-stone-900 text-stone-100 hover:bg-stone-800"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAdminLoggedIn ? "Admin Dashboard" : "Admin"}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div ref={mobileSearchRef} className="md:hidden pb-4 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-stone-100 pl-10 pr-12 py-2 rounded-full text-xs text-stone-900 placeholder:text-stone-400 border border-transparent focus:border-emerald-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mobile Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-fade-in">
              <div className="p-2.5 bg-stone-50 border-b border-stone-100 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex justify-between">
                <span>Matching Plants ({searchResults.length})</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-500">
                  No plants matched &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                  {searchResults.map((plant: Plant) => (
                    <button
                      key={plant._id}
                      onClick={() => {
                        setIsSearchFocused(false);
                        setSearchQuery("");
                        onNavigate("categoryPlants", plant.categoryIds[0]);
                      }}
                      className="w-full p-2.5 flex items-center gap-2.5 hover:bg-stone-50 transition text-left cursor-pointer"
                    >
                      <img
                        src={plant.imageUrls[0]}
                        alt={plant.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {plant.name}
                        </h4>
                        <span className="text-xs font-black text-emerald-800">
                          ₹{plant.price}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white p-4 space-y-2 animate-fade-in">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("storefront");
            }}
            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-50"
          >
            Home
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("categories");
            }}
            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-50"
          >
            All Categories ({activeCategories.length})
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("trending");
            }}
            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-50"
          >
            Trending Plants
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openPlantAdvisor();
            }}
            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Plant Advisor AI</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("track");
            }}
            className="w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-stone-500" />
            <span>Track Order</span>
          </button>
          <div className="pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate(isAdminLoggedIn ? "dashboard" : "login");
              }}
              className="w-full text-left py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50"
            >
              {isAdminLoggedIn ? "Go to Admin Dashboard" : "Admin Sign In"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

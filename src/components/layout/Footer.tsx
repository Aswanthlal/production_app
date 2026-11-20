import React, { useState } from "react";
import {
  Leaf,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Send,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { useStore } from "../../context/StoreContext";

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const { categories } = useStore();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const getTargetCategoryId = (preferenceKeywords: string[]): string => {
    for (const kw of preferenceKeywords) {
      const match = categories.find(
        (c) =>
          c.slug.toLowerCase().includes(kw) ||
          c._id === kw ||
          c.name.toLowerCase().includes(kw),
      );
      if (match) return match._id;
    }
    return categories[0]?._id ?? "plants";
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setIsSubscribed(true);
    success("Subscribed!", "Thank you for joining our gardening community! Check your inbox soon.");
    setEmail("");
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-14 border-b border-stone-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Live Arrival Guarantee</h4>
              <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                Damaged during transit? We replace it completely free within 48 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/50">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Express Plant Courier</h4>
              <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                Ventilated, shock-proof packaging designed for delicate leaves.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/50">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Expert Advice</h4>
              <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                Complimentary plant care guide with every botanical purchase.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/50">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Organic Soil</h4>
              <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                Potted in nutrient-dense compost and coco-peat mix.
              </p>
            </div>
          </div>
        </div>

        {/* Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-14 border-b border-stone-800">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 text-white mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight">Verdant.</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm mb-6">
              Your neighborhood direct-to-consumer online plant nursery. We nurture, condition, and deliver flourishing plants straight from green growers to your sanctuary.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-900/60 rounded-xl px-3.5 py-2 w-fit">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Over 50,000+ happy plants delivered across India</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Explore Collections
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate("categories")}
                  className="hover:text-emerald-400 transition"
                >
                  All Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("trending")}
                  className="hover:text-emerald-400 transition"
                >
                  Trending Plants
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("categoryPlants", getTargetCategoryId(["indoor", "plants", "plant"]))}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Indoor Plants
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("categoryPlants", getTargetCategoryId(["air", "purifying", "care"]))}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Air Purifying
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("categoryPlants", getTargetCategoryId(["succulent", "pots", "planter"]))}
                  className="hover:text-emerald-400 transition cursor-pointer"
                >
                  Succulents & Cacti
                </button>
              </li>
            </ul>
          </div>

          {/* Shopper Assistance */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Shopper Help
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate("storefront")}
                  className="hover:text-emerald-400 transition"
                >
                  Shipping & Packaging
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("storefront")}
                  className="hover:text-emerald-400 transition"
                >
                  Plant Care Encyclopedia
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("login")}
                  className="hover:text-emerald-400 transition"
                >
                  Store Admin Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("storefront")}
                  className="hover:text-emerald-400 transition"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Plant Care Newsletter
            </h5>
            <p className="text-xs text-stone-400 leading-relaxed mb-4">
              Receive seasonal gardening schedules, watering alerts, and exclusive subscriber promotions.
            </p>
            {isSubscribed ? (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>You&apos;re subscribed! Welcome to Verdant.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-800 text-white placeholder:text-stone-500 text-xs px-3.5 py-2.5 rounded-xl border border-stone-700 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-700 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition"
                    title="Subscribe"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-stone-500 block">
                  No spam, ever. Unsubscribe anytime in 1 click.
                </span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Verdant Nursery Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

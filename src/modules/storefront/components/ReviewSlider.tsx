import React, { useState, useMemo } from "react";
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useStore } from "../../../context/StoreContext";
import { customerReviews } from "../sampleData";

export const ReviewSlider: React.FC = () => {
  const { tenantId } = useStore();
  const isRealTenant = Boolean(tenantId && !tenantId.startsWith("tenant_"));
  const liveReviews = useQuery(
    api.modules.storefront.index.listApprovedReviews,
    isRealTenant ? { tenantId: tenantId as Id<"tenants"> } : "skip",
  );

  const reviews = useMemo(() => {
    if (liveReviews && liveReviews.length > 0) {
      return liveReviews.map((r) => ({
        _id: r._id,
        name: r.name,
        city: r.city,
        rating: r.rating,
        comment: r.comment,
        verifiedBuyer: r.verifiedBuyer,
        avatarUrl: r.avatarUrl,
        plantName: r.plantName,
      }));
    }
    return customerReviews;
  }, [liveReviews]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const activeIndex = reviews.length > 0 ? currentIndex % reviews.length : 0;
  const rev = reviews[activeIndex] || customerReviews[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section className="bg-emerald-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-6 text-center">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Real Customer Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Loved by Plant Parents Across India
          </h2>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-1 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-current" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-base sm:text-xl font-medium text-emerald-100 italic leading-relaxed">
          &quot;{rev.comment}&quot;
        </p>

        {/* Author Details */}
        <div className="flex items-center justify-center gap-3">
          <img
            src={rev.avatarUrl}
            alt={rev.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
          />
          <div className="text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{rev.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <p className="text-xs text-emerald-300">
              Verified Buyer from {rev.city} • Purchased {rev.plantName}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx ? "w-6 bg-emerald-400" : "w-1.5 bg-emerald-800"
                }`}
                aria-label={`Review ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Next review"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

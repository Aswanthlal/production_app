import React from "react";
import { Wind, Heart, Sun, ArrowUpRight } from "lucide-react";
import { useStore } from "../../../context/StoreContext";

interface PurposeCollectionsProps {
  onSelectCategory: (categoryId: string) => void;
}

export const PurposeCollections: React.FC<PurposeCollectionsProps> = ({
  onSelectCategory,
}) => {
  const { categories } = useStore();

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

  const collections = [
    {
      title: "Clean Air Warriors",
      subtitle: "NASA tested plants that filter household toxins 24/7.",
      targetKeywords: ["air", "purifying", "indoor", "plants"],
      imageUrl: "https://images.unsplash.com/photo-1599685315640-9ceab2f58944?auto=format&fit=crop&w=800&q=80",
      icon: <Wind className="w-5 h-5 text-emerald-300" />,
      accent: "from-emerald-950/90 to-emerald-900/50",
    },
    {
      title: "Hard to Kill Plants",
      subtitle: "Resilient greens that tolerate drought and neglect.",
      targetKeywords: ["low", "maintenance", "care", "succulent"],
      imageUrl: "https://images.unsplash.com/photo-1604762524889-3e2fccbc95f8?auto=format&fit=crop&w=800&q=80",
      icon: <Sun className="w-5 h-5 text-amber-300" />,
      accent: "from-stone-950/90 to-stone-900/50",
    },
    {
      title: "Joyful Flowering",
      subtitle: "Lush flowering varieties providing fragrant blooms.",
      targetKeywords: ["flowering", "flower", "gifts", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=800&q=80",
      icon: <Heart className="w-5 h-5 text-rose-300" />,
      accent: "from-rose-950/90 to-rose-900/50",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
          Lifestyle Botanical Solutions
        </span>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Shop by Purpose
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {collections.map((col) => (
          <div
            key={col.title}
            onClick={() => onSelectCategory(getTargetCategoryId(col.targetKeywords))}
            className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
          >
            <img
              src={col.imageUrl}
              alt={col.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${col.accent}`} />

            <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  {col.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black tracking-tight">{col.title}</h3>
                <p className="mt-1 text-xs text-stone-200 line-clamp-2">{col.subtitle}</p>
                <span className="mt-3 inline-block text-xs font-bold text-emerald-300 underline underline-offset-4">
                  Explore Collection →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

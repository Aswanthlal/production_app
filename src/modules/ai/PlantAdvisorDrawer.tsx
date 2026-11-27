import React, { useState, useMemo } from "react";
import { useAction } from "convex/react";
import {
  Sparkles,
  Send,
  ShoppingBag,
  AlertCircle,
  Sprout,
  Sun,
  Droplets,
  Loader2,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Drawer } from "../../components/ui/Drawer";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useStore } from "../../context/StoreContext";
import type { Plant } from "../../types/store";
import { extractAiErrorMessage } from "./utils";

const SUGGESTED_PROMPTS = [
  "Low light plants for my bedroom",
  "Easy care plants under ₹600",
  "Best air-purifying indoor plants",
  "Flowering plants for a sunny balcony",
];

export const PlantAdvisorDrawer: React.FC = () => {
  const {
    tenantId,
    activePlants,
    addToCart,
    isPlantAdvisorOpen,
    closePlantAdvisor,
    openQuickView,
  } = useStore();

  const askPlantAdvisor = useAction(api.modules.ai.actions.askPlantAdvisor);

  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adviceResult, setAdviceResult] = useState<{
    question: string;
    answer: string;
    recommendedProductIds: string[];
  } | null>(null);

  const matchedPlants: Plant[] = useMemo(() => {
    if (!adviceResult || adviceResult.recommendedProductIds.length === 0) {
      return [];
    }
    const idSet = new Set(adviceResult.recommendedProductIds);
    return activePlants.filter((p) => idSet.has(p._id) && p.status === "active");
  }, [adviceResult, activePlants]);

  const submitQuestion = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) {
      setErrorMsg("Please enter a question about what kind of plant you are looking for.");
      return;
    }

    if (!tenantId || tenantId.startsWith("tenant_")) {
      setErrorMsg("Store catalog is still connecting. Please wait a moment and try again.");
      return;
    }

    setQuestion(clean);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await askPlantAdvisor({
        tenantId: tenantId as Id<"tenants">,
        question: clean,
      });
      setAdviceResult({
        question: clean,
        answer: response.answer,
        recommendedProductIds: response.recommendedProductIds,
      });
    } catch (err: unknown) {
      setErrorMsg(
        extractAiErrorMessage(
          err,
          "Plant Advisor is temporarily unavailable. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitQuestion(question);
  };

  return (
    <Drawer
      isOpen={isPlantAdvisorOpen}
      onClose={closePlantAdvisor}
      width="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="font-black text-stone-900 block leading-tight">
              Plant Advisor AI
            </span>
            <span className="text-[11px] font-medium text-stone-500 block">
              Grounded in live Verdant Nursery stock
            </span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Prompt Input Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <label
            htmlFor="plant-advisor-input"
            className="block text-xs font-bold uppercase tracking-wider text-stone-600"
          >
            Ask about light, room, care level, or budget
          </label>
          <div className="flex gap-2">
            <input
              id="plant-advisor-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Easy air-purifying plant under ₹600..."
              className="flex-1 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={isLoading || !question.trim()}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </div>

          {/* Suggested Prompt Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTED_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isLoading}
                onClick={() => void submitQuestion(chip)}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition cursor-pointer disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </form>

        {/* Error Banner */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Could not fetch AI recommendation</p>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center gap-2.5">
            <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
            <p className="text-xs font-bold text-stone-700">
              Checking live nursery inventory & matching plants...
            </p>
          </div>
        )}

        {/* Empty / Initial State */}
        {!isLoading && !adviceResult && !errorMsg && (
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Sprout className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              Need help choosing the right plant?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              Tell us about your sunlight, space, or watering habits. We will recommend
              plants currently in stock so you can add them straight to your cart.
            </p>
          </div>
        )}

        {/* Advice & Matched Products */}
        {!isLoading && adviceResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Advisor Recommendation
                </span>
                <Badge variant="brand" size="sm">
                  {matchedPlants.length} {matchedPlants.length === 1 ? "match" : "matches"}
                </Badge>
              </div>
              <p className="text-sm text-stone-800 leading-relaxed">
                {adviceResult.answer}
              </p>
            </div>

            {matchedPlants.length === 0 ? (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 text-center">
                No specific active products were matched. Try one of the suggested prompts
                above or ask about indoor, succulent, or flowering plants.
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Recommended In-Stock Plants
                </h4>
                {matchedPlants.map((plant) => {
                  const isOutOfStock =
                    plant.stockQty <= 0 || plant.status === "out-of-stock";
                  const isLowStock = !isOutOfStock && plant.stockQty <= 5;

                  return (
                    <div
                      key={plant._id}
                      className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 shadow-2xs transition flex gap-3.5 items-center"
                    >
                      <button
                        type="button"
                        onClick={() => openQuickView(plant)}
                        className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer"
                      >
                        <img
                          src={plant.imageUrls[0]}
                          alt={plant.name}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <button
                          type="button"
                          onClick={() => openQuickView(plant)}
                          className="text-sm font-bold text-stone-900 hover:text-emerald-800 transition text-left line-clamp-1 cursor-pointer block"
                        >
                          {plant.name}
                        </button>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                          <span className="inline-flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-500" />
                            {plant.light || "Bright indirect"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-sky-500" />
                            {plant.watering || "Weekly"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-stone-900">
                              ₹{plant.price.toLocaleString("en-IN")}
                            </span>
                            {isOutOfStock ? (
                              <Badge variant="danger" size="sm">
                                Out of Stock
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="warning" size="sm">
                                Only {plant.stockQty} left
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                In Stock
                              </Badge>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(plant._id, 1)}
                            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

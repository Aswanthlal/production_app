import React, { useState, useMemo } from "react";
import { useAction } from "convex/react";
import {
  FolderKanban,
  Sprout,
  Plus,
  Trash2,
  Edit3,
  Search,
  ExternalLink,
  LogOut,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useStore } from "../../context/StoreContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Drawer } from "../../components/ui/Drawer";
import type { Plant, PlantStatus } from "../../types/store";
import { AdminOrdersTab } from "../orders/AdminOrdersTab";
import { extractAiErrorMessage } from "../ai/utils";

interface AdminDashboardPageProps {
  username: string;
  onSignOut: () => void;
  onViewStorefront: () => void;
}

export default function AdminDashboardPage({
  username,
  onSignOut,
  onViewStorefront,
}: AdminDashboardPageProps) {
  const {
    tenantId,
    categories,
    plants,
    createCategory,
    deleteCategory,
    createPlant,
    updatePlant,
    deletePlant,
    updateStockQty,
    updatePlantStatus,
    resetToDemoData,
    logoutAdmin,
  } = useStore();

  const generatePlantDraft = useAction(api.modules.ai.actions.generatePlantDraft);
  const generateOpsBrief = useAction(api.modules.ai.actions.generateOpsBrief);

  // AI Ops Brief state
  const [isOpsBriefOpen, setIsOpsBriefOpen] = useState(false);
  const [isOpsBriefLoading, setIsOpsBriefLoading] = useState(false);
  const [opsBriefError, setOpsBriefError] = useState<string | null>(null);
  const [opsBrief, setOpsBrief] = useState<{ summary: string; actions: string[] } | null>(null);

  // AI Plant Auto-Fill state
  const [isAiDraftLoading, setIsAiDraftLoading] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"plants" | "categories" | "orders">("plants");

  // Category creation form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImg, setNewCatImg] = useState("https://images.unsplash.com/photo-1614594573661-f9d3cf1f7fa8?auto=format&fit=crop&w=600&q=80");
  const [newCatFeatured, setNewCatFeatured] = useState(false);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // Plant drawer state (Add or Edit)
  const [isPlantDrawerOpen, setIsPlantDrawerOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [plantFormError, setPlantFormError] = useState<string | null>(null);
  const [plantForm, setPlantForm] = useState<{
    name: string;
    slug: string;
    sku: string;
    categoryIds: string[];
    price: number;
    mrp: number;
    stockQty: number;
    careLevel: "Easy" | "Moderate" | "Expert";
    light: string;
    watering: string;
    description: string;
    careDetails: string;
    keywords: string[];
    imageUrls: string[];
    isTrending: boolean;
    status: PlantStatus;
  }>({
    name: "",
    slug: "",
    sku: "",
    categoryIds: [],
    price: 499,
    mrp: 699,
    stockQty: 15,
    careLevel: "Easy",
    light: "Bright indirect light",
    watering: "Once a week",
    description: "",
    careDetails: "",
    keywords: [],
    imageUrls: ["https://images.unsplash.com/photo-1614594573661-f9d3cf1f7fa8?auto=format&fit=crop&w=800&q=80"],
    isTrending: false,
    status: "active",
  });

  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const [plantFilterCategory, setPlantFilterCategory] = useState("all");

  // KPI Metrics
  const totalPlants = plants.length;
  const activePlantsCount = plants.filter((p) => p.status === "active").length;
  const outOfStockCount = plants.filter((p) => p.stockQty === 0 || p.status === "out-of-stock").length;
  const totalCategories = categories.length;

  // Filtered Plants List
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(plantSearchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(plantSearchQuery.toLowerCase());
      const matchCat =
        plantFilterCategory === "all" || p.categoryIds.includes(plantFilterCategory);
      return matchSearch && matchCat;
    });
  }, [plants, plantSearchQuery, plantFilterCategory]);

  // Handle Category Creation
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError(null);
    if (!newCatName.trim()) {
      setCatFormError("Category name is required.");
      return;
    }
    const res = createCategory({
      name: newCatName,
      slug: newCatSlug,
      description: newCatDesc,
      imageUrl: newCatImg,
      isFeatured: newCatFeatured,
      sortOrder: categories.length + 1,
      status: "active",
    });
    if (res.success) {
      setNewCatName("");
      setNewCatSlug("");
      setNewCatDesc("");
      setCatFormError(null);
    } else if (res.error) {
      setCatFormError(res.error);
    }
  };

  // Open Plant Form for Creating
  const handleOpenAddPlant = () => {
    setEditingPlantId(null);
    setPlantFormError(null);
    setAiDraftError(null);
    setPlantForm({
      name: "",
      slug: "",
      sku: "VD-PLT-" + Math.floor(100 + Math.random() * 900),
      categoryIds: categories[0] ? [categories[0]._id] : [],
      price: 499,
      mrp: 699,
      stockQty: 15,
      careLevel: "Easy",
      light: "Bright indirect light",
      watering: "Once a week",
      description: "",
      careDetails: "",
      keywords: [],
      imageUrls: ["https://images.unsplash.com/photo-1614594573661-f9d3cf1f7fa8?auto=format&fit=crop&w=800&q=80"],
      isTrending: false,
      status: "active",
    });
    setIsPlantDrawerOpen(true);
  };

  // Open Plant Form for Editing
  const handleOpenEditPlant = (plant: Plant) => {
    setEditingPlantId(plant._id);
    setPlantFormError(null);
    setAiDraftError(null);
    setPlantForm({
      name: plant.name,
      slug: plant.slug,
      sku: plant.sku || "",
      categoryIds: plant.categoryIds,
      price: plant.price,
      mrp: plant.mrp || Math.round(plant.price * 1.3),
      stockQty: plant.stockQty,
      careLevel: (plant.careLevel as "Easy" | "Moderate" | "Expert") || "Easy",
      light: plant.light || "",
      watering: plant.watering || "",
      description: plant.description,
      careDetails: plant.careDetails || "",
      keywords: plant.keywords || [],
      imageUrls: plant.imageUrls,
      isTrending: plant.isTrending,
      status: plant.status,
    });
    setIsPlantDrawerOpen(true);
  };

  // AI Auto-Fill Plant Metadata (human-in-the-loop: populates form state only)
  const handleAutoFillWithAi = async () => {
    const cleanName = plantForm.name.trim();
    if (!cleanName) {
      setAiDraftError("Enter a plant name first so AI can generate care details.");
      return;
    }
    if (!tenantId || tenantId.startsWith("tenant_")) {
      setAiDraftError("Live store connection is initializing. Please wait a moment and try again.");
      return;
    }

    setAiDraftError(null);
    setIsAiDraftLoading(true);
    try {
      const draft = await generatePlantDraft({
        tenantId: tenantId as Id<"tenants">,
        plantName: cleanName,
      });
      setPlantForm((prev) => ({
        ...prev,
        description: draft.description,
        careDetails: draft.careDetails,
        careLevel: draft.careLevel,
        light: draft.light,
        watering: draft.watering,
        keywords: draft.keywords,
      }));
    } catch (err: unknown) {
      setAiDraftError(
        extractAiErrorMessage(err, "Failed to auto-fill plant details with AI."),
      );
    } finally {
      setIsAiDraftLoading(false);
    }
  };

  // AI Ops Brief Generator
  const handleGenerateOpsBrief = async () => {
    setIsOpsBriefOpen(true);
    if (!tenantId || tenantId.startsWith("tenant_")) {
      setOpsBriefError("Live store connection is initializing. Please wait a moment and try again.");
      return;
    }

    setOpsBriefError(null);
    setIsOpsBriefLoading(true);
    try {
      const result = await generateOpsBrief({
        tenantId: tenantId as Id<"tenants">,
      });
      setOpsBrief(result);
    } catch (err: unknown) {
      setOpsBriefError(
        extractAiErrorMessage(err, "Failed to generate AI Ops Brief."),
      );
    } finally {
      setIsOpsBriefLoading(false);
    }
  };

  // Save Plant (Multi-Category Validation)
  const handleSavePlant = (e: React.FormEvent) => {
    e.preventDefault();
    setPlantFormError(null);

    if (!plantForm.name.trim()) {
      setPlantFormError("Plant title is required.");
      return;
    }
    if (plantForm.categoryIds.length === 0) {
      setPlantFormError("A plant must belong to at least 1 category.");
      return;
    }
    if (plantForm.price < 0) {
      setPlantFormError("Price cannot be negative.");
      return;
    }
    if (plantForm.mrp < plantForm.price) {
      setPlantFormError(`MRP (₹${plantForm.mrp}) cannot be less than selling price (₹${plantForm.price}).`);
      return;
    }
    if (plantForm.stockQty < 0) {
      setPlantFormError("Stock quantity cannot be negative.");
      return;
    }

    if (editingPlantId) {
      const res = updatePlant(editingPlantId, plantForm);
      if (res.success) {
        setIsPlantDrawerOpen(false);
      } else if (res.error) {
        setPlantFormError(res.error);
      }
    } else {
      const res = createPlant(plantForm);
      if (res.success) {
        setIsPlantDrawerOpen(false);
      } else if (res.error) {
        setPlantFormError(res.error);
      }
    }
  };

  // Multi-Category Checkbox Toggle
  const toggleCategorySelection = (catId: string) => {
    setPlantForm((prev) => {
      const exists = prev.categoryIds.includes(catId);
      if (exists) {
        return { ...prev, categoryIds: prev.categoryIds.filter((id) => id !== catId) };
      } else {
        return { ...prev, categoryIds: [...prev.categoryIds, catId] };
      }
    });
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Admin Header Bar */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Store Manager Portal • Verdant Nursery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Admin Catalog & Inventory
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Logged in as <strong className="text-white">{username}</strong> (Role: store_admin)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleGenerateOpsBrief()}
            isLoading={isOpsBriefLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/60"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
          >
            AI Ops Brief
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewStorefront}
            className="bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700"
            leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Live Storefront
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              logoutAdmin();
              onSignOut();
            }}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* 1b. Collapsible AI Ops Brief Card */}
      {isOpsBriefOpen && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">AI Ops Brief</h2>
                <p className="text-[11px] text-stone-500">
                  Prioritized restock alerts (stock ≤ 5) &amp; pending orders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isOpsBriefLoading}
                onClick={() => void handleGenerateOpsBrief()}
              >
                Refresh
              </Button>
              <button
                type="button"
                onClick={() => setIsOpsBriefOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                aria-label="Close AI Ops Brief"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {opsBriefError && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{opsBriefError}</span>
            </div>
          )}

          {isOpsBriefLoading && (
            <p className="text-xs font-semibold text-stone-600 py-2">
              Analyzing low-stock inventory and pending orders...
            </p>
          )}

          {!isOpsBriefLoading && opsBrief && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5">
                {opsBrief.summary}
              </p>
              {opsBrief.actions.length > 0 ? (
                <ul className="space-y-1.5">
                  {opsBrief.actions.map((actionItem, index) => (
                    <li
                      key={index}
                      className="text-xs text-stone-800 bg-stone-50 border border-stone-200/80 rounded-xl px-3.5 py-2 flex items-start gap-2"
                    >
                      <span className="font-black text-emerald-700">{index + 1}.</span>
                      <span>{actionItem}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-stone-500">
                  No urgent restock or pending-order actions flagged right now.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Total Plants Listed
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 block">
            {totalPlants}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Active Shopper Visible
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
            {activePlantsCount}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Out-of-Stock Alerts
          </span>
          <span className={`text-2xl sm:text-3xl font-black mt-1 block ${outOfStockCount > 0 ? "text-rose-600" : "text-stone-900"}`}>
            {outOfStockCount}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            Categories Configured
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 block">
            {totalCategories}
          </span>
        </div>
      </div>

      {/* 3. Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab("plants")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "plants"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Manage Plants ({plants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "categories"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Manage Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "orders"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Manage Orders</span>
        </button>

        <div className="ml-auto">
          <button
            onClick={resetToDemoData}
            className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Reset demo catalog"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: MANAGE PLANTS ================= */}
      {activeTab === "plants" && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search plant title, SKU..."
                  value={plantSearchQuery}
                  onChange={(e) => setPlantSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <select
                value={plantFilterCategory}
                onChange={(e) => setPlantFilterCategory(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:border-emerald-600"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAddPlant}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Plant
            </Button>
          </div>

          {/* Plants Table */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Plant</th>
                    <th className="p-4">Categories</th>
                    <th className="p-4">Price / MRP</th>
                    <th className="p-4">Stock Qty</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPlants.map((plant) => {
                    const assignedCats = categories.filter((c) =>
                      plant.categoryIds.includes(c._id),
                    );

                    return (
                      <tr key={plant._id} className="hover:bg-stone-50/70 transition">
                        {/* Thumbnail & Title */}
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={plant.imageUrls[0]}
                            alt={plant.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {plant.name}
                            </span>
                            <span className="font-mono text-[10px] text-stone-400">
                              {plant.sku || "NO-SKU"}
                            </span>
                          </div>
                        </td>

                        {/* Multi-Category Badges */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignedCats.map((c) => (
                              <Badge key={c._id} variant="brand" size="sm">
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="p-4 font-bold text-stone-900">
                          <span>₹{plant.price}</span>
                          {plant.mrp && plant.mrp > plant.price && (
                            <span className="text-[11px] text-stone-400 line-through ml-1.5">
                              ₹{plant.mrp}
                            </span>
                          )}
                        </td>

                        {/* Inline Stock Edit */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={plant.stockQty}
                              onChange={(e) =>
                                updateStockQty(plant._id, parseInt(e.target.value) || 0)
                              }
                              className={`w-16 px-2 py-1 rounded-lg border text-xs font-bold text-center ${
                                plant.stockQty === 0
                                  ? "border-rose-400 bg-rose-50 text-rose-700"
                                  : "border-stone-200 bg-stone-50 text-stone-800"
                              }`}
                            />
                            <span className="text-[10px] text-stone-400">units</span>
                          </div>
                        </td>

                        {/* Status Quick-Toggle */}
                        <td className="p-4">
                          <select
                            value={plant.status}
                            onChange={(e) =>
                              updatePlantStatus(plant._id, e.target.value as PlantStatus)
                            }
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                              plant.status === "active"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : plant.status === "out-of-stock"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                          >
                            <option value="active">active</option>
                            <option value="draft">draft</option>
                            <option value="out-of-stock">out-of-stock</option>
                            <option value="archived">archived</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditPlant(plant)}
                              className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition"
                              title="Edit plant"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete listing "${plant.name}"?`)) {
                                  deletePlant(plant._id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete plant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MANAGE CATEGORIES ================= */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Create Category Form */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Category Manager
              </span>
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                Add New Category
              </h3>
            </div>

            {catFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                {catFormError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <Input
                label="Category Name"
                required
                placeholder="e.g. Exotic Ferns"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setNewCatSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                  );
                }}
              />

              <Input
                label="Slug (Auto-generated)"
                placeholder="exotic-ferns"
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
              />

              <Input
                label="Description"
                placeholder="Brief category summary"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />

              <Input
                label="Image URL"
                required
                value={newCatImg}
                onChange={(e) => setNewCatImg(e.target.value)}
              />

              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCatFeatured}
                  onChange={(e) => setNewCatFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show in Homepage Featured Strip (max 6)</span>
              </label>

              <Button type="submit" variant="primary" size="md" className="w-full">
                Create Category
              </Button>
            </form>
          </div>

          {/* Categories List Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Existing Categories ({categories.length})
              </h4>
              <span className="text-[11px] text-stone-500 italic">
                * Orphan Protection Active: Categories with assigned plants cannot be removed if plants will have 0 categories.
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h5 className="font-bold text-sm text-stone-900">{cat.name}</h5>
                      <span className="text-xs text-stone-400 font-mono">
                        /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="brand" size="sm">
                      {cat.assignedPlantCount ?? 0} plants
                    </Badge>
                    {cat.isFeatured && (
                      <Badge variant="success" size="sm">
                        Featured
                      </Badge>
                    )}

                    <button
                      onClick={() => deleteCategory(cat._id)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MANAGE ORDERS ================= */}
      {activeTab === "orders" && <AdminOrdersTab />}

      {/* ================= PLANT EDITOR DRAWER (Add / Edit) ================= */}
      <Drawer
        isOpen={isPlantDrawerOpen}
        onClose={() => setIsPlantDrawerOpen(false)}
        width="lg"
        title={
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-700" />
            <span className="font-black text-stone-900">
              {editingPlantId ? "Edit Botanical Listing" : "Add New Botanical Listing"}
            </span>
          </div>
        }
      >
        <form onSubmit={handleSavePlant} className="space-y-4">
          {plantFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              {plantFormError}
            </div>
          )}

          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Plant Title"
                  required
                  value={plantForm.name}
                  onChange={(e) =>
                    setPlantForm({
                      ...plantForm,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                isLoading={isAiDraftLoading}
                disabled={isAiDraftLoading || !plantForm.name.trim()}
                onClick={() => void handleAutoFillWithAi()}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                className="shrink-0 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              >
                Auto-Fill with AI
              </Button>
            </div>
            {aiDraftError && (
              <div
                role="alert"
                className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{aiDraftError}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU"
              value={plantForm.sku}
              onChange={(e) => setPlantForm({ ...plantForm, sku: e.target.value })}
            />
            <Input
              label="Slug"
              value={plantForm.slug}
              onChange={(e) => setPlantForm({ ...plantForm, slug: e.target.value })}
            />
          </div>

          {/* Multi-Category Selector (Must select >= 1!) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Assigned Categories (Must select at least 1)
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
              {categories.map((c) => {
                const isSelected = plantForm.categoryIds.includes(c._id);
                return (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => toggleCategorySelection(c._id)}
                    className={`p-2 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    <span>{c.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
            {plantForm.categoryIds.length === 0 && (
              <p className="mt-1 text-xs text-rose-600 font-bold">
                ⚠️ Validation rule: You must select at least 1 category.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Price (₹)"
              type="number"
              required
              min="0"
              value={plantForm.price}
              onChange={(e) =>
                setPlantForm({ ...plantForm, price: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="MRP (₹)"
              type="number"
              min="0"
              value={plantForm.mrp}
              onChange={(e) =>
                setPlantForm({ ...plantForm, mrp: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Stock Qty"
              type="number"
              required
              min="0"
              value={plantForm.stockQty}
              onChange={(e) =>
                setPlantForm({ ...plantForm, stockQty: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Care Level
              </label>
              <select
                value={plantForm.careLevel}
                onChange={(e) =>
                  setPlantForm({ ...plantForm, careLevel: e.target.value as "Easy" | "Moderate" | "Expert" })
                }
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800"
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Publishing Status
              </label>
              <select
                value={plantForm.status}
                onChange={(e) =>
                  setPlantForm({ ...plantForm, status: e.target.value as PlantStatus })
                }
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800"
              >
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <Input
            label="Sunlight Recommendation"
            value={plantForm.light}
            onChange={(e) => setPlantForm({ ...plantForm, light: e.target.value })}
          />

          <Input
            label="Watering Recommendation"
            value={plantForm.watering}
            onChange={(e) => setPlantForm({ ...plantForm, watering: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={plantForm.description}
              onChange={(e) =>
                setPlantForm({ ...plantForm, description: e.target.value })
              }
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
              placeholder="Botanical highlights, foliage overview, origin..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Care Details
            </label>
            <textarea
              rows={2}
              value={plantForm.careDetails}
              onChange={(e) =>
                setPlantForm({ ...plantForm, careDetails: e.target.value })
              }
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
              placeholder="Practical care tips, humidity, soil & fertilizer notes..."
            />
          </div>

          <Input
            label="Search Keywords (comma-separated)"
            placeholder="e.g. indoor, air-purifying, easy-care"
            value={plantForm.keywords.join(", ")}
            onChange={(e) =>
              setPlantForm({
                ...plantForm,
                keywords: e.target.value
                  .split(",")
                  .map((kw) => kw.trim().toLowerCase())
                  .filter(Boolean),
              })
            }
          />

          <Input
            label="Image URL"
            value={plantForm.imageUrls[0] || ""}
            onChange={(e) =>
              setPlantForm({ ...plantForm, imageUrls: [e.target.value] })
            }
          />

          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={plantForm.isTrending}
              onChange={(e) =>
                setPlantForm({ ...plantForm, isTrending: e.target.checked })
              }
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Mark as Trending / Best Seller</span>
          </label>

          <div className="pt-4 border-t border-stone-200 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsPlantDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={plantForm.categoryIds.length === 0}
            >
              {editingPlantId ? "Update Listing" : "Create Plant Listing"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

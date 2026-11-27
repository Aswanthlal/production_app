/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Banner, Category, Plant, CartItem, Order, PlantStatus } from "../types/store";
import { initialBanners, initialCategories, initialPlants } from "../modules/storefront/sampleData";
import { getOrCreateSessionId } from "../modules/cart/session";
import { useToast } from "../components/ui/Toast";

interface StoreContextType {
  // Store info
  tenantId: string;
  storeName: string;
  isLiveConvex: boolean;

  // Banners
  banners: Banner[];

  // Categories
  categories: Category[];
  activeCategories: Category[];
  featuredCategories: Category[];
  createCategory: (cat: Omit<Category, "_id" | "tenantId" | "assignedPlantCount">) => { success: boolean; error?: string };
  deleteCategory: (categoryId: string) => { success: boolean; error?: string };
  updateCategory: (categoryId: string, updates: Partial<Category>) => { success: boolean; error?: string };

  // Plants
  plants: Plant[];
  activePlants: Plant[];
  trendingPlants: Plant[];
  getPlantById: (id: string) => Plant | undefined;
  getPlantsByCategory: (categoryId: string) => Plant[];
  searchPlants: (query: string) => Plant[];
  createPlant: (plant: Omit<Plant, "_id" | "tenantId">) => { success: boolean; error?: string };
  updatePlant: (plantId: string, updates: Partial<Plant>) => { success: boolean; error?: string };
  deletePlant: (plantId: string) => { success: boolean; error?: string };
  updateStockQty: (plantId: string, newQty: number) => void;
  updatePlantStatus: (plantId: string, newStatus: PlantStatus) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  estimatedTotal: number;
  couponCode: string;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addToCart: (productId: string, quantity?: number) => { success: boolean; error?: string };
  updateCartQuantity: (cartItemId: string, newQuantity: number) => { success: boolean; error?: string };
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders
  orders: Order[];
  activeOrder: Order | null;
  placeOrder: (shipping: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: "upi" | "card" | "cod" | "netbanking";
    paymentStatus?: "unpaid" | "paid";
  }) => Promise<Order | null> | Order | null;
  getOrder: (orderNumber: string) => Order | undefined;

  // Admin Auth
  isAdminLoggedIn: boolean;
  adminUsername: string;
  loginAdmin: (username: string, pass: string) => boolean;
  logoutAdmin: () => void;

  // Dialog & Drawer UI controls
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;

  isOrderSuccessOpen: boolean;
  openOrderSuccess: (order: Order) => void;
  closeOrderSuccess: () => void;

  isTrackOrderOpen: boolean;
  openTrackOrder: () => void;
  closeTrackOrder: () => void;

  quickViewPlant: Plant | null;
  openQuickView: (plant: Plant) => void;
  closeQuickView: () => void;

  isPlantAdvisorOpen: boolean;
  openPlantAdvisor: () => void;
  closePlantAdvisor: () => void;

  // Reset demo
  resetToDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CATEGORIES: "nursery_app_categories_v3",
  PLANTS: "nursery_app_plants_v3",
  BANNERS: "nursery_app_banners_v3",
  CART: "nursery_app_cart_v3",
  WISHLIST: "nursery_app_wishlist_v3",
  ORDERS: "nursery_app_orders_v3",
  ADMIN_AUTH: "nursery_app_admin_auth_v3",
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error, info } = useToast();
  const [sessionId] = useState<string>(getOrCreateSessionId);

  // 1. Live Convex Storefront Tenant
  const liveTenant = useQuery(api.modules.storefront.index.getStorefrontTenant, {
    slug: "verdant",
  });
  const tenantId = liveTenant?._id ?? "tenant_verdant";
  const storeName = liveTenant?.name ?? "Verdant Nursery";
  const isLiveConvex = Boolean(liveTenant?._id);

  // 2. Live Convex Hero Banners
  const liveBanners = useQuery(
    api.modules.storefront.index.listActiveBanners,
    liveTenant?._id ? { tenantId: liveTenant._id } : "skip",
  );

  // 3. Live Convex Active Categories
  const liveCategories = useQuery(
    api.modules.catalog.index.listActiveCategories,
    liveTenant?._id ? { tenantId: liveTenant._id } : "skip",
  );

  // 3b. Live Convex Active Plants Query
  const livePlantsData = useQuery(
    api.modules.catalog.index.listActivePlants,
    liveTenant?._id ? { tenantId: liveTenant._id } : "skip",
  );

  // 4. Live Convex Cart Query
  const liveCartData = useQuery(
    api.modules.cart.index.listCartItems,
    liveTenant?._id && sessionId ? { tenantId: liveTenant._id, sessionId } : "skip",
  );

  // 4b. Live Convex Orders Query
  const liveOrdersData = useQuery(
    api.modules.orders.index.listMyOrders,
    liveTenant?._id && sessionId ? { tenantId: liveTenant._id, sessionId } : "skip",
  );

  // Convex Mutations
  const addToCartMutation = useMutation(api.modules.cart.index.addToCart);
  const updateQtyMutation = useMutation(api.modules.cart.index.updateCartItemQuantity);
  const removeMutation = useMutation(api.modules.cart.index.removeFromCart);
  const clearCartMutation = useMutation(api.modules.cart.index.clearCart);
  const createCategoryMutation = useMutation(api.modules.admin.index.createCategory);
  const updateCategoryMutation = useMutation(api.modules.admin.index.updateCategory);
  const deleteCategoryMutation = useMutation(api.modules.admin.index.deleteCategory);
  const createPlantMutation = useMutation(api.modules.admin.index.createPlant);
  const updatePlantMutation = useMutation(api.modules.admin.index.updatePlant);
  const deletePlantMutation = useMutation(api.modules.admin.index.deletePlant);
  const updateStockMutation = useMutation(api.modules.admin.index.updatePlantStock);
  const updateStatusMutation = useMutation(api.modules.admin.index.updatePlantStatus);
  const placeOrderMutation = useMutation(api.modules.orders.index.placeOrder);
  const seedDemoMutation = useMutation(api.modules.admin.index.seedDemoData);

  // Auto-seed if database is fresh and tenant does not exist
  const autoSeededRef = useRef(false);
  useEffect(() => {
    if (liveTenant === null && !autoSeededRef.current) {
      autoSeededRef.current = true;
      seedDemoMutation({ slug: "verdant" }).catch(() => {});
    }
  }, [liveTenant, seedDemoMutation]);

  // Local persistent state
  const [localCategories, setLocalCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  const [localPlants, setLocalPlants] = useState<Plant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLANTS);
      return saved ? JSON.parse(saved) : initialPlants;
    } catch {
      return initialPlants;
    }
  });

  const [localBanners, setLocalBanners] = useState<Banner[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANNERS);
      return saved ? JSON.parse(saved) : initialBanners;
    } catch {
      return initialBanners;
    }
  });

  const [localCart, setLocalCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localOrders, setLocalOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState("admin");

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Dialogs
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [quickViewPlant, setQuickViewPlant] = useState<Plant | null>(null);
  const [isPlantAdvisorOpen, setIsPlantAdvisorOpen] = useState(false);

  // Pure derivation of Banners from live Convex data or local state
  const banners: Banner[] = useMemo(() => {
    if (liveBanners && liveBanners.length > 0) {
      return liveBanners.map((b) => ({
        _id: b._id,
        tenantId: b.tenantId,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        sortOrder: b.sortOrder,
        status: b.status as "draft" | "active" | "archived",
      }));
    }
    return localBanners;
  }, [liveBanners, localBanners]);

  // Pure derivation of Categories from live Convex data or local state
  const categories: Category[] = useMemo(() => {
    if (liveCategories && liveCategories.length > 0) {
      return liveCategories.map((c) => ({
        _id: c._id,
        tenantId: c.tenantId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        isFeatured: c.isFeatured,
        sortOrder: c.sortOrder,
        status: c.status as "active" | "archived",
        assignedPlantCount: c.productCount,
      }));
    }
    return localCategories;
  }, [liveCategories, localCategories]);

  // Pure derivation of Cart from live Convex data or local state
  const rawCart: CartItem[] = useMemo(() => {
    if (liveCartData) {
      return liveCartData.map((item) => ({
        _id: item._id,
        tenantId: item.tenantId,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
        product: item.product
          ? {
              _id: item.product._id,
              tenantId: item.product.tenantId,
              categoryIds: item.product.categoryIds,
              name: item.product.name,
              slug: item.product.slug,
              sku: item.product.sku,
              description: item.product.description,
              careDetails: item.product.careDetails,
              price: item.product.price,
              mrp: item.product.mrp,
              stockQty: item.product.stockQty,
              imageUrls: item.product.imageUrls,
              rating: item.product.rating,
              reviewCount: item.product.reviewCount,
              isTrending: item.product.isTrending,
              status: item.product.status as PlantStatus,
            }
          : undefined,
      }));
    }
    return localCart;
  }, [liveCartData, localCart]);

  // Pure derivation of Plants from live Convex data or local state
  const plants: Plant[] = useMemo(() => {
    if (livePlantsData && livePlantsData.length > 0) {
      return livePlantsData.map((p) => ({
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
    return localPlants;
  }, [livePlantsData, localPlants]);

  // Pure derivation of Orders from live Convex data or local state
  const orders: Order[] = useMemo(() => {
    if (liveOrdersData && liveOrdersData.length > 0) {
      const mapped: Order[] = liveOrdersData.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
        items: o.items.map((i) => ({
          ...i,
          name: i.name || i.title,
          price: i.price ?? i.unitPrice,
        })),
        subtotal: o.subtotal,
        shipping: o.shipping,
        discount: o.discount,
        total: o.total,
        paymentMethod: o.paymentMethod as "upi" | "card" | "cod" | "netbanking",
        status: o.status as Order["status"],
        createdAt: o.dateCreated,
        estimatedDeliveryDate: new Date(o.dateCreated + 3 * 86400000).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }));
      const orderIds = new Set(mapped.map((m) => m.orderNumber));
      const extraLocal = localOrders.filter((lo) => !orderIds.has(lo.orderNumber));
      return [...mapped, ...extraLocal];
    }
    return localOrders;
  }, [liveOrdersData, localOrders]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(localCategories));
  }, [localCategories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(localPlants));
  }, [localPlants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(localBanners));
  }, [localBanners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(localCart));
  }, [localCart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));
  }, [localOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, isAdminLoggedIn ? "true" : "false");
  }, [isAdminLoggedIn]);

  // Compute active assignedPlantCounts on categories
  const categoriesWithCounts = useMemo(() => {
    const activeP = plants.filter((p) => p.status === "active");
    const countMap = new Map<string, number>();
    for (const c of categories) {
      countMap.set(c._id, 0);
    }
    for (const p of activeP) {
      for (const catId of p.categoryIds) {
        countMap.set(catId, (countMap.get(catId) || 0) + 1);
      }
    }
    return categories.map((c) => ({
      ...c,
      assignedPlantCount: c.assignedPlantCount ?? (countMap.get(c._id) ?? 0),
    }));
  }, [categories, plants]);

  const activeCategories = useMemo(
    () => categoriesWithCounts.filter((c) => c.status === "active").sort((a, b) => a.sortOrder - b.sortOrder),
    [categoriesWithCounts],
  );

  const featuredCategories = useMemo(
    () => activeCategories.filter((c) => c.isFeatured).slice(0, 6),
    [activeCategories],
  );

  const activePlants = useMemo(
    () => plants.filter((p) => p.status === "active"),
    [plants],
  );

  const trendingPlants = useMemo(
    () => activePlants.filter((p) => p.isTrending),
    [activePlants],
  );

  // Hydrate cart items with live product data
  const hydratedCart = useMemo(() => {
    return rawCart
      .map((item) => {
        const prod = plants.find((p) => p._id === item.productId);
        return {
          ...item,
          product: item.product || prod,
        };
      })
      .filter((item) => item.product !== undefined);
  }, [rawCart, plants]);

  // Cart financial calculations
  const subtotal = useMemo(() => {
    return hydratedCart.reduce(
      (sum, item) => sum + (item.product?.price ?? item.unitPriceSnapshot) * item.quantity,
      0,
    );
  }, [hydratedCart]);

  const cartCount = useMemo(() => {
    return hydratedCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [hydratedCart]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon === "GREEN10") {
      return Math.round(subtotal * 0.1);
    }
    if (appliedCoupon === "SAVE100") {
      return Math.min(100, subtotal);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    if (subtotal >= 499 || appliedCoupon === "FREESHIP") return 0;
    return 49;
  }, [subtotal, appliedCoupon]);

  const estimatedTotal = Math.max(0, subtotal - discount + shippingFee);

  // Remove from cart
  const removeFromCart = useCallback(
    (cartItemId: string) => {
      if (liveTenant?._id && !cartItemId.startsWith("cart_")) {
        removeMutation({
          tenantId: liveTenant._id,
          cartItemId: cartItemId as Id<"cartItems">,
        }).catch(() => {});
      }
      setLocalCart((prev) => prev.filter((i) => i._id !== cartItemId));
    },
    [liveTenant, removeMutation],
  );

  // Update cart quantity with upper bound stock check
  const updateCartQuantity = useCallback(
    (cartItemId: string, newQuantity: number) => {
      const item = rawCart.find((i) => i._id === cartItemId);
      if (!item) return { success: false, error: "Cart item not found" };

      const prod = plants.find((p) => p._id === item.productId);
      if (newQuantity <= 0) {
        removeFromCart(cartItemId);
        info("Item removed from cart");
        return { success: true };
      }

      if (prod && newQuantity > prod.stockQty) {
        const msg = `Only ${prod.stockQty} available in stock.`;
        error("Stock limit reached", msg);
        return { success: false, error: msg };
      }

      if (liveTenant?._id && !cartItemId.startsWith("cart_")) {
        updateQtyMutation({
          tenantId: liveTenant._id,
          cartItemId: cartItemId as Id<"cartItems">,
          quantity: newQuantity,
        }).catch(() => {});
      }

      setLocalCart((prev) =>
        prev.map((i) => (i._id === cartItemId ? { ...i, quantity: newQuantity } : i)),
      );
      return { success: true };
    },
    [rawCart, plants, liveTenant, updateQtyMutation, removeFromCart, error, info],
  );

  // Add to cart with upper bound stock check
  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const prod = plants.find((p) => p._id === productId);
      if (!prod) {
        error("Product not found");
        return { success: false, error: "Product not found" };
      }
      if (prod.status !== "active") {
        error("Product is not currently available for purchase");
        return { success: false, error: "Product is not available" };
      }
      if (prod.stockQty <= 0) {
        error("Out of stock", "This plant is currently out of stock.");
        return { success: false, error: "Out of stock" };
      }

      let outcomeSuccess = true;
      let outcomeError: string | undefined;

      const existingIdx = rawCart.findIndex((i) => i.productId === productId);
      if (existingIdx >= 0) {
        const item = rawCart[existingIdx];
        const nextQty = item.quantity + quantity;
        if (nextQty > prod.stockQty) {
          outcomeSuccess = false;
          outcomeError = `Only ${prod.stockQty} items available in stock.`;
        }
      } else if (quantity > prod.stockQty) {
        outcomeSuccess = false;
        outcomeError = `Only ${prod.stockQty} items available in stock.`;
      }

      if (!outcomeSuccess && outcomeError) {
        error("Stock limit reached", outcomeError);
        return { success: false, error: outcomeError };
      }

      if (liveTenant?._id && !productId.startsWith("prod_")) {
        addToCartMutation({
          tenantId: liveTenant._id,
          productId: productId as Id<"products">,
          quantity,
          sessionId,
        }).catch(() => {});
      }

      setLocalCart((prev) => {
        const idx = prev.findIndex((i) => i.productId === productId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + quantity,
            unitPriceSnapshot: prod.price,
          };
          return updated;
        }
        return [
          ...prev,
          {
            _id: "cart_" + Math.random().toString(36).substring(2, 9),
            tenantId: tenantId as string,
            productId,
            quantity,
            unitPriceSnapshot: prod.price,
          },
        ];
      });

      success(`Added to cart!`, `${prod.name} has been added.`);
      setIsCartOpen(true);
      return { success: true };
    },
    [plants, liveTenant, addToCartMutation, sessionId, tenantId, rawCart, error, success],
  );

  const clearCart = useCallback(() => {
    if (liveTenant?._id) {
      clearCartMutation({ tenantId: liveTenant._id, sessionId }).catch(() => {});
    }
    setLocalCart([]);
    setAppliedCoupon(null);
  }, [liveTenant, clearCartMutation, sessionId]);

  // Coupon handling
  const applyCoupon = useCallback(
    (code: string) => {
      const clean = code.trim().toUpperCase();
      if (clean === "GREEN10") {
        setAppliedCoupon("GREEN10");
        setCouponCode("GREEN10");
        success("Coupon Applied!", "10% discount has been applied to your order.");
        return { success: true, message: "10% discount applied!" };
      }
      if (clean === "SAVE100") {
        setAppliedCoupon("SAVE100");
        setCouponCode("SAVE100");
        success("Coupon Applied!", "₹100 flat discount applied to your order.");
        return { success: true, message: "₹100 discount applied!" };
      }
      if (clean === "FREESHIP") {
        setAppliedCoupon("FREESHIP");
        setCouponCode("FREESHIP");
        success("Coupon Applied!", "Free shipping applied to your order.");
        return { success: true, message: "Free shipping applied!" };
      }
      error("Invalid Coupon", "Valid coupons: GREEN10 (10% off), SAVE100 (₹100 off), or FREESHIP.");
      return { success: false, message: "Invalid coupon code." };
    },
    [success, error],
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    info("Coupon removed");
  }, [info]);

  // Wishlist actions
  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          info("Removed from wishlist");
          return prev.filter((id) => id !== productId);
        } else {
          success("Added to wishlist!");
          return [...prev, productId];
        }
      });
    },
    [success, info],
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  // Plant queries
  const getPlantById = useCallback(
    (id: string) => plants.find((p) => p._id === id || p.slug === id),
    [plants],
  );

  const getPlantsByCategory = useCallback(
    (catId: string) => {
      return activePlants.filter((p) => p.categoryIds.includes(catId));
    },
    [activePlants],
  );

  const searchPlants = useCallback(
    (queryText: string) => {
      const term = queryText.toLowerCase().trim();
      if (!term) return [];
      return activePlants.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.careDetails?.toLowerCase().includes(term),
      );
    },
    [activePlants],
  );

  // Admin Category CRUD
  const createCategory = useCallback(
    (catData: Omit<Category, "_id" | "tenantId" | "assignedPlantCount">) => {
      const name = catData.name.trim();
      if (!name) return { success: false, error: "Category name is required" };

      const slug =
        catData.slug?.trim() ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      if (categories.some((c) => c.slug === slug)) {
        return { success: false, error: `Category slug "${slug}" already exists.` };
      }

      if (liveTenant?._id) {
        createCategoryMutation({
          tenantId: liveTenant._id,
          name,
          slug,
          description: catData.description?.trim(),
          imageUrl: catData.imageUrl.trim(),
          isFeatured: catData.isFeatured ?? false,
          sortOrder: catData.sortOrder || categories.length + 1,
        }).catch(() => {});
      }

      const newCategory: Category = {
        _id: "cat_" + Math.random().toString(36).substring(2, 9),
        tenantId: tenantId as string,
        name,
        slug,
        description: catData.description?.trim(),
        imageUrl:
          catData.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1614594573661-f9d3cf1f7fa8?auto=format&fit=crop&w=600&q=80",
        isFeatured: catData.isFeatured ?? false,
        sortOrder: catData.sortOrder || categories.length + 1,
        status: catData.status || "active",
        assignedPlantCount: 0,
      };

      setLocalCategories((prev) => [...prev, newCategory]);
      success("Category Created", `Category "${name}" added successfully.`);
      return { success: true };
    },
    [categories, liveTenant, createCategoryMutation, tenantId, success],
  );

  const updateCategory = useCallback(
    (categoryId: string, updates: Partial<Category>) => {
      if (liveTenant?._id && !categoryId.startsWith("cat_")) {
        updateCategoryMutation({
          tenantId: liveTenant._id,
          categoryId: categoryId as Id<"categories">,
          name: updates.name,
          slug: updates.slug,
          description: updates.description,
          imageUrl: updates.imageUrl,
          isFeatured: updates.isFeatured,
          sortOrder: updates.sortOrder,
          status: updates.status,
        }).catch(() => {});
      }

      setLocalCategories((prev) =>
        prev.map((c) => (c._id === categoryId ? { ...c, ...updates } : c)),
      );
      success("Category Updated", "Category details updated successfully.");
      return { success: true };
    },
    [liveTenant, updateCategoryMutation, success],
  );

  // Orphan Protection on Category Deletion
  const deleteCategory = useCallback(
    (categoryId: string) => {
      const affectedPlants = plants.filter((p) => p.categoryIds.includes(categoryId));
      const willBeOrphaned = affectedPlants.filter((p) => p.categoryIds.length <= 1);

      if (willBeOrphaned.length > 0) {
        const orphanNames = willBeOrphaned.map((p) => p.name).join(", ");
        const errMsg = `Cannot delete category: ${willBeOrphaned.length} plant(s) (${orphanNames}) would have 0 assigned categories. Reassign them first.`;
        error("Category Deletion Blocked", errMsg);
        return { success: false, error: errMsg };
      }

      if (liveTenant?._id && !categoryId.startsWith("cat_")) {
        deleteCategoryMutation({
          tenantId: liveTenant._id,
          categoryId: categoryId as Id<"categories">,
        }).catch(() => {});
      }

      setLocalPlants((prev) =>
        prev.map((p) =>
          p.categoryIds.includes(categoryId)
            ? { ...p, categoryIds: p.categoryIds.filter((id) => id !== categoryId) }
            : p,
        ),
      );

      setLocalCategories((prev) => prev.filter((c) => c._id !== categoryId));
      success("Category Deleted", "Category removed successfully.");
      return { success: true };
    },
    [plants, liveTenant, deleteCategoryMutation, error, success],
  );

  // Admin Plant CRUD
  const createPlant = useCallback(
    (plantData: Omit<Plant, "_id" | "tenantId">) => {
      if (!plantData.categoryIds || plantData.categoryIds.length === 0) {
        const errMsg = "A plant must be assigned to at least 1 category.";
        error("Validation Failed", errMsg);
        return { success: false, error: errMsg };
      }

      const name = plantData.name.trim();
      if (!name) {
        error("Validation Failed", "Plant name is required.");
        return { success: false, error: "Plant name is required" };
      }

      const slug =
        plantData.slug?.trim() ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      if (liveTenant?._id) {
        const validCategoryIds = plantData.categoryIds.filter(
          (cId) => !cId.startsWith("cat_"),
        ) as Id<"categories">[];

        if (validCategoryIds.length > 0) {
          createPlantMutation({
            tenantId: liveTenant._id,
            categoryIds: validCategoryIds,
            name,
            slug,
            sku: plantData.sku?.trim(),
            description: plantData.description?.trim() || "",
            careDetails: plantData.careDetails?.trim(),
            price: Math.max(0, plantData.price),
            mrp: plantData.mrp,
            stockQty: Math.max(0, plantData.stockQty),
            imageUrls: plantData.imageUrls,
            isTrending: plantData.isTrending ?? false,
            status: plantData.status,
          }).catch(() => {});
        }
      }

      const newPlant: Plant = {
        _id: "prod_" + Math.random().toString(36).substring(2, 9),
        tenantId: tenantId as string,
        categoryIds: plantData.categoryIds,
        name,
        slug,
        sku: plantData.sku?.trim() || "VD-SKU-" + Math.floor(100 + Math.random() * 900),
        description: plantData.description?.trim() || "",
        careDetails: plantData.careDetails?.trim() || "",
        careLevel: plantData.careLevel || "Easy",
        light: plantData.light?.trim() || "Bright indirect light",
        watering: plantData.watering?.trim() || "Water when topsoil is dry",
        price: Math.max(0, plantData.price),
        mrp: Math.max(plantData.price, plantData.mrp || Math.round(plantData.price * 1.3)),
        stockQty: Math.max(0, plantData.stockQty),
        imageUrls:
          plantData.imageUrls && plantData.imageUrls.length > 0
            ? plantData.imageUrls
            : ["https://images.unsplash.com/photo-1614594573661-f9d3cf1f7fa8?auto=format&fit=crop&w=800&q=80"],
        rating: plantData.rating || 4.8,
        reviewCount: plantData.reviewCount || 0,
        isTrending: plantData.isTrending ?? false,
        status: plantData.status || "active",
      };

      setLocalPlants((prev) => [newPlant, ...prev]);
      success("Plant Created", `"${name}" listing added to catalog.`);
      return { success: true };
    },
    [liveTenant, createPlantMutation, tenantId, error, success],
  );

  const updatePlant = useCallback(
    (plantId: string, updates: Partial<Plant>) => {
      if (updates.categoryIds !== undefined && updates.categoryIds.length === 0) {
        const errMsg = "A plant must belong to at least 1 category.";
        error("Validation Failed", errMsg);
        return { success: false, error: errMsg };
      }

      if (liveTenant?._id && !plantId.startsWith("prod_")) {
        const validCategoryIds = updates.categoryIds?.filter(
          (cId) => !cId.startsWith("cat_"),
        ) as Id<"categories">[] | undefined;

        updatePlantMutation({
          tenantId: liveTenant._id,
          productId: plantId as Id<"products">,
          categoryIds: validCategoryIds,
          name: updates.name,
          slug: updates.slug,
          sku: updates.sku,
          description: updates.description,
          careDetails: updates.careDetails,
          price: updates.price,
          mrp: updates.mrp,
          stockQty: updates.stockQty,
          imageUrls: updates.imageUrls,
          isTrending: updates.isTrending,
          status: updates.status,
        }).catch(() => {});
      }

      setLocalPlants((prev) =>
        prev.map((p) => (p._id === plantId ? { ...p, ...updates } : p)),
      );
      success("Plant Updated", "Listing updated successfully.");
      return { success: true };
    },
    [liveTenant, updatePlantMutation, error, success],
  );

  const deletePlant = useCallback(
    (plantId: string) => {
      if (liveTenant?._id && !plantId.startsWith("prod_")) {
        deletePlantMutation({
          tenantId: liveTenant._id,
          productId: plantId as Id<"products">,
        }).catch(() => {});
      }

      setLocalPlants((prev) => prev.filter((p) => p._id !== plantId));
      setLocalCart((prev) => prev.filter((i) => i.productId !== plantId));
      success("Plant Deleted", "Listing removed from catalog.");
      return { success: true };
    },
    [liveTenant, deletePlantMutation, success],
  );

  const updateStockQty = useCallback(
    (plantId: string, newQty: number) => {
      const qty = Math.max(0, newQty);
      if (liveTenant?._id && !plantId.startsWith("prod_")) {
        updateStockMutation({
          tenantId: liveTenant._id,
          productId: plantId as Id<"products">,
          stockQty: qty,
        }).catch(() => {});
      }

      setLocalPlants((prev) =>
        prev.map((p) =>
          p._id === plantId
            ? {
                ...p,
                stockQty: qty,
                status: qty === 0 ? "out-of-stock" : p.status === "out-of-stock" ? "active" : p.status,
              }
            : p,
        ),
      );
    },
    [liveTenant, updateStockMutation],
  );

  const updatePlantStatus = useCallback(
    (plantId: string, newStatus: PlantStatus) => {
      if (liveTenant?._id && !plantId.startsWith("prod_")) {
        updateStatusMutation({
          tenantId: liveTenant._id,
          productId: plantId as Id<"products">,
          status: newStatus,
        }).catch(() => {});
      }

      setLocalPlants((prev) =>
        prev.map((p) => (p._id === plantId ? { ...p, status: newStatus } : p)),
      );
    },
    [liveTenant, updateStatusMutation],
  );

  // Order Placement
  const placeOrder = useCallback(
    async (shipping: {
      customerName: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      paymentMethod: "upi" | "card" | "cod" | "netbanking";
      paymentStatus?: "unpaid" | "paid";
    }): Promise<Order | null> => {
      if (hydratedCart.length === 0) {
        error("Cart is empty", "Add items before placing an order.");
        return null;
      }

      for (const item of hydratedCart) {
        if (!item.product || item.quantity > item.product.stockQty) {
          const name = item.product?.name ?? "Item";
          error("Insufficient stock", `${name} does not have enough stock.`);
          return null;
        }
      }

      const cleanPhone = shipping.phone.trim().replace(/\D/g, "");
      const cleanPincode = shipping.pincode.trim().replace(/\D/g, "");

      const hasRealProductIds = hydratedCart.every(
        (item) => !item.productId.startsWith("prod_"),
      );

      let serverOrderNumber: string | undefined;
      let serverEstimatedDeliveryDate: string | undefined;
      let serverOrderId: string | undefined;

      if (liveTenant?._id && hasRealProductIds) {
        try {
          const res = await placeOrderMutation({
            tenantId: liveTenant._id,
            sessionId,
            customerName: shipping.customerName.trim(),
            phone: cleanPhone,
            address: shipping.address.trim(),
            city: shipping.city.trim(),
            state: shipping.state.trim(),
            pincode: cleanPincode,
            paymentMethod: shipping.paymentMethod,
            paymentStatus: shipping.paymentStatus,
            couponCode: appliedCoupon ?? undefined,
          });
          serverOrderNumber = res.orderNumber;
          serverEstimatedDeliveryDate = res.estimatedDeliveryDate;
          serverOrderId = res.orderId;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to place order.";
          error("Order Failed", msg);
          return null;
        }
      } else {
        for (const item of hydratedCart) {
          updateStockQty(item.productId, (item.product?.stockQty ?? 0) - item.quantity);
        }
      }

      const orderNumber = serverOrderNumber || "VD-" + Math.floor(100000 + Math.random() * 900000);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);

      const orderItems = hydratedCart.map((item) => ({
        productId: item.productId,
        name: item.product?.name ?? "Plant",
        title: item.product?.name ?? "Plant",
        quantity: item.quantity,
        price: item.product?.price ?? item.unitPriceSnapshot,
        unitPrice: item.product?.price ?? item.unitPriceSnapshot,
        imageUrl: item.product?.imageUrls[0] ?? "",
      }));

      const newOrder: Order = {
        _id: serverOrderId || "order_" + Math.random().toString(36).substring(2, 9),
        orderNumber,
        customerName: shipping.customerName.trim(),
        phone: cleanPhone,
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        pincode: cleanPincode,
        items: orderItems,
        subtotal,
        shipping: shippingFee,
        discount,
        total: estimatedTotal,
        paymentMethod: shipping.paymentMethod,
        paymentStatus:
          shipping.paymentStatus ??
          (shipping.paymentMethod === "cod" ? "unpaid" : "paid"),
        status: "pending",
        createdAt: Date.now(),
        estimatedDeliveryDate:
          serverEstimatedDeliveryDate ||
          deliveryDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      };

      setLocalOrders((prev) => [newOrder, ...prev]);
      clearCart();
      setActiveOrder(newOrder);
      setIsCheckoutOpen(false);
      setIsOrderSuccessOpen(true);
      success("Order Placed!", `Order #${orderNumber} placed successfully.`);
      return newOrder;
    },
    [
      hydratedCart,
      liveTenant,
      sessionId,
      appliedCoupon,
      placeOrderMutation,
      updateStockQty,
      subtotal,
      shippingFee,
      discount,
      estimatedTotal,
      clearCart,
      error,
      success,
    ],
  );

  const getOrder = useCallback(
    (orderNumber: string) => {
      const clean = orderNumber.trim().toUpperCase();
      return orders.find(
        (o) => o.orderNumber.toUpperCase() === clean || o._id.toUpperCase() === clean,
      );
    },
    [orders],
  );

  // Admin Auth
  const loginAdmin = useCallback(
    (username: string, pass: string) => {
      if (username.trim().toLowerCase() === "admin" && pass === "admin123") {
        setIsAdminLoggedIn(true);
        setAdminUsername(username.trim());
        success("Welcome Admin", "Signed into Verdant Store Manager.");
        return true;
      }
      error("Authentication Failed", "Invalid credentials. Use admin / admin123");
      return false;
    },
    [success, error],
  );

  const logoutAdmin = useCallback(() => {
    setIsAdminLoggedIn(false);
    setAdminUsername("");
    info("Signed Out", "You have been logged out of the Admin portal.");
  }, [info]);

  // Dialog Controls
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const openCheckout = useCallback(() => {
    if (rawCart.length === 0) {
      error("Your cart is empty", "Add items to your cart before proceeding to checkout.");
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [rawCart, error]);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const openOrderSuccess = useCallback((order: Order) => {
    setActiveOrder(order);
    setIsOrderSuccessOpen(true);
  }, []);
  const closeOrderSuccess = useCallback(() => setIsOrderSuccessOpen(false), []);

  const openTrackOrder = useCallback(() => setIsTrackOrderOpen(true), []);
  const closeTrackOrder = useCallback(() => setIsTrackOrderOpen(false), []);

  const openQuickView = useCallback((plant: Plant) => setQuickViewPlant(plant), []);
  const closeQuickView = useCallback(() => setQuickViewPlant(null), []);

  const openPlantAdvisor = useCallback(() => setIsPlantAdvisorOpen(true), []);
  const closePlantAdvisor = useCallback(() => setIsPlantAdvisorOpen(false), []);

  // Demo reset
  const resetToDemoData = useCallback(() => {
    if (liveTenant?._id) {
      seedDemoMutation({ slug: "verdant", clearExisting: true }).catch(() => {});
    }
    setLocalCategories(initialCategories);
    setLocalPlants(initialPlants);
    setLocalBanners(initialBanners);
    setLocalCart([]);
    setLocalOrders([]);
    success("Store Reset", "Demo categories, banners, and plants restored.");
  }, [liveTenant, seedDemoMutation, success]);

  return (
    <StoreContext.Provider
      value={{
        tenantId: (liveTenant?._id as string) || "tenant_verdant",
        storeName,
        isLiveConvex,
        banners,
        categories: categoriesWithCounts,
        activeCategories,
        featuredCategories,
        createCategory,
        deleteCategory,
        updateCategory,
        plants,
        activePlants,
        trendingPlants,
        getPlantById,
        getPlantsByCategory,
        searchPlants,
        createPlant,
        updatePlant,
        deletePlant,
        updateStockQty,
        updatePlantStatus,
        cart: hydratedCart,
        cartCount,
        subtotal,
        discount,
        shippingFee,
        estimatedTotal,
        couponCode,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        activeOrder,
        placeOrder,
        getOrder,
        isAdminLoggedIn,
        adminUsername,
        loginAdmin,
        logoutAdmin,
        isCartOpen,
        openCart,
        closeCart,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        isOrderSuccessOpen,
        openOrderSuccess,
        closeOrderSuccess,
        isTrackOrderOpen,
        openTrackOrder,
        closeTrackOrder,
        quickViewPlant,
        openQuickView,
        closeQuickView,
        isPlantAdvisorOpen,
        openPlantAdvisor,
        closePlantAdvisor,
        resetToDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

import { useState, useEffect } from "react";
import { ToastProvider } from "./components/ui/Toast";
import { StoreProvider, useStore } from "./context/StoreContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Module Pages
import HomePage from "./modules/storefront/HomePage";
import AllCategoriesPage from "./modules/catalog/AllCategoriesPage";
import CategoryPlantsPage from "./modules/catalog/CategoryPlantsPage";
import TrendingPlantsPage from "./modules/catalog/TrendingPlantsPage";
import AdminLoginPage from "./modules/admin/AdminLoginPage";
import AdminDashboardPage from "./modules/admin/AdminDashboardPage";

// Global Dialogs & Modals
import CartDrawer from "./modules/cart/CartDrawer";
import { PlantDetailModal } from "./modules/catalog/components/PlantDetailModal";
import { CheckoutModal } from "./modules/cart/CheckoutModal";
import { OrderConfirmationModal } from "./modules/cart/OrderConfirmationModal";
import { TrackOrderModal } from "./modules/cart/TrackOrderModal";

export type AppRoute =
  | "storefront"
  | "categories"
  | "categoryPlants"
  | "trending"
  | "login"
  | "dashboard";

function AppContent() {
  const { adminUsername, logoutAdmin } = useStore();
  const [route, setRoute] = useState<AppRoute>("storefront");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("cat_indoor");

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route, selectedCategoryId]);

  const handleNavigate = (newRoute: string, param?: string) => {
    if (newRoute.startsWith("/categories/") || newRoute.startsWith("/category/")) {
      const slug = newRoute.replace(/^\/categor(ies|y)\//, "");
      if (slug) {
        setSelectedCategoryId(slug);
        setRoute("categoryPlants");
        return;
      }
    }

    if (newRoute === "categoryPlants") {
      if (param) {
        setSelectedCategoryId(param);
      }
      setRoute("categoryPlants");
    } else if (
      newRoute === "storefront" ||
      newRoute === "categories" ||
      newRoute === "trending" ||
      newRoute === "login" ||
      newRoute === "dashboard"
    ) {
      setRoute(newRoute as AppRoute);
    } else {
      setRoute("storefront");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      {/* 1. Master Sticky Navigation Header */}
      <Header currentRoute={route} onNavigate={handleNavigate} />

      {/* 2. Main Page Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {route === "storefront" && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {route === "categories" && (
          <AllCategoriesPage
            onBack={() => setRoute("storefront")}
            onSelectCategory={(catId) => {
              setSelectedCategoryId(catId);
              setRoute("categoryPlants");
            }}
          />
        )}

        {route === "categoryPlants" && (
          <CategoryPlantsPage
            categoryId={selectedCategoryId}
            onBackToCategories={() => setRoute("categories")}
            onGoHome={() => setRoute("storefront")}
          />
        )}

        {route === "trending" && (
          <TrendingPlantsPage
            onBack={() => setRoute("storefront")}
            onSelectCategory={(catId) => {
              setSelectedCategoryId(catId);
              setRoute("categoryPlants");
            }}
          />
        )}

        {route === "login" && (
          <AdminLoginPage
            onBack={() => setRoute("storefront")}
            onSuccess={() => setRoute("dashboard")}
          />
        )}

        {route === "dashboard" && (
          <AdminDashboardPage
            username={adminUsername || "admin"}
            onViewStorefront={() => setRoute("storefront")}
            onSignOut={() => {
              logoutAdmin();
              setRoute("storefront");
            }}
          />
        )}

        {/* Fallback to storefront if unexpected route */}
        {route !== "storefront" &&
          route !== "categories" &&
          route !== "categoryPlants" &&
          route !== "trending" &&
          route !== "login" &&
          route !== "dashboard" && (
            <HomePage onNavigate={handleNavigate} />
          )}
      </main>

      {/* 3. Global Application Modals, Drawers & Feedback */}
      <CartDrawer
        onShopNow={() => {
          setRoute("storefront");
        }}
      />
      <PlantDetailModal />
      <CheckoutModal />
      <OrderConfirmationModal />
      <TrackOrderModal />

      {/* 4. Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ToastProvider>
  );
}

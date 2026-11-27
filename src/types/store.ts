export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  status: string;
}

export interface Banner {
  _id: string;
  tenantId: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder: number;
  status: "draft" | "active" | "archived";
}

export interface Category {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  isFeatured: boolean;
  sortOrder: number;
  status: "active" | "archived";
  assignedPlantCount?: number;
}

export type PlantStatus = "draft" | "active" | "out-of-stock" | "archived";

export interface Plant {
  _id: string;
  tenantId: string;
  categoryIds: string[];
  name: string;
  slug: string;
  sku?: string;
  description: string;
  careDetails?: string;
  careLevel?: "Easy" | "Moderate" | "Expert";
  light?: string;
  watering?: string;
  keywords?: string[];
  price: number;
  mrp?: number;
  stockQty: number;
  imageUrls: string[];
  rating?: number;
  reviewCount?: number;
  isTrending: boolean;
  status: PlantStatus;
}

export interface CartItem {
  _id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  unitPriceSnapshot: number;
  product?: Plant;
}

export interface OrderItem {
  productId: string;
  name?: string;
  title?: string;
  sku?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  imageUrl?: string;
}

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: "upi" | "card" | "cod" | "netbanking";
  paymentStatus?: "unpaid" | "paid" | "refunded" | string;
  status: OrderStatus;
  createdAt: number;
  estimatedDeliveryDate: string;
  adminNotes?: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  verifiedBuyer: boolean;
  avatarUrl: string;
  plantName: string;
}

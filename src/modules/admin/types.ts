export type PlantStatus = "draft" | "active" | "out-of-stock" | "archived";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  isFeatured: boolean;
  sortOrder: number;
  status: "active" | "archived";
  assignedPlantCount?: number;
}

export interface AdminPlant {
  id: string;
  name: string;
  slug?: string;
  category: string;
  categoryIds: string[];
  image: string;
  imageUrls: string[];
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  sku: string;
  stockQty: number;
  careLevel: "Easy" | "Moderate" | "Expert" | string;
  light: string;
  watering: string;
  description: string;
  trending: boolean;
  status: PlantStatus;
}

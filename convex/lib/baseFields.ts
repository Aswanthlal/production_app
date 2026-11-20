import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/** Fields required on every tenant-owned application record. */
export const baseFields = {
  createdBy: v.id("users"),
  editedBy: v.id("users"),
  dateCreated: v.number(),
  dateEdited: v.number(),
  category: v.string(),
  type: v.string(),
  keywords: v.array(v.string()),
  status: v.string(),
  sysState: v.string(),
} as const;

export type BaseFields = {
  createdBy: Id<"users">;
  editedBy: Id<"users">;
  dateCreated: number;
  dateEdited: number;
  category: string;
  type: string;
  keywords: string[];
  status: string;
  sysState: string;
};

export function createBaseFields(params: {
  userId: Id<"users">;
  category?: string;
  type?: string;
  keywords?: string[];
  status?: string;
  sysState?: string;
}): BaseFields {
  const now = Date.now();
  return {
    createdBy: params.userId,
    editedBy: params.userId,
    dateCreated: now,
    dateEdited: now,
    category: params.category ?? "catalog",
    type: params.type ?? "standard",
    keywords: params.keywords ?? [],
    status: params.status ?? "active",
    sysState: params.sysState ?? "active",
  };
}

"use node";

import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { ConvexError, v } from "convex/values";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_MAX_TOKENS = 450;

type CareLevel = "Easy" | "Moderate" | "Expert";

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function stripMarkdownCodeFence(rawText: string): string {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function readGroqApiKey(): string | undefined {
  const nodeEnv = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  return nodeEnv?.GROQ_API_KEY?.trim();
}

async function callGroqStructuredJson<T>(
  systemPrompt: string,
  userPrompt: string,
  parseAndValidate: (raw: unknown) => T,
): Promise<T> {
  const apiKey = readGroqApiKey();
  if (!apiKey) {
    throw new ConvexError(
      "AI service is not configured. Missing GROQ_API_KEY in Convex environment variables.",
    );
  }

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: GROQ_MAX_TOKENS,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch {
    throw new ConvexError(
      "Unable to reach the AI service right now. Please try again shortly.",
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConvexError(
        "AI service authentication failed. Please verify GROQ_API_KEY on the server.",
      );
    }
    if (response.status === 429) {
      throw new ConvexError(
        "AI assistant is temporarily rate-limited. Please wait a moment and try again.",
      );
    }
    throw new ConvexError(
      `AI service returned an error (HTTP ${response.status}). Please try again.`,
    );
  }

  let payload: GroqChatCompletionResponse;
  try {
    payload = (await response.json()) as GroqChatCompletionResponse;
  } catch {
    throw new ConvexError("AI service returned an invalid response payload.");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new ConvexError("AI service returned an empty response. Please try again.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripMarkdownCodeFence(content));
  } catch {
    throw new ConvexError("AI returned malformed JSON. Please try again.");
  }

  return parseAndValidate(parsedJson);
}

function normalizeCareLevel(value: unknown): CareLevel {
  if (typeof value !== "string") return "Easy";
  const normalized = value.trim().toLowerCase();
  if (normalized === "moderate" || normalized === "medium") return "Moderate";
  if (normalized === "expert" || normalized === "hard" || normalized === "advanced") {
    return "Expert";
  }
  return "Easy";
}

function requireNonEmptyString(value: unknown, fieldLabel: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ConvexError(`AI response was missing a valid ${fieldLabel}. Please try again.`);
  }
  return value.trim();
}

type ActiveCatalogItem = {
  _id: string;
  name: string;
  price: number;
  stockQty: number;
  careLevel: string | null;
  light: string | null;
  watering: string | null;
  keywords: string[];
};

type AdminAuthResult = {
  authorized: true;
  tenantId: string;
  userId: string;
  role: "guest" | "customer" | "store_admin";
};

type AdminOpsSnapshot = {
  lowStockProducts: Array<{
    _id: string;
    name: string;
    sku: string | null;
    stockQty: number;
    status: string;
    price: number;
  }>;
  pendingOrders: Array<{
    _id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    itemCount: number;
    dateCreated: number;
  }>;
};

/**
 * Storefront Plant Advisor action (accessible to guest, customer, and store_admin).
 * Grounded strictly in the tenant's active product catalog.
 */
export const askPlantAdvisor = action({
  args: {
    tenantId: v.id("tenants"),
    question: v.string(),
  },
  returns: v.object({
    answer: v.string(),
    recommendedProductIds: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ answer: string; recommendedProductIds: string[] }> => {
    const question = args.question.trim();
    if (!question) {
      throw new ConvexError("Please enter a question for the Plant Advisor.");
    }

    const activeCatalog: ActiveCatalogItem[] = await ctx.runQuery(
      internal.modules.ai.queries.getActiveCatalogForAi,
      { tenantId: args.tenantId },
    );

    if (activeCatalog.length === 0) {
      return {
        answer:
          "There are currently no active plants in this store's catalog to recommend. Please check back soon.",
        recommendedProductIds: [],
      };
    }

    const validCatalogIds = new Set(activeCatalog.map((item) => String(item._id)));

    const systemPrompt = [
      "You are the Verdant Nursery Plant Advisor.",
      "Answer the shopper's question concisely and helpfully using ONLY the provided active catalog JSON.",
      "Do not invent products, prices, or product IDs.",
      'Return valid JSON with exact keys: { "answer": string, "recommendedProductIds": string[] }.',
      "Include at most 4 matching `_id` values from the provided catalog in `recommendedProductIds`, or [] if none match.",
    ].join(" ");

    const userPrompt = JSON.stringify({
      question,
      activeCatalog,
    });

    return await callGroqStructuredJson(systemPrompt, userPrompt, (raw) => {
      if (typeof raw !== "object" || raw === null) {
        throw new ConvexError("AI returned an invalid advisor payload. Please try again.");
      }
      const record = raw as Record<string, unknown>;
      const answer = requireNonEmptyString(record.answer, "answer");
      const rawIds = Array.isArray(record.recommendedProductIds)
        ? record.recommendedProductIds
        : [];

      const recommendedProductIds = Array.from(
        new Set(
          rawIds
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter((id) => validCatalogIds.has(id)),
        ),
      ).slice(0, 4);

      return { answer, recommendedProductIds };
    });
  },
});

/**
 * Admin Plant Draft Auto-Fill action (store_admin only).
 * Generates structured botanical metadata without committing to the database.
 */
export const generatePlantDraft = action({
  args: {
    tenantId: v.id("tenants"),
    plantName: v.string(),
  },
  returns: v.object({
    description: v.string(),
    careDetails: v.string(),
    careLevel: v.union(v.literal("Easy"), v.literal("Moderate"), v.literal("Expert")),
    light: v.string(),
    watering: v.string(),
    keywords: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    description: string;
    careDetails: string;
    careLevel: CareLevel;
    light: string;
    watering: string;
    keywords: string[];
  }> => {
    const plantName = args.plantName.trim();
    if (!plantName) {
      throw new ConvexError("Please enter a plant name before using Auto-Fill with AI.");
    }

    const adminAuth: AdminAuthResult = await ctx.runQuery(
      internal.modules.ai.queries.verifyStoreAdminForAi,
      { tenantId: args.tenantId },
    );
    void adminAuth;

    const systemPrompt = [
      "You are a horticultural catalog assistant for an online plant nursery.",
      "Generate accurate, concise, shopper-friendly botanical metadata for the requested plant.",
      "Return valid JSON with exact keys:",
      '{ "description": string, "careDetails": string, "careLevel": "Easy" | "Moderate" | "Expert", "light": string, "watering": string, "keywords": string[] }.',
      "Keep description to 2-3 sentences, careDetails to 1-2 practical sentences, and keywords to 4-8 lowercase search tags.",
    ].join(" ");

    const userPrompt = JSON.stringify({ plantName });

    return await callGroqStructuredJson(systemPrompt, userPrompt, (raw) => {
      if (typeof raw !== "object" || raw === null) {
        throw new ConvexError("AI returned an invalid plant draft payload. Please try again.");
      }
      const record = raw as Record<string, unknown>;
      const description = requireNonEmptyString(record.description, "description");
      const careDetails = requireNonEmptyString(record.careDetails, "careDetails");
      const careLevel = normalizeCareLevel(record.careLevel);
      const light = requireNonEmptyString(record.light, "light");
      const watering = requireNonEmptyString(record.watering, "watering");
      const rawKeywords = Array.isArray(record.keywords) ? record.keywords : [];
      const keywords = Array.from(
        new Set(
          rawKeywords
            .filter((kw): kw is string => typeof kw === "string")
            .map((kw) => kw.trim().toLowerCase())
            .filter(Boolean),
        ),
      ).slice(0, 8);

      return {
        description,
        careDetails,
        careLevel,
        light,
        watering,
        keywords,
      };
    });
  },
});

/**
 * Admin Operational Brief action (store_admin only).
 * Summarizes low-stock products (stockQty <= 5) and pending orders into prioritized actions.
 */
export const generateOpsBrief = action({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.object({
    summary: v.string(),
    actions: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ summary: string; actions: string[] }> => {
    const adminAuth: AdminAuthResult = await ctx.runQuery(
      internal.modules.ai.queries.verifyStoreAdminForAi,
      { tenantId: args.tenantId },
    );

    const snapshot: AdminOpsSnapshot = await ctx.runQuery(
      internal.modules.ai.queries.getAdminOpsSnapshot,
      {
        tenantId: args.tenantId,
        userId: adminAuth.userId as never,
      },
    );

    const systemPrompt = [
      "You are an operations analyst for Verdant Nursery.",
      "Analyze the store's low-stock products (stockQty <= 5) and pending orders snapshot.",
      'Return valid JSON with exact keys: { "summary": string, "actions": string[] }.',
      "Keep summary concise (1-3 sentences) and provide 2-6 prioritized, actionable bullet strings for restocking and order fulfillment.",
    ].join(" ");

    const userPrompt = JSON.stringify(snapshot);

    return await callGroqStructuredJson(systemPrompt, userPrompt, (raw) => {
      if (typeof raw !== "object" || raw === null) {
        throw new ConvexError("AI returned an invalid ops brief payload. Please try again.");
      }
      const record = raw as Record<string, unknown>;
      const summary = requireNonEmptyString(record.summary, "summary");
      const rawActions = Array.isArray(record.actions) ? record.actions : [];
      const actions = rawActions
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);

      return { summary, actions };
    });
  },
});

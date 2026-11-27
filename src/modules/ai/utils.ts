/**
 * Extract a clean, user-readable error message from ConvexError or standard Error instances,
 * stripping internal Convex request ID prefixes when present.
 */
export function extractAiErrorMessage(
  err: unknown,
  fallback = "AI assistant could not complete your request. Please try again.",
): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
  }
  if (err instanceof Error && err.message.trim()) {
    const cleaned = err.message
      .replace(/^\[CONVEX [^\]]+\]\s*/i, "")
      .replace(/^Server Error\s*/i, "")
      .replace(/^Uncaught (?:ConvexError|Error):\s*/i, "")
      .trim();
    return cleaned || fallback;
  }
  return fallback;
}

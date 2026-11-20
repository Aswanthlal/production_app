const SESSION_KEY = "nursery_app_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "guest_session_ssr";
  }

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "guest_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

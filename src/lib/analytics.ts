// Analytics de produto (GA4 + Mixpanel) — spec 008. Client-side only, nunca importar de um
// Server Component. Nada dispara antes do consentimento de cookies (ver CookieConsentBanner).

const CONSENT_KEY = "hfy_cookie_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentValue = "accepted" | "declined";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function hasConsent(): boolean {
  return getConsent() === "accepted";
}

const consentListeners = new Set<() => void>();

/** Pra `useSyncExternalStore` reagir a mudanças feitas na própria aba — o evento nativo
 * `storage` só dispara em outras abas, nunca na que fez a escrita. */
export function subscribeConsent(callback: () => void): () => void {
  consentListeners.add(callback);
  return () => consentListeners.delete(callback);
}

export function setConsent(value: ConsentValue): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  consentListeners.forEach((listener) => listener());
  if (value === "accepted") {
    initAnalyticsIfConsented();
  }
}

let initialized = false;
let mixpanelInstance: typeof import("mixpanel-browser").default | null = null;

export function initAnalyticsIfConsented(): void {
  if (initialized || !hasConsent() || typeof window === "undefined") return;
  initialized = true;

  if (GA_ID) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  if (MIXPANEL_TOKEN) {
    import("mixpanel-browser").then(({ default: mixpanel }) => {
      mixpanel.init(MIXPANEL_TOKEN, { autocapture: false });
      mixpanelInstance = mixpanel;
    });
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!hasConsent()) return;
  window.gtag?.("event", name, props);
  mixpanelInstance?.track(name, props);
}

export function trackPageview(path: string): void {
  if (!hasConsent() || !GA_ID) return;
  window.gtag?.("event", "page_view", { page_path: path });
}

export function identify(userId: string): void {
  if (!hasConsent()) return;
  mixpanelInstance?.identify(userId);
  window.gtag?.("set", "user_properties", { user_id: userId });
}

export function setUserProperty(key: string, value: unknown): void {
  if (!hasConsent()) return;
  mixpanelInstance?.people.set({ [key]: value });
  window.gtag?.("set", "user_properties", { [key]: value });
}

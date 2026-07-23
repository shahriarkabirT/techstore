"use client";

/**
 * Meta Pixel tracking module — refactored to use GTM DataLayer instead of native fbq.
 */

const DEFAULT_CURRENCY = "BDT";

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
}

function normalizeCurrency(code?: string): string {
  const c = (code || "").trim();
  if (/^[A-Za-z]{3}$/.test(c)) return c.toUpperCase();
  return DEFAULT_CURRENCY;
}

function normalizePurchaseValue(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  return 0.01;
}

export interface ContentItem {
  id: string;
  quantity: number;
  item_price?: number;
  item_name?: string;
  item_category?: string;
}

export interface BaseEventParams {
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export interface ViewContentParams extends BaseEventParams {
  content_ids: string[];
  content_name: string;
  contents?: ContentItem[];
}

export interface AddToCartParams extends BaseEventParams {
  content_ids: string[];
  contents: ContentItem[];
}

export interface InitiateCheckoutParams extends BaseEventParams {
  content_ids: string[];
  contents: ContentItem[];
  num_items?: number;
}

export interface PurchaseParams extends BaseEventParams {
  content_ids: string[];
  contents: ContentItem[];
  num_items?: number;
  shipping?: number;
  eventID?: string;
}

export interface ViewCartParams extends BaseEventParams {
  contents: ContentItem[];
  total_quantity?: number;
}

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

// Simple global lock to prevent double-firing of identical events in quick succession (React Strict Mode / re-renders)
const eventCache: Record<string, number> = {};

function isDuplicateEvent(eventName: string, params: any): boolean {
  try {
    const eventKey = `${eventName}_${JSON.stringify(params)}`;
    const now = Date.now();
    // If the exact same event with the same payload fired in the last 1000ms, ignore it.
    if (eventCache[eventKey] && now - eventCache[eventKey] < 1000) {
      return true;
    }
    eventCache[eventKey] = now;
    return false;
  } catch (err) {
    return false; // If stringify fails, just allow it
  }
}

// Dummy fbq for backward compatibility (in case it's used directly)
export const fbq = (...args: any[]) => {
  // Ignored since we moved to GTM datalayer
};

export function runWhenFbqReady(fn: () => void): () => void {
  // Execute immediately since we rely on DataLayer which is always available
  if (typeof window !== "undefined") {
    fn();
  }
  return () => {};
}

export const trackViewContent = (params: ViewContentParams) => {
  if (typeof window !== "undefined" && !isDuplicateEvent("view_item", params)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "view_item",
      ecommerce: {
        currency: normalizeCurrency(params.currency),
        value: params.value || 0,
        items: params.contents?.map((c) => ({
          item_id: String(c.id),
          item_name: c.item_name || params.content_name || "",
          item_category: c.item_category || params.content_category || "",
          price: c.item_price || 0,
          quantity: c.quantity,
        })) || []
      }
    });

    // Ensure fbq queue exists before calling it
    const win = window as any;
    if (typeof win.fbq !== 'function') {
      win.fbq = function() {
        win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, arguments) : win.fbq.queue.push(arguments);
      };
      if (!win._fbq) win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = !0;
      win.fbq.version = '2.0';
      win.fbq.queue = [];
    }

    win.fbq('track', 'ViewContent', {
      content_ids: params.content_ids,
      content_type: params.content_type || 'product',
      content_name: params.content_name,
      value: normalizePurchaseValue(params.value),
      currency: normalizeCurrency(params.currency)
    });
  }
};

export const trackAddToCart = (params: AddToCartParams) => {
  if (typeof window !== "undefined" && !isDuplicateEvent("add_to_cart", params)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: normalizeCurrency(params.currency),
        value: params.value || 0,
        items: params.contents.map((c) => ({
          item_id: String(c.id),
          item_name: c.item_name || "",
          item_category: c.item_category || "",
          price: c.item_price || 0,
          quantity: c.quantity,
        }))
      }
    });

    const win = window as any;
    if (typeof win.fbq !== 'function') {
      win.fbq = function() {
        win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, arguments) : win.fbq.queue.push(arguments);
      };
      if (!win._fbq) win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = !0;
      win.fbq.version = '2.0';
      win.fbq.queue = [];
    }

    win.fbq('track', 'AddToCart', {
      content_ids: params.content_ids,
      content_type: params.content_type || 'product',
      value: normalizePurchaseValue(params.value),
      currency: normalizeCurrency(params.currency)
    });
  }
};

export const trackInitiateCheckout = (params: InitiateCheckoutParams, userData?: UserData) => {
  if (typeof window !== "undefined" && !isDuplicateEvent("begin_checkout", params)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "begin_checkout",
      ecommerce: {
        currency: normalizeCurrency(params.currency),
        value: params.value || 0,
        total_quantity: params.num_items || params.contents.reduce((sum, c) => sum + c.quantity, 0),
        items: params.contents.map((c) => ({
          item_id: String(c.id),
          item_name: c.item_name || "",
          item_category: c.item_category || "",
          price: c.item_price || 0,
          quantity: c.quantity,
        }))
      }
    });

    const win = window as any;
    if (typeof win.fbq !== 'function') {
      win.fbq = function() {
        win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, arguments) : win.fbq.queue.push(arguments);
      };
      if (!win._fbq) win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = !0;
      win.fbq.version = '2.0';
      win.fbq.queue = [];
    }

    win.fbq('track', 'InitiateCheckout', {
      content_ids: params.content_ids,
      content_type: params.content_type || 'product',
      num_items: params.num_items || params.contents.reduce((sum, c) => sum + c.quantity, 0),
      value: normalizePurchaseValue(params.value),
      currency: normalizeCurrency(params.currency)
    });
  }
};

export const trackPurchase = (params: PurchaseParams, userData?: UserData) => {
  if (typeof window !== "undefined" && !isDuplicateEvent("purchase", params)) {
    window.dataLayer = window.dataLayer || [];
    
    const customer_info = userData ? {
      first_name: userData.firstName || "",
      last_name: userData.lastName || "",
      phone: userData.phone || "",
      email: userData.email || "",
      city: userData.city || ""
    } : undefined;

    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: params.eventID || "",
        value: normalizePurchaseValue(params.value),
        currency: normalizeCurrency(params.currency),
        shipping: params.shipping || 0,
        total_quantity: params.num_items || params.contents.reduce((sum, c) => sum + c.quantity, 0),
        items: params.contents.map((c) => ({
          item_id: String(c.id),
          item_name: c.item_name || "",
          item_category: c.item_category || "",
          price: c.item_price || 0,
          quantity: c.quantity,
        })),
        ...(customer_info && { customer_info })
      }
    });

    const win = window as any;
    if (typeof win.fbq !== 'function') {
      win.fbq = function() {
        win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, arguments) : win.fbq.queue.push(arguments);
      };
      if (!win._fbq) win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = !0;
      win.fbq.version = '2.0';
      win.fbq.queue = [];
    }

    const fbqPayload = {
      content_ids: params.content_ids,
      content_type: params.content_type || 'product',
      value: normalizePurchaseValue(params.value),
      currency: normalizeCurrency(params.currency),
      num_items: params.num_items || params.contents.reduce((sum, c) => sum + c.quantity, 0)
    };
    
    // If we have an eventID, pass it in the third argument as per Meta standard
    if (params.eventID) {
      win.fbq('track', 'Purchase', fbqPayload, { eventID: params.eventID });
    } else {
      win.fbq('track', 'Purchase', fbqPayload);
    }
  }
};

export const trackViewCart = (params: ViewCartParams) => {
  if (typeof window !== "undefined" && !isDuplicateEvent("view_cart", params)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "view_cart",
      ecommerce: {
        currency: normalizeCurrency(params.currency),
        value: params.value || 0,
        total_quantity: params.total_quantity || params.contents.reduce((sum, c) => sum + c.quantity, 0),
        items: params.contents.map((c) => ({
          item_id: String(c.id),
          item_name: c.item_name || "",
          item_category: c.item_category || "",
          price: c.item_price || 0,
          quantity: c.quantity,
        }))
      }
    });
  }
};

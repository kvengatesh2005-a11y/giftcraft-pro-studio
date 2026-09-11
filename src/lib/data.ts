import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Coupon, Order, Poster, Product, Review } from "./types";

function mapDocs<T>(snap: { docs: { id: string; data: () => unknown }[] }): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[];
}

export async function fetchProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(getDb(), "products"));
  return mapDocs<Product>(snap);
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 60_000 });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const snap = await getDoc(doc(getDb(), "products", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as object) } as Product;
    },
  });
}

export function usePosters() {
  return useQuery({
    queryKey: ["posters"],
    queryFn: async () => {
      const snap = await getDocs(collection(getDb(), "posters"));
      return mapDocs<Poster>(snap)
        .filter((p) => p.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });
}

export function useAllPosters() {
  return useQuery({
    queryKey: ["posters", "all"],
    queryFn: async () => {
      const snap = await getDocs(collection(getDb(), "posters"));
      return mapDocs<Poster>(snap).sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => mapDocs<Coupon>(await getDocs(collection(getDb(), "coupons"))),
  });
}

export function useAllOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["orders", "all"],
    enabled,
    refetchInterval: 3000,
    queryFn: async () =>
      mapDocs<Order>(await getDocs(collection(getDb(), "orders"))).sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || ""),
      ),
  });
}

export function useMyOrders(userId?: string, email?: string, phone?: string, displayEmail?: string) {
  const phoneFromEmail = email?.endsWith("@phone.user") ? email.replace("@phone.user", "") : "";
  const effectivePhone = phone || phoneFromEmail;

  return useQuery({
    queryKey: ["orders", userId, email, phone, displayEmail, effectivePhone],
    enabled: Boolean(userId || email || phone || displayEmail || effectivePhone),
    refetchInterval: 3000,
    queryFn: async () => {
      const db = getDb();
      const results: Order[] = [];

      const safeFetch = async (q: any) => {
        try {
          const snap = await getDocs(q);
          return mapDocs<Order>(snap);
        } catch (err) {
          console.warn("Firestore query warning in useMyOrders:", err);
          return [];
        }
      };

      if (userId) {
        const byUid = await safeFetch(query(collection(db, "orders"), where("userId", "==", userId)));
        results.push(...byUid);
      }

      if (email) {
        const byEmail = await safeFetch(query(collection(db, "orders"), where("customerEmail", "==", email)));
        for (const o of byEmail) {
          if (!results.some((r) => r.id === o.id)) results.push(o);
        }
      }

      if (displayEmail && displayEmail !== email) {
        const byDisplayEmail = await safeFetch(query(collection(db, "orders"), where("customerEmail", "==", displayEmail)));
        for (const o of byDisplayEmail) {
          if (!results.some((r) => r.id === o.id)) results.push(o);
        }
      }

      if (effectivePhone) {
        const cleanPhone = effectivePhone.replace(/\D/g, "");
        const byPhone = await safeFetch(query(collection(db, "orders"), where("customerPhone", "==", effectivePhone)));
        for (const o of byPhone) {
          if (!results.some((r) => r.id === o.id)) results.push(o);
        }
        if (cleanPhone && cleanPhone !== effectivePhone) {
          const byCleanPhone = await safeFetch(query(collection(db, "orders"), where("customerPhone", "==", cleanPhone)));
          for (const o of byCleanPhone) {
            if (!results.some((r) => r.id === o.id)) results.push(o);
          }
        }

        // Also check if customerEmail was saved as raw phone number
        const byPhoneEmail = await safeFetch(query(collection(db, "orders"), where("customerEmail", "==", effectivePhone)));
        for (const o of byPhoneEmail) {
          if (!results.some((r) => r.id === o.id)) results.push(o);
        }
      }

      // Fallback: If specific queries returned nothing or were blocked by missing composite indexes, attempt to scan orders collection and match client-side
      if (results.length === 0) {
        try {
          const allDocs = await safeFetch(collection(db, "orders"));
          const cleanUserPhone = effectivePhone ? effectivePhone.replace(/\D/g, "") : "";
          for (const o of allDocs) {
            const matchesUid = Boolean(userId && o.userId === userId);
            const matchesEmail = Boolean(
              (email && o.customerEmail === email) ||
              (displayEmail && o.customerEmail === displayEmail) ||
              (effectivePhone && o.customerEmail === effectivePhone)
            );
            const matchesPhone = Boolean(
              effectivePhone &&
                (o.customerPhone === effectivePhone ||
                  (cleanUserPhone && o.customerPhone?.replace(/\D/g, "") === cleanUserPhone))
            );
            if (matchesUid || matchesEmail || matchesPhone) {
              if (!results.some((r) => r.id === o.id)) results.push(o);
            }
          }
        } catch {
          /* ignore fallback error */
        }
      }

      return results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    },
  });
}

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(getDb(), "reviews"), where("productId", "==", productId)),
      );
      return mapDocs<Review>(snap).sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || ""),
      );
    },
  });
}

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["users"],
    enabled,
    queryFn: async () => {
      const snap = await getDocs(collection(getDb(), "users"));
      return mapDocs<{ uid: string; email: string; name: string; role?: string; phone?: string; createdAt?: string }>(snap);
    },
  });
}

export async function addProduct(data: Omit<Product, "id">) {
  return addDoc(collection(getDb(), "products"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function updateProduct(id: string, data: Partial<Product>) {
  return updateDoc(doc(getDb(), "products", id), data);
}

export async function deleteProduct(id: string) {
  return deleteDoc(doc(getDb(), "products", id));
}

export async function updateOrderStatus(orderId: string, status: string) {
  return updateDoc(doc(getDb(), "orders", orderId), { status });
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string) {
  return updateDoc(doc(getDb(), "orders", orderId), { paymentStatus });
}

export async function addCoupon(data: Omit<Coupon, "id">) {
  return addDoc(collection(getDb(), "coupons"), data);
}

export async function updateCoupon(id: string, data: Partial<Coupon>) {
  return updateDoc(doc(getDb(), "coupons", id), data);
}

export async function deleteCoupon(id: string) {
  return deleteDoc(doc(getDb(), "coupons", id));
}

export async function addPoster(data: Omit<Poster, "id">) {
  return addDoc(collection(getDb(), "posters"), data);
}

export async function updatePoster(id: string, data: Partial<Poster>) {
  return updateDoc(doc(getDb(), "posters", id), data);
}

export async function deletePoster(id: string) {
  return deleteDoc(doc(getDb(), "posters", id));
}

export async function updateUserRole(uid: string, role: string) {
  return setDoc(doc(getDb(), "users", uid), { role }, { merge: true });
}

export type CountryDeliveryRate = {
  deliveryCharge: number;
  deliveryDays: string;
};

export type DeliverySettings = {
  deliveryCharge: number;
  deliveryDays?: string;
  countryRates?: Record<string, CountryDeliveryRate>;
  razorpayKeyId?: string;
  upiId?: string;
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useDeliverySettings() {
  return useQuery({
    queryKey: ["settings", "delivery"],
    queryFn: async () => {
      let localData: DeliverySettings | null = null;
      try {
        const local = localStorage.getItem("deliverySettings");
        if (local) localData = JSON.parse(local) as DeliverySettings;
      } catch (e) {
        console.warn("Error reading local delivery settings:", e);
      }

      try {
        const snap = await getDoc(doc(getDb(), "settings", "delivery"));
        if (snap.exists()) {
          const data = snap.data() as object;
          return {
            deliveryCharge: 60,
            deliveryDays: "3-5 business days",
            countryRates: {},
            razorpayKeyId: "",
            upiId: "9176501954@ibl",
            ...localData,
            ...data,
          } as DeliverySettings;
        }
      } catch (err) {
        console.warn("Firestore fetch for delivery settings failed, using local/default:", err);
      }

      return (
        localData ?? {
          deliveryCharge: 60,
          deliveryDays: "3-5 business days",
          countryRates: {},
          razorpayKeyId: "",
          upiId: "9176501954@ibl",
        }
      );
    },
  });
}

export async function updateDeliverySettings(data: Partial<DeliverySettings>) {
  let updated: DeliverySettings = {
    deliveryCharge: 60,
    deliveryDays: "3-5 business days",
    countryRates: {},
    razorpayKeyId: "",
    upiId: "9176501954@ibl",
    ...data,
  };

  try {
    const local = localStorage.getItem("deliverySettings");
    if (local) {
      const existing = JSON.parse(local);
      updated = { ...existing, ...data };
    }
    localStorage.setItem("deliverySettings", JSON.stringify(updated));
  } catch (err) {
    console.warn("Error saving delivery settings to localStorage:", err);
  }

  try {
    await setDoc(doc(getDb(), "settings", "delivery"), updated, { merge: true });
  } catch (err) {
    console.warn("Firestore update for delivery settings failed (saved locally):", err);
  }

  return updated;
}

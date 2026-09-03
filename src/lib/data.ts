import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
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
    queryFn: async () =>
      mapDocs<Order>(await getDocs(collection(getDb(), "orders"))).sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || ""),
      ),
  });
}

export function useMyOrders(userId?: string, email?: string) {
  return useQuery({
    queryKey: ["orders", userId ?? email],
    enabled: Boolean(userId || email),
    queryFn: async () => {
      const db = getDb();
      const results: Order[] = [];
      if (userId) {
        results.push(
          ...mapDocs<Order>(
            await getDocs(query(collection(db, "orders"), where("userId", "==", userId))),
          ),
        );
      }
      if (email) {
        const byEmail = mapDocs<Order>(
          await getDocs(query(collection(db, "orders"), where("customerEmail", "==", email))),
        );
        for (const o of byEmail) if (!results.some((r) => r.id === o.id)) results.push(o);
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

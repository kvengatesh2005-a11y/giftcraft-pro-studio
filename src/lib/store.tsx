import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ADMIN_EMAIL, getAuthClient, getDb } from "./firebase";
import {
  CONVERSION_RATES,
  COUNTRIES,
  type AppUser,
  type CartItem,
  type Country,
  type Product,
} from "./types";

type AppState = {
  cart: CartItem[];
  wishlist: Product[];
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  country: Country;
  cartCount: number;
  cartTotal: number;
  setCountry: (c: Country) => void;
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (p: Product) => void;
  isWishlisted: (id: string) => boolean;
  convertPrice: (inr: number) => number;
  formatPrice: (inr: number) => string;
  setUser: (u: AppUser | null) => void;
  setIsAdmin: (v: boolean) => void;
};

const AppContext = createContext<AppState | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]!);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(read<CartItem[]>("cart", []));
    setWishlist(read<Product[]>("wishlist", []));
    setCountry(read<Country>("selectedCountry", COUNTRIES[0]!));
    setUser(read<AppUser | null>("user", null));
    setIsAdmin(read<boolean>("isAdmin", false));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("selectedCountry", JSON.stringify(country));
  }, [country, hydrated]);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthClient(), async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsAdmin(false);
        window.localStorage.removeItem("user");
        window.localStorage.setItem("isAdmin", "false");
        setLoading(false);
        return;
      }
      const phoneFromAuth = fbUser.email?.endsWith("@phone.user")
        ? fbUser.email.replace("@phone.user", "")
        : "";
      let profile: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email ?? "",
        phone: phoneFromAuth,
        name: fbUser.displayName || (phoneFromAuth ? `User ${phoneFromAuth}` : (fbUser.email ?? "").split("@")[0]) || "",
      };
      try {
        const snap = await getDoc(doc(getDb(), "users", fbUser.uid));
        if (snap.exists()) profile = { ...profile, ...(snap.data() as AppUser) };
      } catch {
        /* offline / rules — fall back to auth profile */
      }
      const admin = profile.role === "admin" || profile.email === ADMIN_EMAIL;
      setUser(profile);
      setIsAdmin(admin);
      window.localStorage.setItem("user", JSON.stringify(profile));
      window.localStorage.setItem("isAdmin", JSON.stringify(admin));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...product, quantity: qty }];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        toast("Removed from wishlist");
        return prev.filter((p) => p.id !== product.id);
      }
      toast.success("Saved to wishlist");
      return [...prev, product];
    });
  }, []);

  const value = useMemo<AppState>(() => {
    const rate = CONVERSION_RATES[country.code] ?? 1;
    const convertPrice = (inr: number) => Math.round((Number(inr) || 0) * rate);
    return {
      cart,
      wishlist,
      user,
      isAdmin,
      loading,
      country,
      cartCount: cart.reduce((n, i) => n + i.quantity, 0),
      cartTotal: cart.reduce((n, i) => n + Number(i.price) * i.quantity, 0),
      setCountry,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleWishlist,
      isWishlisted: (id: string) => wishlist.some((p) => p.id === id),
      convertPrice,
      formatPrice: (inr: number) => `${country.currency}${convertPrice(inr).toLocaleString()}`,
      setUser,
      setIsAdmin,
    };
  }, [
    cart,
    wishlist,
    user,
    isAdmin,
    loading,
    country,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

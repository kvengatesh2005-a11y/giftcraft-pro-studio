export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  icon?: string;
  description?: string;
  stock?: number;
  images?: string[];
  rating?: number;
  createdAt?: string;
};

export type CartItem = Product & { quantity: number };

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
};

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string | null;
  couponDiscount?: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId?: string | null;
  createdAt: string;
  userId?: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  discountAmount: number;
  isActive: boolean;
  validUntil?: string;
};

export type Poster = {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  order?: number;
};

export type AppUser = {
  uid: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  createdAt?: string;
};

export type Review = {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const CATEGORIES = [
  "Combo Packs",
  "Earrings",
  "Hair Clips",
  "Hand Bags",
  "chains",
  "Keychains",
  "Return Gifts",
  "Kada Bracelets",
  "Lunch Boxes",
  "Scrunches",
  "Water Bottles",
  "Resin Art",
  "Western Dresses",
  "Chudithar",
  "Sarees",
];

export type Country = {
  code: string;
  name: string;
  currency: string;
  currencyCode: string;
  deliveryCharge: number;
  deliveryDays: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  {
    code: "IN",
    name: "India",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 60,
    deliveryDays: "3-5",
    flag: "🇮🇳",
  },
  {
    code: "US",
    name: "United States",
    currency: "$",
    currencyCode: "USD",
    deliveryCharge: 1500,
    deliveryDays: "7-10",
    flag: "🇺🇸",
  },
  {
    code: "UK",
    name: "United Kingdom",
    currency: "£",
    currencyCode: "GBP",
    deliveryCharge: 1200,
    deliveryDays: "7-10",
    flag: "🇬🇧",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "C$",
    currencyCode: "CAD",
    deliveryCharge: 1400,
    deliveryDays: "8-12",
    flag: "🇨🇦",
  },
  {
    code: "AU",
    name: "Australia",
    currency: "A$",
    currencyCode: "AUD",
    deliveryCharge: 1600,
    deliveryDays: "8-12",
    flag: "🇦🇺",
  },
  {
    code: "AE",
    name: "UAE",
    currency: "د.إ",
    currencyCode: "AED",
    deliveryCharge: 1000,
    deliveryDays: "5-7",
    flag: "🇦🇪",
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "S$",
    currencyCode: "SGD",
    deliveryCharge: 800,
    deliveryDays: "4-6",
    flag: "🇸🇬",
  },
  {
    code: "MY",
    name: "Malaysia",
    currency: "RM",
    currencyCode: "MYR",
    deliveryCharge: 700,
    deliveryDays: "4-6",
    flag: "🇲🇾",
  },
];

export const CONVERSION_RATES: Record<string, number> = {
  IN: 1,
  US: 0.012,
  UK: 0.0095,
  CA: 0.016,
  AU: 0.018,
  AE: 0.044,
  SG: 0.016,
  MY: 0.056,
};

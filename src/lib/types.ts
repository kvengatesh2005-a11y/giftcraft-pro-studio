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
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  paymentStatus?: string;
  createdAt: string;
  userId?: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  discountAmount: number;
  isActive: boolean;
  validUntil?: string;
  minOrderAmount?: number;
  firstCustomerOnly?: boolean;
  description?: string;
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
  displayEmail?: string;
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
  "Chains",
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
    deliveryDays: "3-5 business days",
    flag: "🇮🇳",
  },
  {
    code: "US",
    name: "United States",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 1200,
    deliveryDays: "7-10 business days",
    flag: "🇺🇸",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 1100,
    deliveryDays: "7-10 business days",
    flag: "🇬🇧",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 1250,
    deliveryDays: "7-12 business days",
    flag: "🇨🇦",
  },
  {
    code: "AU",
    name: "Australia",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 1300,
    deliveryDays: "7-12 business days",
    flag: "🇦🇺",
  },
  {
    code: "AE",
    name: "UAE",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 1000,
    deliveryDays: "5-7 business days",
    flag: "🇦🇪",
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 950,
    deliveryDays: "5-7 business days",
    flag: "🇸🇬",
  },
  {
    code: "MY",
    name: "Malaysia",
    currency: "₹",
    currencyCode: "INR",
    deliveryCharge: 900,
    deliveryDays: "5-7 business days",
    flag: "🇲🇾",
  },
];

export const CONVERSION_RATES: Record<string, number> = {
  IN: 1,
  US: 1,
  GB: 1,
  CA: 1,
  AU: 1,
  AE: 1,
  SG: 1,
  MY: 1,
};


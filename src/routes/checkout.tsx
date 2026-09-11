import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { CheckCircle2, Copy, CreditCard, ShieldCheck, ShoppingBag, Truck, Tag, ArrowLeft, Check, Smartphone, Zap, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb, UPI_ID } from "@/lib/firebase";
import { useApp } from "@/lib/store";
import { useCoupons, useDeliverySettings, loadRazorpayScript } from "@/lib/data";
import { COUNTRIES, type Country } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — br_Treasure_Trove" },
      { name: "description", content: "Complete your order via UPI payment. Delivery across India." },
      { property: "og:title", content: "Checkout — br_Treasure_Trove" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { cart, cartTotal, clearCart, formatPrice, convertPrice, country, setCountry, user } = useApp();
  const { data: coupons = [] } = useCoupons();
  const { data: deliverySettings } = useDeliverySettings();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [paymentMode, setPaymentMode] = useState<"razorpay" | "upi_manual">("razorpay");
  const [transactionId, setTransactionId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [previousOrdersCount, setPreviousOrdersCount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [upiCopied, setUpiCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number; currency: string; country?: string } | null>(null);

  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [rzpTab, setRzpTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [userUpiVpa, setUserUpiVpa] = useState("");
  const [selectedBank, setSelectedBank] = useState("State Bank of India");
  const [isRzpProcessing, setIsRzpProcessing] = useState(false);

  // Check customer previous orders count
  useEffect(() => {
    async function checkOrdersCount() {
      const emailToTest = form.email.trim() || user?.email;
      const userIdToTest = user?.uid;
      if (!emailToTest && !userIdToTest) {
        setPreviousOrdersCount(0);
        return;
      }
      try {
        const db = getDb();
        let count = 0;
        if (userIdToTest) {
          const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", userIdToTest)));
          count += snap.size;
        }
        if (count === 0 && emailToTest) {
          const snap = await getDocs(query(collection(db, "orders"), where("customerEmail", "==", emailToTest)));
          count += snap.size;
        }
        setPreviousOrdersCount(count);
      } catch (err) {
        console.error("Error checking order history:", err);
        setPreviousOrdersCount(0);
      }
    }
    checkOrdersCount();
  }, [user, form.email]);

  const activeCoupons = coupons.filter((c) => c.isActive);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        pincode: user.pincode || prev.pincode,
      }));
    }
  }, [user]);

  const setField = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const copyUpiId = async () => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(UPI_ID);
        success = true;
      } catch (err) {
        console.warn("Clipboard API failed:", err);
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = UPI_ID;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }
    if (success) {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2500);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError(null);
    setCouponSuccess(null);

    const codeUpper = couponInput.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === codeUpper && c.isActive);

    if (!found) {
      setCouponError("Invalid or expired coupon code.");
      return;
    }

    // Rule 1: Minimum Order Amount Check
    if (found.minOrderAmount && cartTotal < found.minOrderAmount) {
      setCouponError(
        `Coupon "${found.code}" requires a minimum order subtotal of ₹${found.minOrderAmount}. (Current subtotal: ₹${cartTotal})`
      );
      return;
    }

    const emailToTest = form.email.trim() || user?.email;
    const userIdToTest = user?.uid;

    if (!emailToTest && !userIdToTest) {
      setCouponError("Please sign in or enter your email address to apply coupons.");
      return;
    }

    // Rule 2: Single Use Per Login / Account Check
    try {
      const db = getDb();
      const userOrders: Array<{ couponCode?: string | null }> = [];
      if (userIdToTest) {
        const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", userIdToTest)));
        userOrders.push(...snap.docs.map((d) => d.data() as { couponCode?: string | null }));
      }
      if (emailToTest) {
        const snap = await getDocs(query(collection(db, "orders"), where("customerEmail", "==", emailToTest)));
        userOrders.push(...snap.docs.map((d) => d.data() as { couponCode?: string | null }));
      }

      // Check if this coupon code was already used by this user / email in any previous order
      const alreadyUsed = userOrders.some(
        (o) => o.couponCode && o.couponCode.trim().toUpperCase() === codeUpper
      );

      if (alreadyUsed) {
        setCouponError(
          `Coupon "${found.code}" has already been used on your account. Each coupon can only be used once per user account.`
        );
        return;
      }

      // Rule 3: First-Time Customer Check
      if (found.firstCustomerOnly && userOrders.length > 0) {
        setCouponError(`Coupon "${found.code}" is valid only for first-time customers.`);
        return;
      }
    } catch (err) {
      console.error("Error checking order history for coupon validation:", err);
    }

    setAppliedCoupon({ code: found.code, discount: found.discountAmount });
    setCouponSuccess(`Coupon "${found.code}" applied! Discount: ₹${found.discountAmount}`);
    setCouponError(null);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setCouponSuccess(null);
  };

  const countryRate = deliverySettings?.countryRates?.[country.code];
  const rawDeliveryCharge = countryRate?.deliveryCharge ?? (country.code === "IN" ? (deliverySettings?.deliveryCharge ?? country.deliveryCharge) : country.deliveryCharge);
  const deliveryDaysText = countryRate?.deliveryDays ?? (country.code === "IN" ? (deliverySettings?.deliveryDays || country.deliveryDays) : country.deliveryDays);
  const rawDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const rawSubtotal = cartTotal;
  const rawTotal = Math.max(0, rawSubtotal + rawDeliveryCharge - rawDiscount);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      toast.error("Please fill in all mandatory delivery fields.");
      return;
    }

    if (paymentMode === "upi_manual") {
      const cleanedUtr = transactionId.trim();
      if (!cleanedUtr) {
        toast.error("Please enter the 12-digit UPI Transaction ID / UTR number.");
        return;
      }
      if (cleanedUtr.length !== 12 || !/^\d{12}$/.test(cleanedUtr)) {
        toast.error("Transaction ID / UTR number must be exactly 12 digits.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (appliedCoupon) {
        const emailToTest = form.email.trim() || user?.email;
        const userIdToTest = user?.uid;
        const db = getDb();
        const codeUpper = appliedCoupon.code.trim().toUpperCase();

        const userOrders: Array<{ couponCode?: string | null }> = [];
        if (userIdToTest) {
          const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", userIdToTest)));
          userOrders.push(...snap.docs.map((d) => d.data() as { couponCode?: string | null }));
        }
        if (emailToTest) {
          const snap = await getDocs(query(collection(db, "orders"), where("customerEmail", "==", emailToTest)));
          userOrders.push(...snap.docs.map((d) => d.data() as { couponCode?: string | null }));
        }

        if (userOrders.some((o) => o.couponCode && o.couponCode.trim().toUpperCase() === codeUpper)) {
          toast.error(`Coupon "${appliedCoupon.code}" has already been used on your account.`);
          setAppliedCoupon(null);
          setIsSubmitting(false);
          return;
        }
      }

      const activeUpiId = deliverySettings?.upiId?.trim() || UPI_ID;
      const finalAmount = convertPrice(rawTotal);

      const buildOrderPayload = (paymentInfo: {
        paymentMethod: string;
        status: string;
        paymentStatus: string;
        transactionId: string;
        razorpayPaymentId?: string | null;
        razorpayOrderId?: string | null;
      }) => ({
        customerName: form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        country: country.name,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.images || [],
        })),
        subtotal: convertPrice(rawSubtotal),
        deliveryCharge: convertPrice(rawDeliveryCharge),
        couponCode: appliedCoupon?.code || null,
        couponDiscount: appliedCoupon ? convertPrice(rawDiscount) : 0,
        total: finalAmount,
        currency: country.currency,
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        ...paymentInfo,
      });

      if (paymentMode === "razorpay") {
        const keyId = deliverySettings?.razorpayKeyId?.trim();
        const isRealKey = Boolean(keyId && keyId.length > 15 && (keyId.startsWith("rzp_live_") || keyId.startsWith("rzp_test_")));

        if (isRealKey) {
          const loaded = await loadRazorpayScript();
          if (loaded) {
            const options = {
              key: keyId,
              amount: Math.max(100, Math.round(finalAmount * 100)),
              currency: "INR",
              name: "br_Treasure_Trove",
              description: `Order Payment (${cart.length} item${cart.length > 1 ? "s" : ""})`,
              image: "/favicon.png",
              handler: async function (response: { razorpay_payment_id: string; razorpay_order_id?: string }) {
                try {
                  const payload = buildOrderPayload({
                    paymentMethod: "Razorpay (Online Gateway)",
                    status: "pending",
                    paymentStatus: "pending_verification",
                    transactionId: response.razorpay_payment_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id || null,
                  });

                  const docRef = await addDoc(collection(getDb(), "orders"), payload);
                  clearCart();
                  setCompletedOrder({
                    id: docRef.id,
                    total: finalAmount,
                    currency: country.currency,
                    country: country.name,
                  });
                  toast.success("Payment successful! Order placed.");
                } catch (err) {
                  console.error("Error saving paid order:", err);
                  toast.error("Payment received, but failed to record order. Please contact support.");
                } finally {
                  setIsSubmitting(false);
                }
              },
              prefill: {
                name: form.name.trim(),
                email: form.email.trim(),
                contact: form.phone.trim(),
              },
              theme: { color: "#059669" },
              modal: {
                ondismiss: function () {
                  toast("Payment window closed.");
                  setIsSubmitting(false);
                },
              },
            };

            const razorpayWindow = new (window as unknown as { Razorpay: new (opts: object) => { open: () => void; on: (evt: string, cb: (res: object) => void) => void } }).Razorpay(options);
            razorpayWindow.on("payment.failed", function (resp: object) {
              const errDesc = (resp as { error?: { description?: string } }).error?.description || "Payment failed";
              toast.error(`Payment failed: ${errDesc}`);
              setIsSubmitting(false);
            });
            razorpayWindow.open();
            return;
          }
        }

        // Open Razorpay Interactive Modal Simulator
        setIsRazorpayModalOpen(true);
        return;
      }

      // Manual UPI Transfer Mode
      const payload = buildOrderPayload({
        paymentMethod: "Direct UPI Transfer",
        status: "pending",
        paymentStatus: "pending_verification",
        transactionId: transactionId.trim(),
      });

      const docRef = await addDoc(collection(getDb(), "orders"), payload);
      clearCart();
      setCompletedOrder({
        id: docRef.id,
        total: finalAmount,
        currency: country.currency,
        country: country.name,
      });
      toast.success("Order submitted for verification!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again after signing in . . . . .");
    } finally {
      if (paymentMode === "upi_manual") {
        setIsSubmitting(false);
      }
    }
  };

  const handleRazorpayPaymentSuccess = async () => {
    setIsRzpProcessing(true);
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const finalAmount = convertPrice(rawTotal);

    try {
      const payload = {
        customerName: form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        country: country.name,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.images || [],
        })),
        subtotal: convertPrice(rawSubtotal),
        deliveryCharge: convertPrice(rawDeliveryCharge),
        couponCode: appliedCoupon?.code || null,
        couponDiscount: appliedCoupon ? convertPrice(rawDiscount) : 0,
        total: finalAmount,
        currency: country.currency,
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        paymentMethod: `Razorpay (${rzpTab.toUpperCase()} - ${rzpTab === "upi" ? selectedUpiApp : rzpTab === "netbanking" ? selectedBank : "Card"})`,
        status: "pending",
        paymentStatus: "pending_verification",
        transactionId: mockPaymentId,
        razorpayPaymentId: mockPaymentId,
      };

      const docRef = await addDoc(collection(getDb(), "orders"), payload);
      clearCart();
      setIsRazorpayModalOpen(false);
      setCompletedOrder({
        id: docRef.id,
        total: finalAmount,
        currency: country.currency,
        country: country.name,
      });
      toast.success("Razorpay Payment Successful! Order confirmed.");
    } catch (err) {
      console.error("Error completing Razorpay payment:", err);
      toast.error("Failed to complete payment. Please try again after signing in . . . . .");
    } finally {
      setIsRzpProcessing(false);
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lift">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl text-primary">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We have received your order and will start processing it right away.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Reference:</span>
              <span className="font-mono font-semibold uppercase">#{completedOrder.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid:</span>
              <span className="font-semibold text-primary">
                {completedOrder.currency}
                {completedOrder.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Delivery:</span>
              <span>{deliveryDaysText} ({completedOrder.country || country.name})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">UPI Transfer</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Button asChild size="lg">
              <Link to="/orders">View My Orders</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl text-primary">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add items to your cart before proceeding to checkout.</p>
        <Button asChild className="mt-6">
          <Link to="/shop">Explore Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cart">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Return to Cart
          </Link>
        </Button>
      </div>

      <h1 className="font-display text-4xl text-primary">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Complete your delivery and payment details below.</p>

      <form onSubmit={handleSubmitOrder} className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left Column: Form Steps */}
        <div className="space-y-6">
          {/* Step 1: Customer & Delivery Details */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-2xl text-primary">
              <Truck className="h-5 w-5 text-gold-foreground" /> Delivery Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Destination Country</span>
                  <select
                    value={country.code}
                    onChange={(e) => {
                      const found = COUNTRIES.find((c) => c.code === e.target.value);
                      if (found) setCountry(found);
                    }}
                    className="mt-1 bg-transparent font-semibold text-sm text-foreground focus:outline-none cursor-pointer border border-border rounded-md px-2 py-1"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-background text-foreground">
                        {c.flag} {c.name} ({c.currencyCode})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-xs rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium px-3 py-1.5 border border-emerald-500/30 self-start sm:self-auto">
                  Flat Shipping {rawDeliveryCharge === 0 ? "FREE" : formatPrice(rawDeliveryCharge)} • {deliveryDaysText}
                </span>
              </div>

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address">Street Address / Door No. *</Label>
                <Input
                  id="address"
                  required
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Flat 102, Green Avenue, MG Road"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="Chennai"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="pincode">Zip / Postal Code *</Label>
                <Input
                  id="pincode"
                  required
                  value={form.pincode}
                  onChange={(e) => setField("pincode", e.target.value)}
                  placeholder="600001"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Options */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-2xl text-primary">
              <CreditCard className="h-5 w-5 text-gold-foreground" /> Payment Method
            </h2>

            <div className="mt-5 space-y-4">
              {/* Option 1: Razorpay Online Payment */}
              <div
                onClick={() => setPaymentMode("razorpay")}
                className={`rounded-lg border p-4 cursor-pointer transition-all ${paymentMode === "razorpay"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_mode"
                      checked={paymentMode === "razorpay"}
                      onChange={() => setPaymentMode("razorpay")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-gold-foreground fill-gold" /> Online Payment via Razorpay
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Instant UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking & Wallets
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold shrink-0 hidden sm:inline-block">
                    Instant & Automated
                  </span>
                </div>
              </div>

              {/* Option 2: Direct Manual UPI Transfer */}
              <div
                onClick={() => setPaymentMode("upi_manual")}
                className={`rounded-lg border p-4 cursor-pointer transition-all ${paymentMode === "upi_manual"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_mode"
                      checked={paymentMode === "upi_manual"}
                      onChange={() => setPaymentMode("upi_manual")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4 text-primary" /> Direct UPI VPA / QR Transfer
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Transfer to store UPI ID manually and enter 12-digit UTR transaction ref number
                      </p>
                    </div>
                  </div>
                </div>

                {paymentMode === "upi_manual" && (
                  <div className="mt-4 rounded-lg border border-border bg-background p-4 space-y-4">
                    {(() => {
                      const realUpiVpa = deliverySettings?.upiId?.trim() || UPI_ID;
                      const realAmount = convertPrice(rawTotal);
                      const realUpiUrl = `upi://pay?pa=${encodeURIComponent(realUpiVpa)}&pn=${encodeURIComponent("br_Treasure_Trove")}&am=${realAmount}&cu=INR&tn=${encodeURIComponent("GiftCraft Order Payment")}`;
                      const realQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(realUpiUrl)}`;

                      return (
                        <>
                          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border">
                            <img
                              src={realQrUrl}
                              alt="Real Money UPI QR Code"
                              className="h-36 w-36 rounded-lg border border-border p-1.5 bg-white object-contain shrink-0 shadow-sm"
                            />
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <span className="text-xs font-bold text-foreground block">
                                Scan & Pay ₹{realAmount.toLocaleString()} Directly
                              </span>
                              <p className="text-[0.75rem] text-muted-foreground leading-relaxed">
                                Scan this QR code with Google Pay, PhonePe, Paytm, or BHIM to send real money directly to merchant bank account.
                              </p>
                              <a
                                href={realUpiUrl}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors mt-1 w-full sm:w-auto"
                              >
                                <Zap className="h-3.5 w-3.5 fill-gold text-gold-foreground" /> Open UPI App & Pay ₹{realAmount.toLocaleString()}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-2.5">
                            <div>
                              <span className="text-xs text-muted-foreground block">Store Official UPI VPA</span>
                              <span className="font-mono text-sm font-bold text-primary">
                                {realUpiVpa}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={upiCopied ? "gold" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyUpiId();
                              }}
                            >
                              {upiCopied ? (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      );
                    })()}

                    <div onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="utr" className="text-xs font-semibold">
                          Transaction ID / UTR Ref No. *
                        </Label>
                        <span
                          className={`text-[0.7rem] font-mono ${transactionId.length === 12
                            ? "text-emerald-600 font-semibold dark:text-emerald-400"
                            : transactionId.length > 0
                              ? "text-amber-600 font-medium dark:text-amber-400"
                              : "text-muted-foreground"
                            }`}
                        >
                          {transactionId.length}/12 digits
                        </span>
                      </div>
                      <Input
                        id="utr"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={12}
                        required={paymentMode === "upi_manual"}
                        value={transactionId}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setTransactionId(val);
                        }}
                        placeholder="e.g. 425619803210 (12 digits)"
                        className={`mt-1 font-mono tracking-wider ${transactionId.length > 0 && transactionId.length < 12
                          ? "border-amber-500 focus-visible:ring-amber-500"
                          : transactionId.length === 12
                            ? "border-emerald-500 focus-visible:ring-emerald-500"
                            : ""
                          }`}
                      />
                      <p className="mt-1 text-[0.75rem] text-muted-foreground">
                        Enter the 12-digit UTR or reference number shown in your UPI app after completing payment.
                      </p>
                      {transactionId.length > 0 && transactionId.length < 12 && (
                        <p className="mt-0.5 text-[0.75rem] font-medium text-amber-600 dark:text-amber-400">
                          UTR reference number must be exactly 12 digits ({12 - transactionId.length} more needed).
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <aside className="space-y-6">
          {/* Coupon Code Box */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 font-display text-lg">
              <Tag className="h-4 w-4 text-gold-foreground" /> Coupon Code
            </h3>

            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                <div>
                  <span className="font-semibold text-primary">{appliedCoupon.code}</span>
                  <span className="block text-xs text-muted-foreground">
                    Discount applied: -{formatPrice(appliedCoupon.discount)}
                  </span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive">
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                      setCouponSuccess(null);
                    }}
                    placeholder="Enter code (e.g. FIRST1500)"
                    className="uppercase"
                  />
                  <Button type="button" onClick={handleApplyCoupon} variant="secondary">
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Error Message directly under the input box */}
            {couponError && (
              <div className="mt-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2 animate-in fade-in duration-200">
                <span className="font-bold text-sm shrink-0">⚠️</span>
                <span className="leading-tight font-medium">{couponError}</span>
              </div>
            )}

            {/* Inline Success Message directly under the input box */}
            {couponSuccess && (
              <div className="mt-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in duration-200">
                <span className="font-bold text-sm shrink-0">✓</span>
                <span className="leading-tight font-medium">{couponSuccess}</span>
              </div>
            )}

            {/* Available Coupons List */}
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Available Offers
              </span>
              {activeCoupons.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active coupons available right now.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeCoupons.map((c) => {
                    const meetsMinOrder = !c.minOrderAmount || cartTotal >= c.minOrderAmount;
                    const meetsFirstCustomer = !c.firstCustomerOnly || (previousOrdersCount !== null && previousOrdersCount === 0);
                    const isEligible = meetsMinOrder && meetsFirstCustomer;
                    const isApplied = appliedCoupon?.code === c.code;

                    let reason = "";
                    if (!meetsMinOrder) {
                      const needed = (c.minOrderAmount || 0) - cartTotal;
                      reason = `Requires min order ₹${c.minOrderAmount} (Add ₹${needed} more)`;
                    } else if (!meetsFirstCustomer) {
                      reason = "Valid for first-time customers only";
                    }

                    return (
                      <div
                        key={c.id}
                        className={`rounded-lg border p-3 text-xs transition-all ${isApplied
                          ? "border-emerald-500 bg-emerald-500/10"
                          : isEligible
                            ? "border-border bg-card hover:border-gold/60"
                            : "border-border/60 bg-muted/40 opacity-75"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary text-sm uppercase truncate">
                                {c.code}
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                ₹{c.discountAmount} OFF
                              </span>
                            </div>
                            {c.description && (
                              <p className="text-[0.75rem] text-muted-foreground mt-0.5 truncate">{c.description}</p>
                            )}
                          </div>

                          {isApplied ? (
                            <span className="rounded bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300 text-[0.75rem] shrink-0">
                              Applied ✓
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant={isEligible ? "outline" : "ghost"}
                              disabled={!isEligible}
                              onClick={() => {
                                setAppliedCoupon({ code: c.code, discount: c.discountAmount });
                                setCouponInput(c.code);
                                setCouponSuccess(`Coupon "${c.code}" applied! Discount: ₹${c.discountAmount}`);
                                setCouponError(null);
                              }}
                              className={`h-7 text-xs font-semibold shrink-0 ${isEligible
                                ? "border-primary text-primary hover:bg-primary/10"
                                : "text-muted-foreground bg-muted/50 cursor-not-allowed"
                                }`}
                            >
                              {isEligible ? "Apply" : "Disabled"}
                            </Button>
                          )}
                        </div>

                        {!isEligible && (
                          <div className="mt-2 text-[0.725rem] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 border-t border-border/40 pt-1.5">
                            <span>🔒</span> {reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary Box */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-2xl">Order Summary</h2>

            {/* Item List */}
            <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg">{item.icon || "🎁"}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(rawSubtotal)}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery ({country.name})</dt>
                <dd>{formatPrice(rawDeliveryCharge)}</dd>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <dt>Coupon Discount ({appliedCoupon.code})</dt>
                  <dd>-{formatPrice(rawDiscount)}</dd>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                <dt>Total Amount</dt>
                <dd className="text-primary">{formatPrice(rawTotal)}</dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing Order…" : `Place Order (${formatPrice(rawTotal)})`}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-gold-foreground" />
              <span>Safe & Secure Checkout</span>
            </div>
          </div>
        </aside>
      </form>

      {/* Interactive Razorpay Payment Simulator Modal */}
      {isRazorpayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lift overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-gold ring-1 ring-gold/50">
                  br
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">br_Treasure_Trove</h3>
                  <p className="text-xs text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold fill-gold/20" /> Secured by Razorpay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRazorpayModalOpen(false);
                  setIsSubmitting(false);
                  toast("Payment window closed.");
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Amount Bar */}
            <div className="bg-emerald-900/30 px-5 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Amount
              </span>
              <span className="text-xl font-extrabold text-primary">
                {country.currency}{convertPrice(rawTotal).toLocaleString()}
              </span>
            </div>

            {/* Payment Tabs */}
            <div className="p-5 space-y-4">
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setRzpTab("upi")}
                  className={cn(
                    "flex-1 pb-2.5 text-xs font-bold transition-colors border-b-2",
                    rzpTab === "upi"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  📱 UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setRzpTab("card")}
                  className={cn(
                    "flex-1 pb-2.5 text-xs font-bold transition-colors border-b-2",
                    rzpTab === "card"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  💳 Cards
                </button>
                <button
                  type="button"
                  onClick={() => setRzpTab("netbanking")}
                  className={cn(
                    "flex-1 pb-2.5 text-xs font-bold transition-colors border-b-2",
                    rzpTab === "netbanking"
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  🏦 Net Banking
                </button>
              </div>

              {/* Tab Content */}
              {rzpTab === "upi" && (
                <div className="space-y-3">
                  {(() => {
                    const realUpiVpa = deliverySettings?.upiId?.trim() || UPI_ID;
                    const realAmount = convertPrice(rawTotal);
                    const realUpiUrl = `upi://pay?pa=${encodeURIComponent(realUpiVpa)}&pn=${encodeURIComponent("br_Treasure_Trove")}&am=${realAmount}&cu=INR&tn=${encodeURIComponent("GiftCraft Order Payment")}`;
                    const realQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(realUpiUrl)}`;

                    return (
                      <>
                        <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border">
                          <img
                            src={realQrUrl}
                            alt="UPI QR"
                            className="h-24 w-24 rounded border p-1 bg-white object-contain shrink-0"
                          />
                          <div className="flex-1 space-y-1.5 text-left">
                            <span className="text-xs font-bold text-foreground block">
                              Pay Real Money ₹{realAmount.toLocaleString()}
                            </span>
                            <p className="text-[0.7rem] text-muted-foreground leading-tight">
                              Scan QR or tap below to open GPay/PhonePe and transfer to {realUpiVpa}.
                            </p>
                            <a
                              href={realUpiUrl}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[0.7rem] font-bold transition-colors"
                            >
                              <Zap className="h-3 w-3 fill-gold text-gold-foreground" /> Launch UPI App
                            </a>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground font-medium pt-1">Select Instant UPI App:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["Google Pay", "PhonePe", "Paytm", "BHIM UPI"].map((app) => (
                            <button
                              key={app}
                              type="button"
                              onClick={() => setSelectedUpiApp(app)}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all text-left",
                                selectedUpiApp === app
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-background hover:bg-muted"
                              )}
                            >
                              <Zap className="h-3.5 w-3.5 fill-gold text-gold-foreground shrink-0" />
                              <span>{app}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {rzpTab === "card" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs text-muted-foreground">Card Number</Label>
                    <Input placeholder="4532 •••• •••• 8921" defaultValue="4532 8910 2341 8921" className="mt-1 text-xs font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                      <Input placeholder="MM / YY" defaultValue="12/28" className="mt-1 text-xs font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CVV</Label>
                      <Input type="password" maxLength={4} defaultValue="888" className="mt-1 text-xs font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {rzpTab === "netbanking" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Select NetBanking Bank:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-semibold transition-all text-left",
                          selectedBank === b
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:bg-muted"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                type="button"
                onClick={handleRazorpayPaymentSuccess}
                disabled={isRzpProcessing}
                className="w-full h-11 text-base font-bold gap-2 mt-4"
              >
                {isRzpProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing Payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {country.currency}{convertPrice(rawTotal).toLocaleString()}
                  </>
                )}
              </Button>
            </div>

            <div className="bg-muted/40 p-3 text-center border-t border-border">
              <span className="text-[0.7rem] text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-bit SSL Encrypted Payment by Razorpay
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Gift,
  ShieldCheck,
  Sparkles,
  Truck,
  Tag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/hero-gifts.jpg";
import bannerImg from "@/assets/chains-gems-banner.jpg";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { usePosters, useProducts, useCoupons } from "@/lib/data";
import { CATEGORIES, type Poster } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "br_Treasure_Trove — Handcrafted Gifts, Jewellery & Keepsakes" },
      {
        name: "description",
        content:
          "Shop handcrafted gifts, resin art, jewellery, hampers and personalised keepsakes. Worldwide shipping from India.",
      },
      { property: "og:title", content: "br_Treasure_Trove — Handcrafted Gifts & Keepsakes" },
      {
        property: "og:description",
        content: "Handpicked gifts and handcrafted keepsakes, shipped worldwide from India.",
      },
    ],
  }),
  component: Home,
});

/* ==========================================================================
   ANIMATED HERO BANNER CAROUSEL
   ========================================================================== */
function HeroBannerCarousel({ posters }: { posters: Poster[] }) {
  // Combine default banner with active posters from Firestore
  const defaultBannerItem: Poster = useMemo(
    () => ({
      id: "chains-gems-banner",
      title: "Chains & Gems — Special Offers",
      imageUrl: bannerImg,
      link: "/shop",
      isActive: true,
    }),
    []
  );

  const allBanners = useMemo(() => {
    return [defaultBannerItem, ...posters];
  }, [defaultBannerItem, posters]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play smooth slide animation every 4.5 seconds
  useEffect(() => {
    if (allBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [allBanners.length]);

  const currentBanner: Poster = allBanners[currentIndex] ?? defaultBannerItem;

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allBanners.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allBanners.length) % allBanners.length);
  };

  const isDefaultBanner = currentBanner.id === "chains-gems-banner";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative w-full max-w-lg lg:max-w-none mx-auto"
    >
      <div className="relative group overflow-hidden rounded-2xl border-2 border-gold/70 bg-card/40 p-2 backdrop-blur-md shadow-lift">
        {/* Animated Slide Container matching banner image aspect ratio */}
        <div className="relative w-full aspect-[8/3] sm:aspect-[8/3] overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative block h-full w-full overflow-hidden rounded-xl"
            >
              <Link to={currentBanner.link || "/shop"} className="relative block h-full w-full">
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Top Banner Badge Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gold/90 text-primary-foreground px-3 py-1 text-xs font-bold shadow-md z-10 backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  {isDefaultBanner ? "Chains & Gems" : "Special Offers"}
                </div>

                {/* Render text overlay only for custom uploaded photo banners that do not have text embedded */}
                {!isDefaultBanner && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent rounded-xl pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 z-10">
                      <h3 className="font-display text-lg sm:text-2xl text-white font-bold drop-shadow-md leading-tight mt-0.5">
                        {currentBanner.title}
                      </h3>
                      <span className="mt-1.5 inline-flex items-center text-xs font-semibold text-gold-foreground bg-black/60 px-3 py-1 rounded-full border border-gold/40 shadow-sm backdrop-blur-xs">
                        Shop Special Deals <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </>
                )}
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Controls if multiple banners */}
          {allBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous banner"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 focus:outline-none z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next banner"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 focus:outline-none z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                {allBanners.map((b, idx) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-6 bg-gold" : "w-2 bg-white/50 hover:bg-white"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Home() {
  const { data: products = [], isLoading } = useProducts();
  const { data: posters = [] } = usePosters();
  const { data: coupons = [] } = useCoupons();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeCoupons = coupons.filter((c) => c.isActive);
  const featured = products.slice(0, 8);

  const handleCopyCode = async (code: string) => {
    let success = false;

    // Try modern Clipboard API if supported and in secure context
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(code);
        success = true;
      } catch (err) {
        console.warn("Clipboard API failed, using fallback:", err);
      }
    }

    // Fallback using document.execCommand
    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = code;
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
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } else {
      toast.error(`Coupon code is: ${code}`);
    }
  };

  return (
    <div>
      {/* HERO SECTION WITH RIGHT SIDE ANIMATED BANNER */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Handcrafted gift collection"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 text-primary-foreground"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-3.5 py-1 text-xs tracking-[0.2em] uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Handmade with love
              </span>
              <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Gifts worth treasuring, crafted one at a time
              </h1>
              <p className="mt-5 max-w-xl text-base text-primary-foreground/85 sm:text-lg">
                Resin art, jewellery, hampers and personalised keepsakes — thoughtfully made in India
                and delivered to your doorstep worldwide.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="gold" asChild>
                  <Link to="/shop">
                    Shop the collection <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link to="/about">Our story</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Side Offers Animated Banner */}
            <div className="lg:col-span-5">
              <HeroBannerCarousel posters={posters} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Worldwide Shipping", text: "Fast & Express Delivery" },
            { icon: Gift, title: "Personalised", text: "Made to your brief" },
            { icon: ShieldCheck, title: "Secure checkout", text: "UPI Payments" },
            { icon: Sparkles, title: "Handcrafted", text: "Small-batch quality" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Special Offers & Coupon Section */}
      <section className="bg-gradient-to-br from-gold/10 via-background to-primary/5 border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-foreground bg-gold/20 px-3 py-1 rounded-full border border-gold/40">
                <Tag className="h-3.5 w-3.5" /> Exclusive Offers
              </span>
              <h2 className="font-display text-3xl text-primary mt-2">Special Offers & Coupon Codes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Apply these promo codes at checkout for extra savings!
              </p>
            </div>
            <Button variant="outline" asChild size="sm">
              <Link to="/shop">
                Shop Now to Use <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {activeCoupons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCoupons.map((c) => (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-2xl border border-gold/30 bg-card p-5 shadow-soft transition-all duration-300 hover:border-gold/60 hover:shadow-lift flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 translate-x-6 -translate-y-6 rotate-45 bg-gold/15" />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{c.discountAmount} OFF
                      </span>
                      <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20">
                        PROMO CODE
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium text-foreground">
                      {c.description || (c.firstCustomerOnly ? "Valid for first-time customers" : "Special discount coupon")}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[0.75rem]">
                      {c.firstCustomerOnly && (
                        <span className="rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 font-medium border border-blue-500/30">
                          First Order Only
                        </span>
                      )}
                      {c.minOrderAmount && (
                        <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 font-medium border border-amber-500/30">
                          Min Order ₹{c.minOrderAmount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => handleCopyCode(c.code)}
                    className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-muted/50 p-2.5 cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <span className="font-mono text-base font-extrabold uppercase tracking-widest text-primary px-2">
                      {c.code}
                    </span>
                    <Button
                      size="sm"
                      variant={copiedCode === c.code ? "gold" : "secondary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(c.code);
                      }}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center max-w-xl mx-auto">
              <Tag className="mx-auto h-8 w-8 text-gold-foreground mb-3 opacity-80" />
              <h3 className="font-display text-xl text-primary">First Order Special Offer!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get <span className="font-bold text-primary">₹200 OFF</span> on your first purchase for orders above <span className="font-bold text-primary">₹1500</span>!
              </p>
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-dashed border-gold bg-gold/10 px-4 py-2">
                <span className="font-mono text-lg font-bold text-primary tracking-widest">FIRST1500</span>
                <Button size="sm" variant="gold" onClick={() => handleCopyCode("FIRST1500")}>
                  Copy Code
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>



      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-3xl text-primary">Shop by category</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/shop"
              search={{ category: c }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-primary">Featured picks</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No products published yet — add them from the admin dashboard.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

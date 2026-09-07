import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Gift, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-gifts.jpg";
import { useProducts, usePosters } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "br_Treasure_Trove — Handcrafted Gifts, Resin Art & Jewellery" },
      {
        name: "description",
        content:
          "Shop handcrafted gifts, resin art, jewellery, hampers and personalised keepsakes. Made in India, delivered worldwide.",
      },
      { property: "og:title", content: "br_Treasure_Trove — Handcrafted Gifts & Keepsakes" },
      {
        property: "og:description",
        content: "Handpicked gifts, resin art and personalised keepsakes shipped worldwide.",
      },
    ],
  }),
  component: Index,
});

const perks = [
  { icon: Gift, title: "Handcrafted", text: "Every piece finished by hand in small batches." },
  { icon: Globe2, title: "Worldwide shipping", text: "Delivered to 8+ countries with live pricing." },
  { icon: ShieldCheck, title: "Secure checkout", text: "UPI and cash on delivery, no hidden fees." },
];

function Index() {
  const { data: products, isLoading } = useProducts();
  const { data: posters } = usePosters();
  const featured = (products ?? []).slice(0, 8);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-background/10 px-3 py-1 text-xs tracking-[0.2em] text-gold uppercase">
              <Sparkles className="h-3.5 w-3.5" /> br_innovate presents
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight text-primary-foreground sm:text-5xl md:text-6xl">
              Gifts worth keeping, crafted with care
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/85">
              Resin art, jewellery, hampers and personalised keepsakes — thoughtfully made in India
              and shipped across the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gold">
                <Link to="/shop">
                  Shop the collection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/about">Our story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="rounded-lg bg-secondary p-2.5 text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {posters && posters.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {posters.slice(0, 2).map((poster) => (
              <a
                key={poster.id}
                href={poster.link || "/shop"}
                className="group relative block overflow-hidden rounded-xl shadow-soft"
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  loading="lazy"
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-foreground/70 to-transparent p-4 font-display text-xl text-primary-foreground">
                  {poster.title}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

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

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-primary">Featured picks</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {!isLoading && featured.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Products will appear here once they are added in the admin dashboard.
          </p>
        )}
      </section>
    </div>
  );
}

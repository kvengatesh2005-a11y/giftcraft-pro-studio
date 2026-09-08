import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import heroImg from "@/assets/hero-gifts.jpg";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { usePosters, useProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

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

function Home() {
  const { data: products = [], isLoading } = useProducts();
  const { data: posters = [] } = usePosters();
  const featured = products.slice(0, 8);

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Handcrafted gift collection"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/75 to-primary/35" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-primary-foreground"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-xs tracking-[0.2em] uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Handmade with love
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
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
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Worldwide shipping", text: "8 countries, live currency" },
            { icon: Gift, title: "Personalised", text: "Made to your brief" },
            { icon: ShieldCheck, title: "Secure checkout", text: "UPI & cash on delivery" },
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

      {posters.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {posters.slice(0, 2).map((p) => (
              <a
                key={p.id}
                href={p.link || "/shop"}
                className="group relative block overflow-hidden rounded-xl shadow-soft"
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-4 left-4 rounded-md bg-background/85 px-3 py-1.5 font-display text-lg">
                  {p.title}
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

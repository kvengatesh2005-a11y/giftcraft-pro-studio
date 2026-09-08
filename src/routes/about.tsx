import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — br_Treasure_Trove" },
      {
        name: "description",
        content:
          "br_Treasure_Trove is a small-batch Indian gifting studio making resin art, jewellery and personalised keepsakes.",
      },
      { property: "og:title", content: "Our Story — br_Treasure_Trove" },
      {
        property: "og:description",
        content: "A small-batch Indian gifting studio making handcrafted keepsakes.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-primary sm:text-5xl">Crafted to be kept</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        br_Treasure_Trove began as a home studio with a simple belief: a gift should feel like it
        was made for one person only. Every piece we ship — resin art, hand-set jewellery, hampers,
        keychains and personalised keepsakes — is finished by hand in small batches.
      </p>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        We work with makers across India, keep our runs deliberately small, and pack each order like
        it's going to someone we know. Today we ship to eight countries, with prices shown in your
        local currency at checkout.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {[
          { icon: Sparkles, t: "Small batch", d: "Nothing mass produced. Every run is limited." },
          { icon: HeartHandshake, t: "Made to order", d: "Names, dates, colours — tell us." },
          { icon: Leaf, t: "Careful packing", d: "Protective, giftable, minimal waste." },
          { icon: Gift, t: "Worldwide", d: "Eight countries and growing." },
        ].map((v) => (
          <div key={v.t} className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <v.icon className="h-6 w-6 text-gold-foreground" />
            <h2 className="mt-3 font-display text-xl">{v.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex gap-3">
        <Button asChild size="lg">
          <Link to="/shop">Browse gifts</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/contact">Talk to us</Link>
        </Button>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useApp } from "@/lib/store";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — br_Treasure_Trove" },
      { name: "description", content: "Saved handcrafted gifts you love, ready when you are." },
      { property: "og:title", content: "Your Wishlist — br_Treasure_Trove" },
      { property: "og:description", content: "Saved handcrafted gifts you love." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-primary">Your wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing saved yet. Tap the heart on any product to keep it here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

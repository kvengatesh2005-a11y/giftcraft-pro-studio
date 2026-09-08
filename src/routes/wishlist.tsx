import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — br_Treasure_Trove" },
      { name: "description", content: "Gifts you've saved for later at br_Treasure_Trove." },
      { property: "og:title", content: "My Wishlist — br_Treasure_Trove" },
      { property: "og:description", content: "Gifts you've saved for later." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-primary">My wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="py-24 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Nothing saved yet.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Find something lovely</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {wishlist.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

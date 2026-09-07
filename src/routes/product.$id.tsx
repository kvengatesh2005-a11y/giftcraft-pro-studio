import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { getDb } from "@/lib/firebase";
import { useProduct, useProducts, useReviews } from "@/lib/data";
import { useApp } from "@/lib/store";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — br_Treasure_Trove" },
      {
        name: "description",
        content: "Handcrafted gift details, pricing, reviews and worldwide delivery estimates.",
      },
      { property: "og:title", content: "Product Details — br_Treasure_Trove" },
      { property: "og:description", content: "Handcrafted gift details, reviews and delivery." },
    ],
  }),
  component: ProductPage,
});

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= value ? "fill-gold text-gold" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: products } = useProducts();
  const { data: reviews } = useReviews(id);
  const { addToCart, toggleWishlist, isWishlisted, formatPrice, country, user } = useApp();
  const queryClient = useQueryClient();

  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary">Product not found</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const soldOut = typeof product.stock === "number" && product.stock <= 0;
  const avg = reviews?.length
    ? reviews.reduce((n, r) => n + Number(r.rating || 0), 0) / reviews.length
    : Number(product.rating || 0);
  const related = (products ?? [])
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const submitReview = async () => {
    if (!comment.trim() || !(name.trim() || user?.name)) {
      toast.error("Please add your name and a short review");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(getDb(), "reviews"), {
        productId: id,
        userId: user?.uid ?? null,
        userName: user?.name || name.trim(),
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
      setComment("");
      setName("");
      toast.success("Thanks for your review!");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    } catch {
      toast.error("Could not save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
            {images[active] ? (
              <img
                src={images[active]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-8xl">
                {product.icon || "🎁"}
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-18 w-18 shrink-0 overflow-hidden rounded-lg border-2",
                    i === active ? "border-primary" : "border-transparent",
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
            {product.category}
          </span>
          <h1 className="mt-2 font-display text-3xl leading-tight text-primary sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <Stars value={Math.round(avg)} />
            <span className="text-sm text-muted-foreground">
              {reviews?.length ? `${avg.toFixed(1)} · ${reviews.length} reviews` : "No reviews yet"}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            ) : null}
          </div>

          {product.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button
                className="px-3 py-2 disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                className="px-3 py-2"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {typeof product.stock === "number" && (
              <span className="text-sm text-muted-foreground">{product.stock} in stock</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={soldOut}
              onClick={() => addToCart(product, qty)}
              className="flex-1 min-w-40"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {soldOut ? "Sold out" : "Add to cart"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleWishlist(product)}>
              <Heart
                className={cn(
                  "mr-2 h-4 w-4",
                  isWishlisted(product.id) && "fill-destructive text-destructive",
                )}
              />
              Wishlist
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
            <Truck className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">
                Delivery to {country.flag} {country.name} in {country.deliveryDays} days
              </p>
              <p className="text-muted-foreground">
                Shipping {formatPrice(country.deliveryCharge)} · UPI & cash on delivery
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-primary">Reviews</h2>
        <div className="mt-5 grid gap-8 md:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {reviews?.length ? (
              reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.userName}</span>
                    <Stars value={Number(r.rating)} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Be the first to review this product.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Write a review</h3>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    className={cn(
                      "h-6 w-6",
                      n <= rating ? "fill-gold text-gold" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            {!user && (
              <Input
                className="mt-3"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Textarea
              className="mt-3"
              rows={4}
              placeholder="What did you think?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button className="mt-3 w-full" onClick={submitReview} disabled={saving}>
              {saving ? "Posting…" : "Post review"}
            </Button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

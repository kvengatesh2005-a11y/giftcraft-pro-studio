import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useProduct, useProducts, useReviews } from "@/lib/data";
import { getDb } from "@/lib/firebase";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — br_Treasure_Trove" },
      {
        name: "description",
        content: "Handcrafted gift details, reviews and delivery information.",
      },
      { property: "og:title", content: "Product Details — br_Treasure_Trove" },
      { property: "og:description", content: "Handcrafted gift details and reviews." },
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
          className={cn(
            "h-4 w-4",
            n <= value ? "fill-gold text-gold" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: all = [] } = useProducts();
  const { data: reviews = [], refetch } = useReviews(id);
  const { addToCart, toggleWishlist, isWishlisted, formatPrice, country, user } = useApp();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-xl bg-muted m-8" />;
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Product not found</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const soldOut = typeof product.stock === "number" && product.stock <= 0;
  const related = all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const avg = reviews.length
    ? reviews.reduce((n, r) => n + Number(r.rating || 0), 0) / reviews.length
    : Number(product.rating || 0);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(getDb(), "reviews"), {
        productId: id,
        userId: user?.uid ?? null,
        userName: user?.name || name || "Guest",
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
      setComment("");
      setName("");
      toast.success("Thanks for your review!");
      refetch();
    } catch {
      toast.error("Couldn't post your review. Please try again.");
    } finally {
      setBusy(false);
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
              <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-8xl">
                {product.icon || "🎁"}
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-16 w-16 overflow-hidden rounded-md border-2",
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
          <h1 className="mt-2 font-display text-3xl text-primary sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <Stars value={Math.round(avg)} />
            <span className="text-xs text-muted-foreground">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
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
            <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{qty}</span>
            <Button size="icon" variant="outline" onClick={() => setQty((q) => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">
              {soldOut
                ? "Out of stock"
                : typeof product.stock === "number"
                  ? `${product.stock} in stock`
                  : "In stock"}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={soldOut}
              onClick={() => addToCart(product, qty)}
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleWishlist(product)}>
              <Heart
                className={cn(
                  "h-4 w-4",
                  isWishlisted(product.id) && "fill-destructive text-destructive",
                )}
              />
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-card p-4 text-sm">
            <Truck className="mt-0.5 h-4 w-4 text-gold-foreground" />
            <span className="text-muted-foreground">
              Ships to {country.name} in {country.deliveryDays} days · delivery{" "}
              {formatPrice(country.deliveryCharge)}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-primary">Reviews</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet — be the first to share one.
              </p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.userName}</span>
                  <Stars value={Number(r.rating) || 0} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={submitReview}
            className="h-fit space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <h3 className="font-display text-lg">Write a review</h3>
            {!user && (
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star
                    className={cn(
                      "h-6 w-6",
                      n <= rating ? "fill-gold text-gold" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              rows={4}
              placeholder="What did you think?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Posting…" : "Post review"}
            </Button>
          </form>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary">You may also like</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

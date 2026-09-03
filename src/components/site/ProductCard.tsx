import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWishlist, isWishlisted, formatPrice } = useApp();
  const image = product.images?.[0];
  const saved = isWishlisted(product.id);
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
      className="card-hover group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft"
    >
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-6xl">
            {product.icon || "🎁"}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-semibold text-gold-foreground">
            {discount}% OFF
          </span>
        )}
        {typeof product.stock === "number" && product.stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-sm font-semibold tracking-wide text-primary-foreground uppercase">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          {product.category}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 font-display text-lg leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-semibold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" size="sm" onClick={() => addToCart(product)}>
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Add to cart
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Wishlist"
            onClick={() => toggleWishlist(product)}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

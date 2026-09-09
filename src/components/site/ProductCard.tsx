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
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-full bg-gold px-2 py-0.5 sm:px-2.5 sm:py-1 text-[0.6rem] sm:text-[0.68rem] font-semibold text-gold-foreground">
            {discount}% OFF
          </span>
        )}
        {typeof product.stock === "number" && product.stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-xs sm:text-sm font-semibold tracking-wide text-primary-foreground uppercase">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          {product.category}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 font-display text-sm sm:text-lg leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1 sm:pt-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice ? (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
          <Button className="flex-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" size="sm" onClick={() => addToCart(product)}>
            <ShoppingBag className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="truncate">Add to cart</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            aria-label="Wishlist"
            onClick={() => toggleWishlist(product)}
          >
            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", saved && "fill-destructive text-destructive")} />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

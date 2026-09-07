import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — br_Treasure_Trove" },
      { name: "description", content: "Review the handcrafted gifts in your cart and checkout securely." },
      { property: "og:title", content: "Your Cart — br_Treasure_Trove" },
      { property: "og:description", content: "Review your gifts and checkout securely." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQuantity, removeFromCart, formatPrice, cartTotal, country } = useApp();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl text-primary">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a few handcrafted treasures and they'll show up here.
        </p>
        <Button asChild className="mt-6">
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-primary">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl">
                    {item.icon || "🎁"}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <Link
                  to="/product/$id"
                  params={{ id: item.id }}
                  className="font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <span className="text-xs text-muted-foreground">{item.category}</span>
                <span className="mt-1 font-semibold text-primary">{formatPrice(item.price)}</span>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      className="px-2.5 py-1.5"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      className="px-2.5 py-1.5"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl text-primary">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(cartTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery ({country.name})</dt>
              <dd>{formatPrice(country.deliveryCharge)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{formatPrice(cartTotal + country.deliveryCharge)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-5 w-full" size="lg">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

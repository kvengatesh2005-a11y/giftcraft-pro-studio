import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — br_Treasure_Trove" },
      { name: "description", content: "Review the handcrafted gifts in your cart and check out." },
      { property: "og:title", content: "Your Cart — br_Treasure_Trove" },
      { property: "og:description", content: "Review your gifts and check out." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, formatPrice, country } = useApp();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl text-primary">Your cart is empty</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const delivery = country.deliveryCharge;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-primary">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
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
                  className="font-display text-lg hover:text-primary"
                >
                  {item.name}
                </Link>
                <span className="text-xs text-muted-foreground">{item.category}</span>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-2xl">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(cartTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery ({country.deliveryDays} days)</dt>
              <dd>{formatPrice(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{formatPrice(cartTotal + delivery)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

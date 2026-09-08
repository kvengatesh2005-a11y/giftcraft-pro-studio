import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { useDeliverySettings } from "@/lib/data";

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
  const { cart, updateQuantity, removeFromCart, cartTotal, formatPrice, country, convertPrice } = useApp();
  const { data: deliverySettings } = useDeliverySettings();

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

  const countryRate = deliverySettings?.countryRates?.[country.code];
  const rawDeliveryCharge = countryRate?.deliveryCharge ?? (country.code === "IN" ? (deliverySettings?.deliveryCharge ?? country.deliveryCharge) : country.deliveryCharge);
  const deliveryDaysText = countryRate?.deliveryDays ?? (country.code === "IN" ? (deliverySettings?.deliveryDays || country.deliveryDays) : country.deliveryDays);

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
                  <div className="flex h-full w-full items-center justify-center font-display text-xl text-primary/40">
                    {item.name[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm font-medium text-primary">
                    {formatPrice(Number(item.price))}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-sm font-medium hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-sm font-medium hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              <dt className="text-muted-foreground">Delivery ({deliveryDaysText} · {country.name})</dt>
              <dd>{rawDeliveryCharge === 0 ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span> : formatPrice(rawDeliveryCharge)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{formatPrice(cartTotal + rawDeliveryCharge)}</dd>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — br_Treasure_Trove" },
      { name: "description", content: "Track the status of your br_Treasure_Trove gift orders." },
      { property: "og:title", content: "My Orders — br_Treasure_Trove" },
      { property: "og:description", content: "Track the status of your gift orders." },
    ],
  }),
  component: Orders,
});

const statusColor: Record<string, string> = {
  pending: "bg-gold/20 text-gold-foreground",
  confirmed: "bg-primary/10 text-primary",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-destructive/10 text-destructive",
};

function Orders() {
  const { user } = useApp();
  const { data: orders = [], isLoading } = useMyOrders(user?.uid, user?.email);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary">Sign in to view your orders</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-primary">My orders</h1>
      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-muted" />
      ) : orders.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusColor[o.status] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {o.items?.map((it) => (
                  <li key={it.id} className="flex justify-between text-muted-foreground">
                    <span>
                      {it.name} × {it.quantity}
                    </span>
                    <span>
                      {o.currency}
                      {(it.price * it.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  {o.currency}
                  {Number(o.total).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

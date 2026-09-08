import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

type ShopSearch = { category?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Gifts — br_Treasure_Trove" },
      {
        name: "description",
        content:
          "Browse handcrafted jewellery, resin art, hampers, bags and keepsakes. Filter by category and price.",
      },
      { property: "og:title", content: "Shop All Gifts — br_Treasure_Trove" },
      {
        property: "og:description",
        content: "Browse handcrafted jewellery, resin art, hampers and keepsakes.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");

  const list = useMemo(() => {
    let out = products.filter((p) =>
      category ? p.category === category : true,
    );
    if (q.trim()) {
      const t = q.toLowerCase();
      out = out.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          p.category?.toLowerCase().includes(t),
      );
    }
    const sorted = [...out];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return sorted;
  }, [products, category, q, sort]);

  const setCategory = (c?: string) => navigate({ search: c ? { category: c } : {} });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-primary">{category || "All gifts"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{list.length} products</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search gifts…"
            className="pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="new">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={!category ? "default" : "outline"}
          onClick={() => setCategory(undefined)}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

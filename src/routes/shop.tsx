import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ShopSearch = { category?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Handcrafted Gifts & Jewellery — br_Treasure_Trove" },
      {
        name: "description",
        content:
          "Browse resin art, earrings, hampers, bags, keychains and more. Filter by category and price, shipped worldwide.",
      },
      { property: "og:title", content: "Shop Handcrafted Gifts — br_Treasure_Trove" },
      {
        property: "og:description",
        content: "Browse resin art, jewellery, hampers and personalised keepsakes.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products, isLoading } = useProducts();
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState("new");

  const list = useMemo(() => {
    let out = [...(products ?? [])];
    if (category) out = out.filter((p) => p.category === category);
    if (term.trim()) {
      const t = term.toLowerCase();
      out = out.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          p.category?.toLowerCase().includes(t),
      );
    }
    if (sort === "low") out.sort((a, b) => a.price - b.price);
    else if (sort === "high") out.sort((a, b) => b.price - a.price);
    else out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return out;
  }, [products, category, term, sort]);

  const setCategory = (c?: string) =>
    navigate({ search: c ? { category: c } : {} });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-primary">
        {category ?? "All products"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {list.length} {list.length === 1 ? "item" : "items"} available
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search gifts, jewellery, resin art…"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest first</SelectItem>
            <SelectItem value="low">Price: low to high</SelectItem>
            <SelectItem value="high">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={cn(
            "rounded-full border border-border px-3.5 py-1.5 text-xs transition-colors",
            !category ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
          )}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-xs transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))
          : list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
      {!isLoading && list.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No products match your search yet.
        </p>
      )}
    </div>
  );
}

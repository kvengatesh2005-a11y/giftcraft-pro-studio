import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, SlidersHorizontal, X, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useProducts } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShopSearch = { category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    category: typeof s["category"] === "string" ? (s["category"] as string) : undefined,
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

function CategoryList({
  category,
  onSelectCategory,
  categoryCounts,
  categoriesList,
  totalCount,
  onCloseDrawer,
}: {
  category?: string | undefined;
  onSelectCategory: (c?: string) => void;
  categoryCounts: Record<string, number>;
  categoriesList: string[];
  totalCount: number;
  onCloseDrawer?: () => void;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          onSelectCategory(undefined);
          onCloseDrawer?.();
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer",
          !category
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <span>All Categories</span>
        <Badge
          variant={!category ? "secondary" : "outline"}
          className={cn("text-xs shrink-0 ml-2", !category && "bg-primary-foreground/20 text-primary-foreground border-none")}
        >
          {totalCount}
        </Badge>
      </button>

      <div className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-3">
        Categories
      </div>

      <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
        {categoriesList.map((c) => {
          const isActive = category && category.trim().toLowerCase() === c.trim().toLowerCase();
          const count = categoryCounts[c] || 0;

          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                onSelectCategory(c);
                onCloseDrawer?.();
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors text-left cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground font-medium shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="truncate">{c}</span>
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className={cn(
                  "text-xs shrink-0 ml-2",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground border-none"
                    : "text-muted-foreground"
                )}
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shop() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const allCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        const cat = p.category.trim();
        const exists = CATEGORIES.some((c) => c.toLowerCase() === cat.toLowerCase());
        if (!exists) set.add(cat);
      }
    });
    return Array.from(set);
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCategories.forEach((c) => {
      const target = c.trim().toLowerCase();
      counts[c] = products.filter((p) => {
        if (!p.category) return false;
        const pCat = p.category.trim().toLowerCase();
        if (pCat === target) return true;
        if ((target === "chains" || target === "chain") && (pCat === "chains" || pCat === "chain")) return true;
        return false;
      }).length;
    });
    return counts;
  }, [products, allCategories]);

  const list = useMemo(() => {
    let out = products.filter((p) => {
      if (!category) return true;
      if (!p.category) return false;
      const target = category.trim().toLowerCase();
      const pCat = p.category.trim().toLowerCase();
      if (pCat === target) return true;
      if ((target === "chains" || target === "chain") && (pCat === "chains" || pCat === "chain")) return true;
      return false;
    });
    if (q.trim()) {
      const t = q.toLowerCase();
      out = out.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          p.category?.toLowerCase().includes(t)
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="border-b pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-primary font-bold">
          {category || "All Gifts"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing {list.length} {list.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="mt-6 lg:grid lg:grid-cols-[250px_1fr] lg:gap-8 items-start">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden lg:block sticky top-24 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filter by Category
            </h2>
            {category && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-primary px-2"
                onClick={() => setCategory(undefined)}
              >
                Reset
              </Button>
            )}
          </div>
          <CategoryList
            category={category}
            onSelectCategory={setCategory}
            categoryCounts={categoryCounts}
            categoriesList={allCategories}
            totalCount={products.length}
          />
        </aside>

        {/* Content Column */}
        <div className="space-y-6">
          {/* Controls Bar: Search, Mobile Drawer Trigger, Sorting */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search gifts..."
                className="pl-9 pr-8"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2 shrink-0 relative">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  {category && (
                    <span className="h-2 w-2 rounded-full bg-primary absolute top-1.5 right-1.5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6 overflow-y-auto">
                <SheetHeader className="text-left border-b pb-4 mb-4">
                  <SheetTitle className="flex items-center justify-between text-xl font-bold">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-primary" />
                      Filter Gifts
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-6">
                  <CategoryList
                    category={category}
                    onSelectCategory={setCategory}
                    categoryCounts={categoryCounts}
                    categoriesList={allCategories}
                    totalCount={products.length}
                    onCloseDrawer={() => setIsFilterOpen(false)}
                  />

                  {category && (
                    <Button
                      variant="outline"
                      className="w-full text-xs gap-2"
                      onClick={() => {
                        setCategory(undefined);
                        setIsFilterOpen(false);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Clear Category Filter
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Selector */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 cursor-pointer"
            >
              <option value="new">Newest</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>

          {/* Active Filter Badges */}
          {(category || q) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
              {category && (
                <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                  Category: {category}
                  <button
                    type="button"
                    onClick={() => setCategory(undefined)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {q && (
                <Badge variant="secondary" className="gap-1 pr-1.5 text-xs">
                  Search: "{q}"
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
                onClick={() => {
                  setCategory(undefined);
                  setQ("");
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 sm:h-80 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No products match your filters.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setCategory(undefined);
                  setQ("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


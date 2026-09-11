import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  Users,
  Plus,
  Trash2,
  Edit,
  Shield,
  Search,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye,
  DollarSign,
  Lock,
  FileText,
  Printer,
  Upload,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { downloadInvoicePDF, openPrintableInvoice } from "@/lib/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useProducts,
  useAllOrders,
  useCoupons,
  useAllPosters,
  useUsers,
  useDeliverySettings,
  addProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  updateOrderPaymentStatus,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  addPoster,
  updatePoster,
  deletePoster,
  updateUserRole,
  updateDeliverySettings,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import { CATEGORIES, COUNTRIES, CONVERSION_RATES, type Product, type Order, type Coupon, type Poster } from "@/lib/types";
import { ADMIN_EMAIL, getStorageClient } from "@/lib/firebase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — br_Treasure_Trove" },
      { name: "description", content: "Manage products, orders, coupons, posters and users." },
    ],
  }),
  component: Admin,
});

type TabType = "products" | "orders" | "coupons" | "delivery" | "posters" | "users";

export function Admin() {
  const { user, isAdmin } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // If user is not admin, show restricted view
  if (!user || (!isAdmin && user.email !== ADMIN_EMAIL)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-3xl text-primary">Admin Access Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You must be logged in as an administrator ({ADMIN_EMAIL}) to access this page.
        </p>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in as Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-4xl text-primary">Admin Control Center</h1>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-foreground">
              Administrator
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Logged in as {user.email}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: "products", label: "Products", icon: Package },
          { id: "orders", label: "Orders", icon: ShoppingBag },
          { id: "coupons", label: "Coupons", icon: Tag },
          { id: "delivery", label: "Delivery Settings", icon: Truck },
          { id: "posters", label: "Posters", icon: ImageIcon },
          { id: "users", label: "Users", icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "coupons" && <CouponsTab />}
        {activeTab === "delivery" && <DeliveryTab />}
        {activeTab === "posters" && <PostersTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

/* ==========================================================================
   PRODUCTS MANAGEMENT TAB
   ========================================================================== */
function compressImage(file: File, maxDimension = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImage(file: File): Promise<string> {
  // Compress client-side first so an instant fallback is immediately ready
  const compressedBase64 = await compressImage(file).catch(() => "");

  // Race network upload against a strict 2.5-second timeout so UI never hangs
  const uploadTask = (async () => {
    // 1. Try Firebase Storage with rapid check
    try {
      const storage = getStorageClient();
      if (storage) {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `products/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        if (downloadUrl) return downloadUrl;
      }
    } catch {
      // ignore
    }

    // 2. Try ImgBB upload with 2s fetch signal timeout
    try {
      const formData = new FormData();
      formData.append("image", file);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch("https://api.imgbb.com/1/upload?key=3c9b7405be5332ad9f1b402a55faaa22", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.url) return json.data.url;
      }
    } catch {
      // ignore
    }

    return compressedBase64;
  })();

  const timeoutTask = new Promise<string>((resolve) => {
    setTimeout(() => resolve(compressedBase64), 2500);
  });

  const result = await Promise.race([uploadTask, timeoutTask]);
  return result || compressedBase64;
}

function ProductsTab() {
  const { data: products = [], refetch, isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [productImages, setProductImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const allCategories = useMemo(() => {
    const set = new Set<string>(CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  const defaultCat = CATEGORIES[0] ?? "Combo Packs";

  const [form, setForm] = useState<{
    name: string;
    category: string;
    price: string;
    originalPrice: string;
    description: string;
    stock: string;
    icon: string;
  }>({
    name: "",
    category: defaultCat,
    price: "",
    originalPrice: "",
    description: "",
    stock: "10",
    icon: "🎁",
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategory("");
    setProductImages([]);
    setUrlInput("");
    setForm({
      name: "",
      category: defaultCat,
      price: "",
      originalPrice: "",
      description: "",
      stock: "10",
      icon: "🎁",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const existingCat = p.category?.trim();
    const existingImages = Array.isArray(p.images) ? p.images.filter(Boolean).slice(0, 6) : [];
    setProductImages(existingImages);
    setUrlInput("");

    if (existingCat && !allCategories.includes(existingCat)) {
      setIsCustomCategory(true);
      setCustomCategory(existingCat);
      setForm({
        name: p.name || "",
        category: defaultCat,
        price: p.price ? String(p.price) : "",
        originalPrice: p.originalPrice ? String(p.originalPrice) : "",
        description: p.description || "",
        stock: p.stock !== undefined ? String(p.stock) : "10",
        icon: p.icon || "🎁",
      });
    } else {
      setIsCustomCategory(false);
      setCustomCategory("");
      setForm({
        name: p.name || "",
        category: existingCat || defaultCat,
        price: p.price ? String(p.price) : "",
        originalPrice: p.originalPrice ? String(p.originalPrice) : "",
        description: p.description || "",
        stock: p.stock !== undefined ? String(p.stock) : "10",
        icon: p.icon || "🎁",
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (productImages.length >= 6) {
      toast.error("Maximum 6 images allowed per product.");
      e.target.value = "";
      return;
    }

    const fileList = Array.from(files);
    const remainingSlots = 6 - productImages.length;
    if (fileList.length > remainingSlots) {
      toast.warning(`Maximum 6 images allowed. Only the first ${remainingSlots} image(s) will be uploaded.`);
    }

    const selectedFiles = fileList.slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const newUrls = await Promise.all(selectedFiles.map((file) => uploadProductImage(file)));
      setProductImages((prev) => [...prev, ...newUrls].slice(0, 6));
      toast.success(`${newUrls.length} image(s) uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image(s).");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (productImages.length >= 6) {
      toast.error("Maximum 6 images allowed per product.");
      return;
    }
    setProductImages((prev) => [...prev, trimmed].slice(0, 6));
    setUrlInput("");
    toast.success("Image URL added!");
  };

  const handleRemoveImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= productImages.length) return;
    setProductImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      if (moved !== undefined) {
        updated.splice(toIndex, 0, moved);
      }
      return updated;
    });
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    handleMoveImage(index, 0);
    toast.success("Set as main product cover image!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required.");
      return;
    }

    const catInput = isCustomCategory ? customCategory : form.category;
    const selectedCategory = catInput.trim() || defaultCat;
    const finalImages = productImages.filter((img) => img.trim() !== "").slice(0, 6);

    const payload: Omit<Product, "id"> = {
      name: form.name.trim(),
      category: selectedCategory,
      price: Number(form.price),
      description: form.description.trim(),
      stock: Number(form.stock) || 0,
      images: finalImages,
      icon: form.icon || "🎁",
    };

    if (form.originalPrice) {
      payload.originalPrice = Number(form.originalPrice);
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success("Product updated!");
      } else {
        await addProduct(payload);
        toast.success("Product added!");
      }
      setIsModalOpen(false);
      refetch();
    } catch {
      toast.error("Error saving product.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted.");
        refetch();
      } catch {
        toast.error("Error deleting product.");
      }
    }
  };

  const filtered = products.filter((p) => {
    const target = categoryFilter?.trim().toLowerCase();
    const pCat = p.category?.trim().toLowerCase() || "";
    const matchesCategory =
      categoryFilter === "all" ||
      pCat === target ||
      ((target === "chains" || target === "chain") && (pCat === "chains" || pCat === "chain"));
    const matchesSearch =
      !search.trim() ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No products found. Click "Add New Product" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-2xl">
                            {p.icon || "🎁"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.category}</td>
                  <td className="p-4 font-semibold text-primary">
                    ₹{p.price}
                    {p.originalPrice && (
                      <span className="ml-1.5 text-xs text-muted-foreground line-through">
                        ₹{p.originalPrice}
                      </span>
                    )}
                  </td>
                  <td className="p-4">{p.stock ?? 10} pcs</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" onClick={() => openEditModal(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lift">
            <h2 className="font-display text-2xl text-primary">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="prod-name">Product Name *</Label>
                <Input
                  id="prod-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prod-cat">Category *</Label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      {isCustomCategory ? "← Existing" : "+ Custom"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <Input
                      id="prod-cat-custom"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Type extra category..."
                      className="mt-1"
                    />
                  ) : (
                    <select
                      id="prod-cat"
                      value={form.category}
                      onChange={(e) => {
                        if (e.target.value === "__NEW_CUSTOM__") {
                          setIsCustomCategory(true);
                        } else {
                          setForm((f) => ({ ...f, category: e.target.value }));
                        }
                      }}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__NEW_CUSTOM__">+ Add Custom Category...</option>
                    </select>
                  )}
                </div>
                <div>
                  <Label htmlFor="prod-stock">Stock Quantity</Label>
                  <Input
                    id="prod-stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prod-price">Selling Price (₹) *</Label>
                  <Input
                    id="prod-price"
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-orig-price">Original MRP (₹)</Label>
                  <Input
                    id="prod-orig-price"
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Product Images Management (1 to 6 Images Allowed) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-semibold text-foreground">
                    Product Images ({productImages.length}/6)
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">1 to 6 images allowed</span>
                </div>

                <div className="space-y-3">
                  {productImages.length < 6 ? (
                    <div className="space-y-2">
                      <label
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                          isUploading
                            ? "border-primary/50 bg-primary/5 pointer-events-none"
                            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploading || productImages.length >= 6}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center py-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="mt-2 text-xs font-medium text-muted-foreground">
                              Uploading & generating link...
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-1">
                            <Upload className="h-6 w-6 text-primary mb-1" />
                            <p className="text-xs font-semibold text-foreground">
                              Click to upload image file(s) <span className="font-normal text-muted-foreground">(1 or more images allowed)</span>
                            </p>
                            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                              JPG, PNG, WEBP — upload 1 main image or up to 6 images max
                            </p>
                          </div>
                        )}
                      </label>

                      <div className="flex gap-2">
                        <Input
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddUrl();
                            }
                          }}
                          placeholder="Or paste image URL (https://...)"
                          disabled={productImages.length >= 6 || isUploading}
                          className="text-xs h-9"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddUrl()}
                          disabled={!urlInput.trim() || productImages.length >= 6 || isUploading}
                          className="h-9 shrink-0 text-xs"
                        >
                          Add URL
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
                      Maximum limit reached (6/6 images). Remove an image below to add a new one.
                    </div>
                  )}

                  {/* Image Thumbnails Grid */}
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {productImages.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary shadow-xs transition-all hover:border-primary/50"
                        >
                          <img
                            src={imgUrl}
                            alt={`Product image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {/* Cover / Main Image Indicator */}
                          {index === 0 ? (
                            <span className="absolute top-1 left-1 flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-950 shadow-xs">
                              <Star className="h-2.5 w-2.5 fill-slate-950" /> Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(index)}
                              title="Set as cover image"
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-medium text-white hover:bg-amber-500 hover:text-black"
                            >
                              Set Cover
                            </button>
                          )}

                          {/* Hover Controls */}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 opacity-90 transition-opacity group-hover:opacity-100">
                            <div className="flex gap-0.5">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(index, index - 1)}
                                  title="Move left"
                                  className="rounded p-1 text-white hover:bg-white/20"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {index < productImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(index, index + 1)}
                                  title="Move right"
                                  className="rounded p-1 text-white hover:bg-white/20"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              title="Remove image"
                              className="rounded p-1 text-rose-400 hover:bg-rose-500 hover:text-white"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="prod-desc">Description</Label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Product</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   ORDERS MANAGEMENT TAB
   ========================================================================== */
function OrdersTab() {
  const { data: orders = [], refetch, isLoading } = useAllOrders(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status changed to "${newStatus}"`);
      refetch();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      await updateOrderPaymentStatus(orderId, newPaymentStatus);
      toast.success(`Payment status updated to "${newPaymentStatus}"`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
      }
      refetch();
    } catch {
      toast.error("Failed to update payment status.");
    }
  };

  const filtered = orders.filter((o) => (statusFilter === "all" ? true : o.status === statusFilter));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? "default" : "outline"}
              onClick={() => setStatusFilter(st)}
              className="capitalize"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No orders found matching status filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-4">
                    <p className="font-semibold text-foreground">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                  </td>
                  <td className="p-4">{o.items?.length || 0} items</td>
                  <td className="p-4 font-bold text-primary">
                    {o.currency || "₹"}
                    {o.total?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {o.paymentMethod}
                    </span>
                    {o.transactionId && (
                      <p className="mt-1 text-[0.7rem] font-mono text-muted-foreground">
                        ID: {o.transactionId}
                      </p>
                    )}
                    <div className="mt-1.5">
                      <select
                        value={o.paymentStatus || "PENDING_VERIFICATION"}
                        onChange={(e) => handlePaymentStatusChange(o.id, e.target.value)}
                        className={`h-7 rounded border px-1.5 text-[0.7rem] font-bold uppercase transition-colors focus:ring-1 ${
                          o.paymentStatus === "VERIFIED" || o.paymentStatus === "PAID" || o.paymentStatus === "SUCCESS"
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : o.paymentStatus === "FAILED"
                            ? "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="VERIFIED">Verified / Paid</option>
                        <option value="FAILED">Payment Failed</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium capitalize focus:ring-1 focus:ring-ring"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedOrder(o)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                        onClick={() => downloadInvoicePDF(o)}
                        title="Download Invoice PDF"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> Invoice PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lift">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-xl text-primary">
                Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="font-semibold text-foreground">Customer & Delivery Details</p>
                <p>{selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
                <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
                <p className="text-muted-foreground">
                  {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode},{" "}
                  {selectedOrder.country}
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2 text-foreground">Items Ordered</p>
                <ul className="divide-y divide-border rounded-lg border border-border p-3">
                  {selectedOrder.items?.map((it, idx) => (
                    <li key={idx} className="flex justify-between py-2 text-xs">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span className="font-semibold">
                        {selectedOrder.currency}
                        {(it.price * it.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1 border-t border-border pt-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    {selectedOrder.currency}
                    {selectedOrder.subtotal?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span>
                    {selectedOrder.currency}
                    {selectedOrder.deliveryCharge?.toLocaleString()}
                  </span>
                </div>
                {selectedOrder.couponCode && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Coupon ({selectedOrder.couponCode})</span>
                    <span>-{selectedOrder.currency}{selectedOrder.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-border">
                  <span>Total</span>
                  <span>
                    {selectedOrder.currency}
                    {selectedOrder.total?.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Payment Information</p>
                    <span
                      className={`inline-block text-[0.7rem] uppercase font-bold px-2 py-0.5 rounded border ${
                        selectedOrder.paymentStatus === "VERIFIED" ||
                        selectedOrder.paymentStatus === "PAID" ||
                        selectedOrder.paymentStatus === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                          : selectedOrder.paymentStatus === "FAILED"
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40"
                          : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40"
                      }`}
                    >
                      Payment {selectedOrder.paymentStatus || "PENDING_VERIFICATION"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">
                    <span className="font-medium text-muted-foreground">Method: </span>
                    {selectedOrder.paymentMethod || "UPI Payment"}
                  </p>
                  {(selectedOrder.transactionId || selectedOrder.razorpayPaymentId) && (
                    <p className="text-xs font-mono text-primary">
                      <span className="font-medium text-muted-foreground font-sans">Txn / UTR / Razorpay ID: </span>
                      {selectedOrder.razorpayPaymentId || selectedOrder.transactionId}
                    </p>
                  )}

                  {/* Payment Verification Buttons Bar */}
                  <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Verify Action:</span>
                    <Button
                      size="sm"
                      variant={
                        selectedOrder.paymentStatus === "VERIFIED" || selectedOrder.paymentStatus === "PAID"
                          ? "default"
                          : "outline"
                      }
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                      onClick={() => handlePaymentStatusChange(selectedOrder.id, "VERIFIED")}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Verify & Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                      onClick={() => handlePaymentStatusChange(selectedOrder.id, "PENDING_VERIFICATION")}
                    >
                      Mark Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-rose-500/50 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                      onClick={() => handlePaymentStatusChange(selectedOrder.id, "FAILED")}
                    >
                      Mark Failed
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4 mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPrintableInvoice(selectedOrder)}
                  >
                    <Printer className="mr-1.5 h-4 w-4" /> Print Invoice
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                    onClick={() => downloadInvoicePDF(selectedOrder)}
                  >
                    <FileText className="mr-1.5 h-4 w-4 text-rose-500" /> Download PDF Invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   COUPONS MANAGEMENT TAB
   ========================================================================== */
function CouponsTab() {
  const { data: coupons = [], refetch, isLoading } = useCoupons();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountAmount: "",
    minOrderAmount: "1500",
    firstCustomerOnly: true,
    description: "",
    isActive: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountAmount) return;

    try {
      const couponPayload: Omit<Coupon, "id"> = {
        code: form.code.trim().toUpperCase(),
        discountAmount: Number(form.discountAmount),
        firstCustomerOnly: form.firstCustomerOnly,
        isActive: form.isActive,
      };
      if (form.minOrderAmount) {
        couponPayload.minOrderAmount = Number(form.minOrderAmount);
      }
      if (form.description.trim()) {
        couponPayload.description = form.description.trim();
      }

      await addCoupon(couponPayload);
      toast.success("Coupon created!");
      setIsModalOpen(false);
      setForm({
        code: "",
        discountAmount: "",
        minOrderAmount: "1500",
        firstCustomerOnly: true,
        description: "",
        isActive: true,
      });
      refetch();
    } catch {
      toast.error("Error creating coupon.");
    }
  };

  const toggleStatus = async (c: Coupon) => {
    try {
      await updateCoupon(c.id, { isActive: !c.isActive });
      toast.success(`Coupon ${c.code} status updated.`);
      refetch();
    } catch {
      toast.error("Failed to update coupon.");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Delete coupon ${code}?`)) {
      try {
        await deleteCoupon(id);
        toast.success("Coupon deleted.");
        refetch();
      } catch {
        toast.error("Error deleting coupon.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl text-primary">Coupon Codes</h2>
          <p className="text-sm text-muted-foreground">Manage discounts and targeted coupon rules.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No coupon codes found. Click "Create Coupon" above to add one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Conditions</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary text-base block">{c.code}</span>
                    {c.description && <span className="text-xs text-muted-foreground">{c.description}</span>}
                  </td>
                  <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{c.discountAmount} OFF
                  </td>
                  <td className="p-4 text-xs space-y-1">
                    {c.firstCustomerOnly && (
                      <span className="inline-block rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium px-2.5 py-0.5 border border-blue-500/30 mr-1.5">
                        First Customer Only
                      </span>
                    )}
                    {c.minOrderAmount ? (
                      <span className="inline-block rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium px-2.5 py-0.5 border border-amber-500/30">
                        Min Order: ₹{c.minOrderAmount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No minimum order</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id, c.code)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift">
            <h2 className="font-display text-xl text-primary">Create Coupon Code</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="coupon-code">Coupon Code *</Label>
                <Input
                  id="coupon-code"
                  required
                  placeholder="e.g. FIRST1500"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="mt-1 uppercase font-mono"
                />
              </div>

              <div>
                <Label htmlFor="coupon-discount">Discount Amount (₹) *</Label>
                <Input
                  id="coupon-discount"
                  type="number"
                  required
                  placeholder="e.g. 200"
                  value={form.discountAmount}
                  onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="coupon-min-order">Minimum Order Amount (₹)</Label>
                <Input
                  id="coupon-min-order"
                  type="number"
                  placeholder="e.g. 1500"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Coupon applies only if order total is above this amount.
                </p>
              </div>

              <div>
                <Label htmlFor="coupon-desc">Description (Optional)</Label>
                <Input
                  id="coupon-desc"
                  placeholder="e.g. Valid on first order above ₹1500"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="coupon-first-customer"
                    checked={form.firstCustomerOnly}
                    onChange={(e) => setForm((f) => ({ ...f, firstCustomerOnly: e.target.checked }))}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  <Label htmlFor="coupon-first-customer" className="cursor-pointer font-medium">
                    First-Time Customer Only
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="coupon-active"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  <Label htmlFor="coupon-active" className="cursor-pointer">
                    Active immediately
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Coupon</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   DELIVERY SETTINGS TAB
   ========================================================================== */
function DeliveryTab() {
  const { data: deliverySettings, refetch, isLoading } = useDeliverySettings();
  const [form, setForm] = useState({
    deliveryCharge: "60",
    deliveryDays: "3-5 business days",
    razorpayKeyId: "",
    upiId: "9176501954@ibl",
  });
  const [countryRates, setCountryRates] = useState<Record<string, { deliveryCharge: string; deliveryDays: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (deliverySettings) {
      setForm({
        deliveryCharge: String(deliverySettings.deliveryCharge ?? 60),
        deliveryDays: deliverySettings.deliveryDays || "3-5 business days",
        razorpayKeyId: deliverySettings.razorpayKeyId || "",
        upiId: deliverySettings.upiId || "9176501954@ibl",
      });

      const initialRates: Record<string, { deliveryCharge: string; deliveryDays: string }> = {};
      COUNTRIES.forEach((c) => {
        const existing = deliverySettings.countryRates?.[c.code];
        initialRates[c.code] = {
          deliveryCharge: String(existing?.deliveryCharge ?? c.deliveryCharge),
          deliveryDays: existing?.deliveryDays || c.deliveryDays,
        };
      });
      setCountryRates(initialRates);
    }
  }, [deliverySettings]);

  const handleCountryRateChange = (code: string, field: "deliveryCharge" | "deliveryDays", value: string) => {
    setCountryRates((prev) => {
      const current = prev[code] || { deliveryCharge: "", deliveryDays: "" };
      return {
        ...prev,
        [code]: {
          deliveryCharge: field === "deliveryCharge" ? value : current.deliveryCharge,
          deliveryDays: field === "deliveryDays" ? value : current.deliveryDays,
        },
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formattedCountryRates: Record<string, { deliveryCharge: number; deliveryDays: string }> = {};
      Object.entries(countryRates).forEach(([code, rate]) => {
        formattedCountryRates[code] = {
          deliveryCharge: Number(rate.deliveryCharge) || 0,
          deliveryDays: rate.deliveryDays.trim(),
        };
      });

      await updateDeliverySettings({
        deliveryCharge: Number(form.deliveryCharge),
        deliveryDays: form.deliveryDays.trim(),
        countryRates: formattedCountryRates,
        razorpayKeyId: form.razorpayKeyId.trim(),
        upiId: form.upiId.trim(),
      });
      toast.success("Delivery & payment settings updated successfully!");
      refetch();
    } catch {
      toast.error("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-2xl text-primary flex items-center gap-2">
          <Truck className="h-6 w-6 text-gold-foreground" /> Worldwide Delivery Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure flat shipping charges and estimated delivery timeframes for India and international destinations.
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Base Domestic Settings */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display text-lg text-primary flex items-center gap-2">
              🇮🇳 Base Domestic Shipping (India)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="delivery-charge" className="font-medium text-foreground">
                  Default Shipping Charge (₹ Base) *
                </Label>
                <Input
                  id="delivery-charge"
                  type="number"
                  required
                  min="0"
                  value={form.deliveryCharge}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryCharge: e.target.value }))}
                  placeholder="e.g. 60 (0 for Free)"
                  className="mt-1.5 text-base font-semibold"
                />
                <p className="mt-1 text-xs text-muted-foreground">Standard rate in INR</p>
              </div>

              <div>
                <Label htmlFor="delivery-days" className="font-medium text-foreground">
                  Estimated Delivery Time Frame *
                </Label>
                <Input
                  id="delivery-days"
                  required
                  value={form.deliveryDays}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryDays: e.target.value }))}
                  placeholder="e.g. 3-5 business days"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">Displayed on cart & checkout</p>
              </div>
            </div>
          </div>

          {/* Payment Gateway & UPI Settings */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display text-lg text-primary flex items-center gap-2">
              💳 Payment Gateway & UPI Settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="razorpay-key" className="font-medium text-foreground">
                  Razorpay Key ID (Online Payment)
                </Label>
                <Input
                  id="razorpay-key"
                  value={form.razorpayKeyId}
                  onChange={(e) => setForm((f) => ({ ...f, razorpayKeyId: e.target.value }))}
                  placeholder="e.g. rzp_live_xxxxxxxx / rzp_test_xxxxxxxx"
                  className="mt-1.5 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Your Razorpay Key ID for instant online payments.
                </p>
              </div>

              <div>
                <Label htmlFor="upi-id" className="font-medium text-foreground">
                  Store Direct UPI VPA / ID
                </Label>
                <Input
                  id="upi-id"
                  value={form.upiId}
                  onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                  placeholder="e.g. 9176501954@ibl"
                  className="mt-1.5 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Official UPI VPA for direct manual transfer with UTR.
                </p>
              </div>
            </div>
          </div>

          {/* Worldwide Rates Per Country */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div>
              <h3 className="font-display text-lg text-primary flex items-center gap-2">
                🌐 Worldwide Per-Country Delivery Rates
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set delivery charges (in ₹ INR base) and estimated delivery days for each supported destination country.
              </p>
            </div>

            <div className="grid gap-4">
              {COUNTRIES.map((c) => {
                const rate = countryRates[c.code] || {
                  deliveryCharge: String(c.deliveryCharge),
                  deliveryDays: c.deliveryDays,
                };
                const conversionFactor = CONVERSION_RATES[c.code] ?? 1;
                const chargeNum = Number(rate.deliveryCharge) || 0;
                const convertedPrice = Math.round(chargeNum * conversionFactor);

                return (
                  <div
                    key={c.code}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:w-56 shrink-0">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{c.name}</p>
                        <span className="text-xs text-muted-foreground">
                          INR (₹)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                      <div>
                        <Label className="text-xs text-muted-foreground">Charge (₹ Rs)</Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            min="0"
                            value={rate.deliveryCharge}
                            onChange={(e) => handleCountryRateChange(c.code, "deliveryCharge", e.target.value)}
                            className="text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Estimated Delivery Days</Label>
                        <Input
                          type="text"
                          value={rate.deliveryDays}
                          onChange={(e) => handleCountryRateChange(c.code, "deliveryDays", e.target.value)}
                          placeholder="e.g. 5-7 business days"
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg" className="gap-2 font-semibold">
              <Truck className="h-4 w-4" />
              {isSaving ? "Saving Settings…" : "Save Worldwide Delivery Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ==========================================================================
   POSTERS MANAGEMENT TAB
   ========================================================================== */
function PostersTab() {
  const { data: posters = [], refetch, isLoading } = useAllPosters();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", link: "/shop", order: "1", isActive: true });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadProductImage(file);
      if (url) {
        setForm((f) => ({ ...f, imageUrl: url }));
        toast.success("Poster image uploaded successfully!");
      } else {
        toast.error("Failed to upload poster image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload poster image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) return;

    try {
      await addPoster({
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        link: form.link.trim(),
        order: Number(form.order) || 1,
        isActive: form.isActive,
      });
      toast.success("Poster banner added!");
      setIsModalOpen(false);
      setForm({ title: "", imageUrl: "", link: "/shop", order: "1", isActive: true });
      refetch();
    } catch {
      toast.error("Error adding poster banner.");
    }
  };

  const toggleStatus = async (p: Poster) => {
    try {
      await updatePoster(p.id, { isActive: !p.isActive });
      toast.success(`Poster status updated.`);
      refetch();
    } catch {
      toast.error("Error updating poster status.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete poster "${title}"?`)) {
      try {
        await deletePoster(id);
        toast.success("Poster deleted.");
        refetch();
      } catch {
        toast.error("Error deleting poster.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl text-primary">Banner Posters</h2>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Poster Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : posters.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No posters added yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posters.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
              <img src={p.imageUrl} alt={p.title} className="h-44 w-full object-cover" />
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">Link: {p.link}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(p)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id, p.title)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift">
            <h2 className="font-display text-xl text-primary">Add Banner Poster</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="poster-title">Poster Title *</Label>
                <Input
                  id="poster-title"
                  required
                  placeholder="e.g. Festival Special Hampers"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="poster-img">Poster Banner Image *</Label>
                  <span className="text-xs text-muted-foreground font-medium">Only 1 image allowed</span>
                </div>

                {form.imageUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
                    <img
                      src={form.imageUrl}
                      alt="Poster Preview"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-105"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                      isUploading
                        ? "border-primary/50 bg-primary/5 pointer-events-none"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="mt-2 text-xs font-medium text-muted-foreground">
                          Uploading poster image...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-1">
                        <Upload className="h-6 w-6 text-primary mb-1" />
                        <p className="text-xs font-semibold text-foreground">
                          Click to upload image file <span className="font-normal text-muted-foreground">(Only 1 image allowed)</span>
                        </p>
                        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                          JPG, PNG, WEBP — upload 1 banner image file
                        </p>
                      </div>
                    )}
                  </label>
                )}

                <div className="mt-2 flex gap-2">
                  <Input
                    id="poster-img"
                    placeholder="Or paste image URL (https://...)"
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    disabled={isUploading}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="poster-link">Target Route/Link</Label>
                <Input
                  id="poster-link"
                  placeholder="/shop?category=Resin Art"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !form.imageUrl.trim()}>
                  {isUploading ? "Uploading..." : "Save Poster"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   USERS MANAGEMENT TAB
   ========================================================================== */
function UsersTab() {
  const { data: users = [], refetch, isLoading } = useUsers(true);

  const toggleRole = async (uid: string, currentRole?: string) => {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    try {
      await updateUserRole(uid, newRole);
      toast.success(`Role updated to ${newRole}`);
      refetch();
    } catch {
      toast.error("Failed to update user role.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-primary">Registered Users</h2>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No registered user profiles found in database.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-muted/30">
                  <td className="p-4 font-semibold text-foreground">{u.name || "User"}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        u.role === "admin" || u.email === ADMIN_EMAIL
                          ? "bg-gold/20 text-gold-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {u.email === ADMIN_EMAIL ? "Super Admin" : u.role || "customer"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.email !== ADMIN_EMAIL && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRole(u.uid, u.role)}
                      >
                        Make {u.role === "admin" ? "Customer" : "Admin"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

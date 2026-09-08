import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/firebase";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — br_Treasure_Trove" },
      { name: "description", content: "Manage your delivery details and contact information." },
      { property: "og:title", content: "My Profile — br_Treasure_Trove" },
      { property: "og:description", content: "Manage your delivery and contact details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, setUser } = useApp();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user)
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        pincode: user.pincode || "",
      });
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary">Sign in to view your profile</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = { ...user, ...form };
      await setDoc(doc(getDb(), "users", user.uid), updated, { merge: true });
      setUser(updated);
      window.localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-primary">My profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
      <form
        onSubmit={save}
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        {[
          { k: "name", label: "Full name" },
          { k: "phone", label: "Phone" },
          { k: "address", label: "Address" },
          { k: "city", label: "City" },
          { k: "pincode", label: "Pincode" },
        ].map((f) => (
          <div key={f.k}>
            <Label htmlFor={f.k}>{f.label}</Label>
            <Input
              id={f.k}
              value={form[f.k as keyof typeof form]}
              onChange={(e) => setForm((s) => ({ ...s, [f.k]: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        ))}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

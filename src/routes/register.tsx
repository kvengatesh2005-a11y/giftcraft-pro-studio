import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthClient, getDb } from "@/lib/firebase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — br_Treasure_Trove" },
      {
        name: "description",
        content: "Create a br_Treasure_Trove account to save gifts and track your orders.",
      },
      { property: "og:title", content: "Create Account — br_Treasure_Trove" },
      { property: "og:description", content: "Save gifts and track your orders." },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        getAuthClient(),
        form.email.trim(),
        form.password,
      );
      await updateProfile(cred.user, { displayName: form.name });
      await setDoc(doc(getDb(), "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: form.email.trim(),
        phone: form.phone,
        role: "customer",
        createdAt: new Date().toISOString(),
      });
      toast.success("Account created!");
      navigate({ to: "/" });
    } catch (err) {
      const msg = (err as { code?: string }).code === "auth/email-already-in-use"
        ? "That email is already registered."
        : "Couldn't create your account. Password must be 6+ characters.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-4xl text-primary">Create account</h1>
      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        {[
          { k: "name", label: "Full name", type: "text" },
          { k: "email", label: "Email", type: "email" },
          { k: "phone", label: "Phone", type: "tel" },
          { k: "password", label: "Password", type: "password" },
        ].map((f) => (
          <div key={f.k}>
            <Label htmlFor={f.k}>{f.label}</Label>
            <Input
              id={f.k}
              type={f.type}
              required={f.k !== "phone"}
              value={form[f.k as keyof typeof form]}
              onChange={(e) => set(f.k, e.target.value)}
              className="mt-1.5"
            />
          </div>
        ))}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

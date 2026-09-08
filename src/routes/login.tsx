import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthClient } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — br_Treasure_Trove" },
      { name: "description", content: "Sign in to track orders and manage your gift wishlist." },
      { property: "og:title", content: "Sign In — br_Treasure_Trove" },
      { property: "og:description", content: "Sign in to track orders and your wishlist." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getAuthClient(), email.trim(), password);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-4xl text-primary">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to see your orders and saved gifts.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

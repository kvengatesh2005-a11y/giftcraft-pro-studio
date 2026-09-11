import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthClient, getDb } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — br_Treasure_Trove" },
      { name: "description", content: "Sign in using your Email or Phone number to track orders and wishlist." },
      { property: "og:title", content: "Sign In — br_Treasure_Trove" },
      { property: "og:description", content: "Sign in to track orders and your wishlist." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = identifier.trim();
    if (!input) {
      toast.error("Please enter your email address or phone number.");
      return;
    }

    setBusy(true);
    try {
      let targetEmail = input;

      if (!input.includes("@")) {
        const cleanPhone = input.replace(/\D/g, "");
        try {
          // Lookup by exact phone string or clean phone digits in Firestore
          const q = query(collection(getDb(), "users"), where("phone", "==", input));
          let snap = await getDocs(q);
          if (snap.empty && cleanPhone) {
            const qClean = query(collection(getDb(), "users"), where("phone", "==", cleanPhone));
            snap = await getDocs(qClean);
          }

          const firstDocData = snap.docs[0]?.data();
          if (!snap.empty && firstDocData && typeof firstDocData["email"] === "string") {
            targetEmail = firstDocData["email"];
          } else if (cleanPhone) {
            targetEmail = `${cleanPhone}@phone.user`;
          } else {
            targetEmail = `${input}@phone.user`;
          }
        } catch {
          targetEmail = cleanPhone ? `${cleanPhone}@phone.user` : `${input}@phone.user`;
        }
      }

      await signInWithEmailAndPassword(getAuthClient(), targetEmail, password);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch {
      toast.error("Invalid email/phone number or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-4xl text-primary">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with your Email or Phone number to view your orders and saved gifts.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div>
          <Label htmlFor="identifier">Email address or Phone number</Label>
          <Input
            id="identifier"
            type="text"
            required
            placeholder="e.g. user@gmail.com or Phone Number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
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


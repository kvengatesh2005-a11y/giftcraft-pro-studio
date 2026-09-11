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
        content: "Create a br_Treasure_Trove account using Email or Phone to save gifts and track orders.",
      },
      { property: "og:title", content: "Create Account — br_Treasure_Trove" },
      { property: "og:description", content: "Save gifts and track your orders." },
    ],
  }),
  component: Register,
});
function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", identifier: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = form.identifier.trim();
    if (!input) {
      toast.error("Please enter your Email address or Phone number.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    try {
      let emailTrim = "";
      let phoneTrim = "";
      let authEmail = "";

      if (input.includes("@")) {
        emailTrim = input;
        authEmail = input;
      } else {
        phoneTrim = input;
        const cleanPhone = input.replace(/\D/g, "");
        authEmail = cleanPhone ? `${cleanPhone}@phone.user` : `${input}@phone.user`;
      }

      const cred = await createUserWithEmailAndPassword(
        getAuthClient(),
        authEmail,
        form.password,
      );

      await updateProfile(cred.user, { displayName: form.name });

      await setDoc(doc(getDb(), "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: authEmail,
        displayEmail: emailTrim || "",
        phone: phoneTrim,
        role: "customer",
        createdAt: new Date().toISOString(),
      });

      toast.success("Account created successfully!");
      navigate({ to: "/" });
    } catch (err) {
      const code = (err as { code?: string }).code;
      let msg = "Couldn't create your account. Password must be 6+ characters.";
      if (code === "auth/email-already-in-use") {
        msg = "An account with this email address or phone number already exists. Please sign in.";
      } else if (code === "auth/invalid-email") {
        msg = "Please enter a valid email address or phone number.";
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-4xl text-primary">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your details below to create an account. You can sign up with your Email or Phone number.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
      >
        <div>
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            type="text"
            required
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="identifier">Email address or Phone number *</Label>
          <Input
            id="identifier"
            type="text"
            required
            placeholder="e.g. user@gmail.com or 9876543210"
            value={form.identifier}
            onChange={(e) => set("identifier", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
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



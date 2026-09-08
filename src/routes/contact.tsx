import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — br_Treasure_Trove" },
      {
        name: "description",
        content:
          "Questions about an order or a custom gift? Reach the br_Treasure_Trove team by email or phone.",
      },
      { property: "og:title", content: "Contact Us — br_Treasure_Trove" },
      { property: "og:description", content: "Reach the br_Treasure_Trove team for custom gifts." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-primary">Get in touch</h1>
      <p className="mt-3 text-muted-foreground">
        Custom orders, bulk gifting or order help — we usually reply within a day.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {[
            { icon: Mail, label: "Email", value: "admin@brinnovate.in" },
            { icon: Phone, label: "Phone / UPI", value: "9176501954" },
            { icon: MapPin, label: "Based in", value: "Chennai, India" },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-3">
              <c.icon className="mt-0.5 h-5 w-5 text-gold-foreground" />
              <div>
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="text-sm text-muted-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Thanks! We'll get back to you shortly.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" rows={5} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full">
            Send message
          </Button>
          {sent && (
            <p className="text-center text-xs text-muted-foreground">
              Message noted — we'll email you back.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

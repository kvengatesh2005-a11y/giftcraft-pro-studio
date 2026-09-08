import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, Instagram, MessageCircle, Truck, ExternalLink } from "lucide-react";
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
          "Questions about an order or a custom gift? Reach the br_Treasure_Trove team by email, WhatsApp or phone.",
      },
      { property: "og:title", content: "Contact Us — br_Treasure_Trove" },
      { property: "og:description", content: "Reach the br_Treasure_Trove team for custom gifts." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const whatsappUrl = "https://wa.me/919176501954?text=Hello%20br_Treasure_Trove!%20I%20have%20an%20enquiry.";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);

    const mailSubject = encodeURIComponent(subject || `Enquiry from ${name}`);
    const mailBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    const mailtoUrl = `mailto:brcreatives4@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    toast.success("Opening your email client to send message to brcreatives4@gmail.com");
    window.location.href = mailtoUrl;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary">Get in touch</h1>
          <p className="mt-2 text-muted-foreground">
            Custom orders, bulk gifting or order help — we usually reply within a few hours.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 text-xs font-bold text-gold-foreground shadow-sm">
          <Truck className="h-4 w-4 text-gold-foreground" />
          <span>✈️ Worldwide Shipping • Express Delivery</span>
        </div>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          {/* Quick WhatsApp Action Box */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Quick WhatsApp Chat</h3>
                <p className="text-xs text-muted-foreground">+91 91765 01954</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Click below to send us a direct message on WhatsApp for instant assistance.
            </p>
            <Button
              asChild
              className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Message us on WhatsApp
              </a>
            </Button>
          </div>

          {/* Contact Information Cards */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <a
                  href="mailto:brcreatives4@gmail.com"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  brcreatives4@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
              <div>
                <p className="text-sm font-semibold">Phone / PhonePe / GPay</p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  +91 91765 01954
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
              <div>
                <p className="text-sm font-semibold">Studio Address</p>
                <p className="text-xs leading-relaxed text-muted-foreground mt-0.5">
                  No.20, 2nd Street, Vengadesapuram, Acharapakkam, Chengalpattu - 603301, Tamil Nadu, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <Instagram className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
              <div className="w-full">
                <p className="text-sm font-semibold">Follow us on Instagram</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a
                    href="https://www.instagram.com/br_innovate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline bg-muted/60 px-3 py-1.5 rounded-lg border border-border"
                  >
                    <span>@br_innovate</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                  <a
                    href="https://www.instagram.com/brcreatives5?igsh=Znl6eGk1aDJramsw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline bg-muted/60 px-3 py-1.5 rounded-lg border border-border"
                  >
                    <span>@brcreatives5</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-soft"
          onSubmit={handleSubmit}
        >
          <h2 className="font-display text-2xl text-primary">Send a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1.5"
              placeholder="Custom gift enquiry / Order update"
            />
          </div>
          <div>
            <Label htmlFor="msg">Message</Label>
            <Textarea
              id="msg"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-1.5"
              placeholder="Tell us about what you need..."
            />
          </div>
          <Button type="submit" className="w-full gap-2">
            <Mail className="h-4 w-4" /> Send via Email (brcreatives4@gmail.com)
          </Button>
          {sent && (
            <p className="text-center text-xs text-muted-foreground">
              Opening your default email app with your message pre-filled...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}


import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone, MapPin, MessageCircle, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 bg-emerald-gradient text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="br_Treasure_Trove"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-gold/70"
            />
            <span className="font-display text-xl">br_Treasure_Trove</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/75">
            Handpicked gifts, handcrafted keepsakes and thoughtful little treasures — delivered
            worldwide.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold border border-gold/40">
            <Truck className="h-3.5 w-3.5" /> ✈️ Worldwide Shipping • Express Delivery
          </div>
        </div>

        <div>
          <h4 className="text-sm tracking-[0.2em] text-gold uppercase">Explore</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-primary-foreground/80">
            <Link to="/shop" className="hover:text-gold">
              Shop all gifts
            </Link>
            <Link to="/about" className="hover:text-gold">
              Our story
            </Link>
            <Link to="/contact" className="hover:text-gold">
              Contact us
            </Link>
            <Link to="/orders" className="hover:text-gold">
              Track my order
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm tracking-[0.2em] text-gold uppercase">Account</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-primary-foreground/80">
            <Link to="/login" className="hover:text-gold">
              Sign in / Register
            </Link>
            <Link to="/profile" className="hover:text-gold">
              My profile
            </Link>
            <Link to="/wishlist" className="hover:text-gold">
              Wishlist
            </Link>
            <Link to="/cart" className="hover:text-gold">
              Cart
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm tracking-[0.2em] text-gold uppercase">Reach us</h4>
          <div className="mt-4 flex flex-col gap-3 text-sm text-primary-foreground/80">
            <a
              href="mailto:brcreatives4@gmail.com"
              className="flex items-center gap-2 hover:text-gold transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0 text-gold" />
              <span className="truncate">brcreatives4@gmail.com</span>
            </a>
            <a
              href="https://wa.me/919176501954?text=Hello%20br_Treasure_Trove!%20I%20have%20an%20enquiry."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gold transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-gold" />
              <span>+91 91765 01954 (WhatsApp)</span>
            </a>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gold mt-0.5" />
              <span className="text-xs leading-relaxed">
                No.20, 2nd Street, Vengadesapuram, Acharapakkam, Chengalpattu-603301
              </span>
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <a
                href="https://www.instagram.com/br_innovate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <Instagram className="h-4 w-4 shrink-0 text-gold" />
                <span>@br_innovate</span>
              </a>
              <a
                href="https://www.instagram.com/brcreatives5?igsh=Znl6eGk1aDJramsw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <Instagram className="h-4 w-4 shrink-0 text-gold" />
                <span>@brcreatives5</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © 2024 br_Treasure_Trove . All rights reserved.
      </div>
    </footer>
  );
}


import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.jpeg.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 bg-emerald-gradient text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logo.url}
              alt="br_Treasure_Trove"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-gold/70"
            />
            <span className="font-display text-xl">br_Treasure_Trove</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/75">
            Handpicked gifts, handcrafted keepsakes and thoughtful little treasures — shipped
            worldwide from India.
          </p>
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
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" /> support@brinnovate.in
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> +91 91765 01954
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" /> Chennai, Tamil Nadu, India
            </span>
            <span className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-gold" /> @br_treasure_trove
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} br_Treasure_Trove by br_innovate. All rights reserved.
      </div>
    </footer>
  );
}

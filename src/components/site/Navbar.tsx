import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { Heart, LogOut, Menu, ShoppingBag, User, X, ChevronDown, Shield } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg.asset.json";
import { getAuthClient } from "@/lib/firebase";
import { useApp } from "@/lib/store";
import { COUNTRIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { cartCount, wishlist, user, isAdmin, country, setCountry } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(getAuthClient());
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="br_Treasure_Trove logo"
            className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/60"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl text-primary">br_Treasure_Trove</span>
            <span className="text-[0.62rem] tracking-[0.28em] text-muted-foreground uppercase">
              Gifts & Crafts
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1 text-sm font-medium text-gold-foreground"
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 px-2">
                <span className="text-base">{country.flag}</span>
                <span className="hidden text-xs sm:inline">{country.currencyCode}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
              <DropdownMenuLabel>Ship to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COUNTRIES.map((c) => (
                <DropdownMenuItem key={c.code} onClick={() => setCountry(c)}>
                  <span className="mr-2">{c.flag}</span> {c.name}
                  <span className="ml-auto text-xs text-muted-foreground">{c.currencyCode}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/wishlist" aria-label="Wishlist" className="relative">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && <Badge count={wishlist.length} />}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" aria-label="Cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <Badge count={cartCount} />}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {isAdmin ? "Administrator" : "Customer"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">My Orders</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
              >
                Admin Panel
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold text-gold-foreground">
      {count}
    </span>
  );
}

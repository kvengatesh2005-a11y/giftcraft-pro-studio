import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { Heart, LogOut, Menu, ShoppingBag, User, X, ChevronDown, Shield } from "lucide-react";
import { toast } from "sonner";
import { getAuthClient } from "@/lib/firebase";
import { useApp } from "@/lib/store";
import { COUNTRIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-6">

        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <img
            src="/favicon.png"
            alt="br_Treasure_Trove logo"
            className="h-8 w-8 sm:h-11 sm:w-11 rounded-full object-cover ring-2 ring-gold/60 shrink-0"
          />
          <span className="flex flex-col leading-none min-w-0">
            <span className="font-display text-sm sm:text-xl text-primary font-bold tracking-tight truncate">br_Treasure_Trove</span>
            <span className="text-[0.5rem] sm:text-[0.62rem] tracking-[0.18em] sm:tracking-[0.22em] text-muted-foreground uppercase truncate hidden xs:block">
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

        <div className="ml-auto flex items-center gap-0.5 sm:gap-2 shrink-0">
          {/* Ship to Country Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold text-foreground hover:bg-muted/70 transition-colors focus:outline-none">
                <span className="font-bold">{country.code}</span>
                <span className="font-bold hidden xs:inline">{country.currencyCode}</span>
                <ChevronDown className="h-3.5 w-3.5 text-foreground/80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3 shadow-xl border border-border rounded-xl bg-card">
              <div className="px-3 py-2 text-lg font-bold text-foreground">
                Ship to
              </div>
              <DropdownMenuSeparator className="my-1.5" />
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {COUNTRIES.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setCountry(c)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-foreground",
                      country.code === c.code ? "bg-muted font-semibold" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-xs font-bold uppercase">{c.code}</span>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">{c.currencyCode}</span>
                  </DropdownMenuItem>
                ))}
              </div>
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
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden space-y-3">
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
          <div className="border-t border-border pt-3">
            <span className="text-xs font-bold text-muted-foreground uppercase px-2">Ship to</span>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium border border-border",
                    country.code === c.code ? "bg-primary text-primary-foreground font-semibold" : "bg-card hover:bg-muted text-foreground"
                  )}
                >
                  <span>{c.code} {c.name}</span>
                  <span className="opacity-75">{c.currencyCode}</span>
                </button>
              ))}
            </div>
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

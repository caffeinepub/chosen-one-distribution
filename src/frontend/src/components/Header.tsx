import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface HeaderProps {
  currentPage: Page;
  navigate: (p: Page) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}

export default function Header({
  currentPage,
  navigate,
  isAuthenticated,
  isAdmin,
  search,
  onSearchChange,
}: HeaderProps) {
  const { login, clear, isLoggingIn } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks: {
    label: string;
    page: Page;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    alwaysShow?: boolean;
  }[] = [
    { label: "Catalog", page: "home" },
    { label: "My Library", page: "library", requireAuth: true },
    { label: "Upload", page: "upload", requireAuth: true },
    { label: "Admin", page: "admin", requireAdmin: true },
  ];

  // Mobile-only links (always visible in hamburger)
  const mobileExtraLinks: { label: string; page: Page }[] = [
    { label: "About Us", page: "about" },
    { label: "Terms & Policies", page: "terms" },
  ];

  const visibleLinks = navLinks.filter((l) => {
    if (l.requireAdmin && !isAdmin) return false;
    if (l.requireAuth && !isAuthenticated) return false;
    return true;
  });

  const handleSearchChange = (v: string) => {
    onSearchChange(v);
    if (currentPage !== "home") {
      navigate("home");
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-gold/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2 group flex-shrink-0"
          onClick={() => navigate("home")}
          data-ocid="nav.link"
        >
          <span className="crown-glow text-2xl">👑</span>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-sm tracking-widest text-gold uppercase">
              Chosen One
            </span>
            <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Productions
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map((link) => (
            <button
              key={link.page}
              type="button"
              onClick={() => navigate(link.page)}
              data-ocid={`nav.${link.page}.link`}
              className={`px-4 py-2 text-sm font-medium tracking-wide rounded-md transition-all duration-200 ${
                currentPage === link.page
                  ? "text-gold border border-gold/30 bg-gold/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center relative w-[210px] flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            data-ocid="header.search_input"
            className="pl-8 h-8 text-sm bg-black/40 border-gold/20 focus:border-gold/60 text-foreground placeholder:text-muted-foreground rounded-md"
          />
        </div>

        {/* Auth Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              data-ocid="auth.logout_button"
              className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 hidden md:flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="auth.login.primary_button"
              className="gold-glow-btn px-4 py-2 rounded-md hidden md:flex"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gold/10 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {/* Mobile Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search tracks..."
                  value={search}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setMobileOpen(false);
                  }}
                  data-ocid="header.mobile.search_input"
                  className="pl-9 bg-black/40 border-gold/20 focus:border-gold/60 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {visibleLinks.map((link) => (
                <button
                  key={link.page}
                  type="button"
                  onClick={() => {
                    navigate(link.page);
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-3 text-sm font-medium text-left rounded-md transition-all ${
                    currentPage === link.page
                      ? "text-gold bg-gold/10"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {/* Divider */}
              <div className="my-1 border-t border-gold/10" />

              {/* Always-visible links: About Us, Terms */}
              {mobileExtraLinks.map((link) => (
                <button
                  key={link.page}
                  type="button"
                  onClick={() => {
                    navigate(link.page);
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-3 text-sm font-medium text-left rounded-md transition-all ${
                    currentPage === link.page
                      ? "text-gold bg-gold/10"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </button>
              ))}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setMobileOpen(false);
                  }}
                  className="px-4 py-3 text-sm text-destructive text-left"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    login();
                    setMobileOpen(false);
                  }}
                  className="px-4 py-3 text-sm text-gold text-left font-medium"
                >
                  Sign In
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

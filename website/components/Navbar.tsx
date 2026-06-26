"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Zap, Menu, X, ArrowRight } from "lucide-react";

const links = [
  { label: "Features",     href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Models",       href: "#models" },
  { label: "Pricing",      href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
          background: scrolled ? "rgba(8,14,26,0.92)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.02em" }} className="text-gradient">
              SLM Forge
            </span>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#94a3b8",
                  textDecoration: "none",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#f1f5f9"; (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#94a3b8"; (e.target as HTMLElement).style.background = "transparent"; }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hidden md:flex">
            <Link href="/login" style={{ padding: "8px 16px", fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8", textDecoration: "none", borderRadius: 8, transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f1f5f9")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
            >
              Sign In
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.875rem", borderRadius: 10 }}>
              Get Started Free
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 8 }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
              background: "rgba(8,14,26,0.97)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              padding: "16px 24px 20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "#94a3b8",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: "12px 14px", fontSize: "0.9375rem", color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}>
                Sign In
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ marginTop: 4, borderRadius: 10, justifyContent: "center" }}>
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

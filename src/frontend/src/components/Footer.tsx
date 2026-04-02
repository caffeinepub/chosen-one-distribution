import type { Page } from "../App";

interface FooterProps {
  navigate?: (p: Page) => void;
}

export default function Footer({ navigate }: FooterProps) {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  const go = (p: Page) => {
    if (navigate) navigate(p);
    else window.location.hash = p;
  };

  return (
    <footer className="border-t border-gold/10 bg-background/80 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="crown-glow">👑</span>
            <div>
              <span className="font-display font-bold text-gold text-sm tracking-widest uppercase">
                Chosen One
              </span>
              <span className="text-muted-foreground text-sm ml-1">
                Productions
              </span>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => go("about")}
              data-ocid="footer.about.link"
              className="text-xs text-gold/70 hover:text-gold transition-colors duration-200 tracking-wide"
            >
              About
            </button>
            <span className="text-gold/20 text-xs">|</span>
            <button
              type="button"
              onClick={() => go("terms")}
              data-ocid="footer.terms.link"
              className="text-xs text-gold/70 hover:text-gold transition-colors duration-200 tracking-wide"
            >
              Terms &amp; Policies
            </button>
          </div>

          <p className="text-muted-foreground text-xs text-center">
            © {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

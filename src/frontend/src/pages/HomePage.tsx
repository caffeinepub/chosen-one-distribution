import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Music, Search, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { Page } from "../App";
import PaymentVerifier from "../components/PaymentVerifier";
import TrackCard from "../components/TrackCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllTracks, useGetUserPurchases } from "../hooks/useQueries";

interface HomePageProps {
  isAuthenticated: boolean;
  navigate?: (p: Page) => void;
}

export default function HomePage({ isAuthenticated, navigate }: HomePageProps) {
  const { login } = useInternetIdentity();
  const { data: tracks = [], isLoading } = useGetAllTracks();
  const { data: purchases = [] } = useGetUserPurchases();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const catalogRef = useRef<HTMLElement>(null);

  const purchasedIds = new Set(purchases.map((p) => p.trackId));

  const genres = [
    "All",
    ...Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean))),
  ];

  const filtered = tracks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q);
    const matchesGenre = genre === "All" || t.genre === genre;
    return matchesSearch && matchesGenre;
  });

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const params = new URLSearchParams(window.location.search);
  const hasPaymentReturn = !!params.get("session_id");

  return (
    <>
      {hasPaymentReturn && <PaymentVerifier />}

      {/* Hero Section */}
      <section
        className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/assets/generated/hero-chosen-one.dim_1600x700.jpg"
            alt=""
            className="w-full h-full object-cover opacity-25"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="crown-glow text-6xl md:text-8xl mb-4"
          >
            👑
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-tight mb-2"
          >
            <span className="gold-gradient-text">Chosen One</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg md:text-xl tracking-[0.4em] text-muted-foreground uppercase font-light mb-6"
          >
            Distribution
          </motion.p>

          <div className="section-divider my-6 max-w-xs mx-auto" />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-muted-foreground text-lg md:text-xl italic font-display mb-10"
          >
            Where Legends Are Distributed
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={scrollToCatalog}
              data-ocid="hero.primary_button"
              className="gold-glow-btn rounded-md px-8 py-3 text-sm h-auto"
            >
              <Music className="w-4 h-4 mr-2" />
              Explore Music
            </Button>
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={() => navigate?.("upload")}
                data-ocid="hero.upload.secondary_button"
                className="border-gold/40 text-gold hover:bg-gold/10 px-8 py-3 h-auto rounded-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your Track
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={login}
                data-ocid="hero.secondary_button"
                className="border-gold/40 text-gold hover:bg-gold/10 px-8 py-3 h-auto rounded-md"
              >
                Sign In to Purchase
              </Button>
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={scrollToCatalog}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/50 hover:text-gold transition-colors animate-pulse-gold"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </section>

      {/* Upload CTA Banner for authenticated users */}
      {isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 pt-8"
        >
          <div className="glass-card rounded-2xl border border-gold/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  Share Your Music
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload your tracks and reach listeners worldwide.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate?.("upload")}
              data-ocid="home.upload.primary_button"
              className="gold-glow-btn px-6 py-2 h-auto text-sm rounded-md flex-shrink-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your Track
            </Button>
          </div>
        </motion.section>
      )}

      {/* Catalog Section */}
      <section
        ref={catalogRef}
        className="container mx-auto px-4 py-16"
        aria-label="Track Catalog"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
            <h2 className="font-display font-bold text-3xl md:text-4xl text-center">
              <span className="gold-gradient-text">The Catalog</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
          </div>
          <p className="text-center text-muted-foreground mb-10">
            Premium tracks from the chosen artists
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks, artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="catalog.search_input"
                className="pl-9 bg-muted border-gold/20 focus:border-gold/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  data-ocid={`catalog.${g.toLowerCase()}.tab`}
                  className={`px-3 py-2 text-xs rounded-md font-medium tracking-wide transition-all ${
                    genre === g
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Track Grid */}
          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              data-ocid="catalog.loading_state"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                <div key={i} className="rounded-xl overflow-hidden glass-card">
                  <Skeleton className="aspect-square bg-muted/50" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 bg-muted/50 rounded w-3/4" />
                    <Skeleton className="h-3 bg-muted/50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20" data-ocid="catalog.empty_state">
              <Music className="w-16 h-16 text-gold/20 mx-auto mb-4" />
              <h3 className="font-display text-xl text-muted-foreground mb-2">
                No Tracks Found
              </h3>
              <p className="text-muted-foreground text-sm">
                {search || genre !== "All"
                  ? "Try adjusting your search or filters."
                  : "No tracks have been uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPurchased={purchasedIds.has(track.id)}
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={login}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </>
  );
}

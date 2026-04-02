import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Download, Loader2, LogIn, Music } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { Track } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllTracks, useGetUserPurchases } from "../hooks/useQueries";
import { downloadFile } from "../utils/downloadFile";

interface LibraryPageProps {
  isAuthenticated: boolean;
  navigate: (p: Page) => void;
}

export default function LibraryPage({
  isAuthenticated,
  navigate,
}: LibraryPageProps) {
  const { login } = useInternetIdentity();
  const { data: purchases = [], isLoading: purchasesLoading } =
    useGetUserPurchases();
  const { data: allTracks = [], isLoading: tracksLoading } = useGetAllTracks();
  const { getBlobUrl } = useBlobStorage();
  const { actor } = useActor();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isLoading = purchasesLoading || tracksLoading;

  const purchasedTracks: (Track & {
    purchaseDate: bigint;
    amountPaid: bigint;
  })[] = purchases
    .map((p) => {
      const track = allTracks.find((t) => t.id === p.trackId);
      if (!track) return null;
      return {
        ...track,
        purchaseDate: p.purchaseDate,
        amountPaid: p.amountPaidInCents,
      };
    })
    .filter(Boolean) as (Track & {
    purchaseDate: bigint;
    amountPaid: bigint;
  })[];

  const handleDownload = async (track: Track) => {
    if (!actor) return;
    setDownloadingId(track.id);
    try {
      const blobId = await actor.getTrackAudioFileBlobId(track.id);
      if (!blobId) {
        toast.error("Audio file not available.");
        return;
      }
      const url = getBlobUrl(blobId);
      const audioFormat = await (actor as any).getTrackAudioFormat(track.id);
      const fmt = (audioFormat ?? "")
        .toLowerCase()
        .replace("audio/", "")
        .replace("mpeg", "mp3");
      const ext = fmt || "mp3";
      await downloadFile(url, `${track.title} - ${track.artist}.${ext}`);
      toast.success("Download started!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="crown-glow text-5xl mb-4">👑</div>
          <h1 className="font-display text-3xl font-bold gold-gradient-text mb-3">
            My Library
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your purchased tracks
          </p>
          <Button
            onClick={login}
            data-ocid="library.login.primary_button"
            className="gold-glow-btn rounded-md px-8 py-3 h-auto"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
          <h1 className="font-display font-bold text-3xl md:text-4xl">
            <span className="gold-gradient-text">My Library</span>
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
        </div>
        <p className="text-center text-muted-foreground mb-10">
          Your purchased collection
        </p>

        {isLoading ? (
          <div className="space-y-4" data-ocid="library.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-4 flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg bg-muted/50 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 bg-muted/50 rounded w-1/2" />
                  <Skeleton className="h-3 bg-muted/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : purchasedTracks.length === 0 ? (
          <div className="text-center py-20" data-ocid="library.empty_state">
            <Music className="w-16 h-16 text-gold/20 mx-auto mb-4" />
            <h2 className="font-display text-xl text-muted-foreground mb-2">
              No Purchases Yet
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Explore the catalog and buy your first track
            </p>
            <Button
              onClick={() => navigate("home")}
              data-ocid="library.catalog.primary_button"
              className="gold-glow-btn rounded-md px-6 py-2 h-auto"
            >
              Browse Catalog
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchasedTracks.map((track, i) => {
              const coverUrl = track.coverArtBlobId
                ? getBlobUrl(track.coverArtBlobId)
                : null;
              const purchaseDate = new Date(
                Number(track.purchaseDate) / 1_000_000,
              );
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-4"
                  data-ocid={`library.item.${i + 1}`}
                >
                  {/* Cover */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-gold/10 to-black flex-shrink-0">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-gold/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {track.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {track.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] tracking-wider uppercase">
                        {track.genre}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        Purchased {purchaseDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Download or Coming Soon */}
                  {track.isPreSell &&
                  track.releaseDate &&
                  BigInt(Date.now()) * BigInt(1_000_000) < track.releaseDate ? (
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gold/10 border border-gold/30 text-gold text-xs font-semibold"
                        data-ocid={`library.coming_soon.${i + 1}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Coming Soon
                      </div>
                      <span className="text-[10px] text-gold/60">
                        {new Date(
                          Number(track.releaseDate) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleDownload(track)}
                      disabled={downloadingId === track.id}
                      data-ocid={`library.download_button.${i + 1}`}
                      className="gold-glow-btn rounded-md h-9 px-4 text-xs flex-shrink-0"
                    >
                      {downloadingId === track.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      {downloadingId === track.id ? "" : "Download"}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

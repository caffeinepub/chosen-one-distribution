import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  Lock,
  Music,
  Pause,
  Play,
  Share2,
  ShoppingCart,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Track } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useCreateCheckoutSession } from "../hooks/useQueries";
import { downloadFile } from "../utils/downloadFile";

const PREVIEW_LIMIT_SECONDS = 30;

let currentlyPlayingAudio: HTMLAudioElement | null = null;

interface TrackCardProps {
  track: Track;
  isPurchased: boolean;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  index: number;
}

export default function TrackCard({
  track,
  isPurchased,
  isAuthenticated,
  onLoginRequired,
  index,
}: TrackCardProps) {
  const { getBlobUrl } = useBlobStorage();
  const { actor } = useActor();
  const createCheckout = useCreateCheckoutSession();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedPlay = useRef(false);

  const priceDisplay = `$${(Number(track.priceInCents) / 100).toFixed(2)}`;
  const coverUrl = track.coverArtBlobId
    ? getBlobUrl(track.coverArtBlobId)
    : null;
  const audioPreviewUrl = track.audioFileBlobId
    ? getBlobUrl(track.audioFileBlobId)
    : null;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioPreviewUrl) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      setIsPlaying(false);
      setProgress(0);
      currentlyPlayingAudio = null;
      return;
    }

    // Stop any other playing audio
    if (currentlyPlayingAudio && currentlyPlayingAudio !== audioRef.current) {
      currentlyPlayingAudio.pause();
      currentlyPlayingAudio.currentTime = 0;
    }

    // Lazily create audio element
    if (!audioRef.current) {
      const audio = new Audio(audioPreviewUrl);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          const cappedDuration = Math.min(
            audio.duration,
            PREVIEW_LIMIT_SECONDS,
          );
          setProgress((audio.currentTime / cappedDuration) * 100);
        }
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
        currentlyPlayingAudio = null;
      });
    }

    currentlyPlayingAudio = audioRef.current;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      toast.error("Could not play audio preview.");
      setIsPlaying(false);
    });
    setIsPlaying(true);

    // Record preview play (fire-and-forget, once per session per track)
    if (!hasRecordedPlay.current && actor) {
      hasRecordedPlay.current = true;
      try {
        (actor as unknown as { recordPreviewPlay(id: string): Promise<void> })
          .recordPreviewPlay(track.id)
          .catch(() => {
            /* silently ignore */
          });
      } catch {
        // silently ignore
      }
    }

    // Stop after PREVIEW_LIMIT_SECONDS
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      previewTimerRef.current = null;
      currentlyPlayingAudio = null;
      setIsPlaying(false);
      setProgress(0);
      toast.info(
        `Preview limited to ${PREVIEW_LIMIT_SECONDS} seconds — purchase to hear the full track.`,
        { duration: 4000 },
      );
    }, PREVIEW_LIMIT_SECONDS * 1000);
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    try {
      const successUrl = `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}&track_id=${track.id}`;
      const cancelUrl = `${window.location.origin}/`;
      const url = await createCheckout.mutateAsync({
        items: [
          {
            productName: track.title,
            currency: "usd",
            quantity: BigInt(1),
            priceInCents: track.priceInCents,
            productDescription: track.description,
          },
        ],
        successUrl,
        cancelUrl,
      });
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!actor) return;
    setIsDownloading(true);
    try {
      const blobId = await actor.getTrackAudioFileBlobId(track.id);
      if (!blobId) {
        toast.error("Audio file not available.");
        return;
      }
      const url = getBlobUrl(blobId);
      const audioFormat = await actor.getTrackAudioFormat(track.id);
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
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?track=${track.id}`;
    const shareData = {
      title: `${track.title} — ${track.artist}`,
      text: `Check out "${track.title}" by ${track.artist} on Chosen One 👑 Distribution`,
      url: shareUrl,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled — not an error
        if ((err as DOMException).name !== "AbortError") {
          toast.error("Share failed.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Could not copy link.");
      }
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col group"
      data-ocid={`catalog.item.${index + 1}`}
    >
      {/* Cover Art */}
      <div className="relative aspect-square bg-gradient-to-br from-gold/10 to-black overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${track.title} cover`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-16 h-16 text-gold/30" />
          </div>
        )}
        {/* Genre badge */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <Badge className="bg-black/70 text-gold border border-gold/30 text-[10px] tracking-widest uppercase">
            {track.genre}
          </Badge>
          {track.isPreSell &&
            track.releaseDate &&
            BigInt(Date.now()) * BigInt(1_000_000) < track.releaseDate && (
              <Badge className="bg-gold text-black border-gold text-[10px] tracking-widest uppercase font-bold animate-pulse">
                PRE-ORDER
              </Badge>
            )}
        </div>
        {/* Lock overlay if not purchased */}
        {!isPurchased && (
          <div className="absolute bottom-2 left-2">
            <Lock className="w-4 h-4 text-gold/60" />
          </div>
        )}
        {/* Play/Pause overlay */}
        {audioPreviewUrl && (
          <button
            type="button"
            onClick={handlePlayPause}
            data-ocid={`catalog.toggle.${index + 1}`}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100"
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            <span className="w-14 h-14 rounded-full flex items-center justify-center bg-black/70 border-2 border-gold/80 shadow-lg shadow-gold/20 hover:scale-105 transition-transform">
              {isPlaying ? (
                <Pause className="w-6 h-6 text-gold fill-gold" />
              ) : (
                <Play className="w-6 h-6 text-gold fill-gold ml-0.5" />
              )}
            </span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div className="h-[3px] bg-black/40 w-full">
          <div
            className="h-full bg-gold transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground text-base leading-tight line-clamp-2">
            {track.title}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            {track.artist}
          </p>
          {track.isPreSell &&
            track.releaseDate &&
            BigInt(Date.now()) * BigInt(1_000_000) < track.releaseDate && (
              <p className="text-[11px] text-gold/70 mt-0.5 font-medium">
                Releases{" "}
                {new Date(
                  Number(track.releaseDate) / 1_000_000,
                ).toLocaleDateString()}
              </p>
            )}
        </div>

        {track.description && (
          <p className="text-muted-foreground text-xs line-clamp-2 flex-1">
            {track.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gold/10 gap-2">
          <span className="text-gold font-bold font-display text-lg shrink-0">
            {priceDisplay}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleShare}
              data-ocid={`catalog.secondary_button.${index + 1}`}
              aria-label="Share track"
              className="h-8 w-8 p-0 rounded-md text-gold/60 hover:text-gold hover:bg-gold/10 border border-gold/20 hover:border-gold/50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            {isPurchased ? (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                data-ocid={`catalog.download_button.${index + 1}`}
                className="gold-glow-btn rounded-md h-8 px-3 text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                {isDownloading ? "..." : "Download"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleBuy}
                disabled={createCheckout.isPending}
                data-ocid={`catalog.buy_button.${index + 1}`}
                className="gold-glow-btn rounded-md h-8 px-3 text-xs"
              >
                {createCheckout.isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <ShoppingCart className="w-3 h-3 mr-1" />
                )}
                {createCheckout.isPending
                  ? "..."
                  : track.isPreSell &&
                      track.releaseDate &&
                      BigInt(Date.now()) * BigInt(1_000_000) < track.releaseDate
                    ? "Pre-Order"
                    : "Buy & Download"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

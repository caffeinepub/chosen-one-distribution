import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ImageIcon,
  Loader2,
  Music,
  Music2,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Track } from "../backend.d";
import WaveformPicker from "../components/WaveformPicker";
import { useActor } from "../hooks/useActor";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddTrack,
  useDeleteTrack,
  useGetMyUploadedTracks,
} from "../hooks/useQueries";

interface TrackFormData {
  title: string;
  artist: string;
  genre: string;
  description: string;
  priceInDollars: string;
  coverArtFile: File | null;
  audioFile: File | null;
  audioFileFormat: string;
  previewStartSeconds: number;
  audioDuration: number;
}

const EMPTY_FORM: TrackFormData = {
  title: "",
  artist: "",
  genre: "",
  description: "",
  priceInDollars: "",
  coverArtFile: null,
  audioFile: null,
  audioFileFormat: "",
  previewStartSeconds: 0,
  audioDuration: 0,
};

function TrackThumbnail({ blobId }: { blobId: string }) {
  const { getBlobUrl } = useBlobStorage();
  const url = getBlobUrl(blobId);
  if (!url)
    return <div className="w-12 h-12 rounded-lg bg-gold/10 flex-shrink-0" />;
  return (
    <img
      src={url}
      alt="cover"
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gold/20"
    />
  );
}

export default function UploadPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [form, setForm] = useState<TrackFormData>(EMPTY_FORM);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const { actor, isFetching: actorLoading } = useActor();
  const { uploadBlob } = useBlobStorage();
  const addTrack = useAddTrack();
  const deleteTrack = useDeleteTrack();
  const { data: myTracks = [], isLoading: loadingMyTracks } =
    useGetMyUploadedTracks();

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, coverArtFile: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({
      ...prev,
      audioFile: file,
      audioFileFormat: file ? file.type : "",
      previewStartSeconds: 0,
      audioDuration: 0,
    }));

    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new OfflineAudioContext(1, 1, 44100);
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        setForm((prev) => ({ ...prev, audioDuration: decoded.duration }));
      } catch {
        // duration remains 0 if decode fails
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.artist || !form.priceInDollars) {
      toast.error("Title, artist, and price are required.");
      return;
    }
    const priceNum = Number.parseFloat(form.priceInDollars);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (!form.audioFile) {
      toast.error("Please select an audio file.");
      return;
    }
    if (!actor) {
      toast.error(
        "Connection not ready. Please refresh the page and try again.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Upload files to storage
      let coverArtBlobId = "";
      let audioFileBlobId = "";
      try {
        const uploads = await Promise.all([
          form.coverArtFile
            ? uploadBlob(form.coverArtFile)
            : Promise.resolve(null),
          uploadBlob(form.audioFile),
        ]);
        coverArtBlobId = uploads[0] ?? "";
        audioFileBlobId = uploads[1] ?? "";
      } catch (err) {
        console.error("File upload error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`File upload failed: ${msg}`);
        return;
      }

      // Step 2: Save track metadata
      const price = Math.round(priceNum * 100);
      const track: Track = {
        id: crypto.randomUUID(),
        title: form.title,
        artist: form.artist,
        genre: form.genre,
        description: form.description,
        priceInCents: BigInt(price),
        coverArtBlobId,
        audioFileBlobId,
        uploadDate: BigInt(Date.now()) * BigInt(1_000_000),
      };

      try {
        await addTrack.mutateAsync({
          track,
          audioFormat: form.audioFileFormat || null,
          previewStartSeconds:
            form.previewStartSeconds > 0
              ? BigInt(Math.round(form.previewStartSeconds))
              : null,
        });
      } catch (err) {
        console.error("Track save error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Failed to save track: ${msg}`);
        return;
      }

      toast.success("Track uploaded successfully!");
      setForm(EMPTY_FORM);
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div className="crown-glow text-5xl mb-4">👑</div>
          <h2 className="font-display text-2xl font-bold text-gold mb-2">
            Sign In to Upload
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Join Chosen One Distribution and share your music with the world.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="upload.signin.primary_button"
            className="gold-glow-btn px-8 py-3 h-auto rounded-md"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Music className="w-4 h-4 mr-2" />
            )}
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-5 h-5 text-gold" />
          <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">
            Upload Track
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold gold-gradient-text mb-2">
          Share Your Music
        </h1>
        <p className="text-muted-foreground">
          Upload your track to the Chosen One Distribution catalog.
        </p>
      </motion.div>

      {/* Upload Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 md:p-8 border border-gold/20 mb-12"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="up-title" className="text-foreground font-medium">
                Title *
              </Label>
              <Input
                id="up-title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Track title"
                data-ocid="upload.title.input"
                className="bg-muted/30 border-gold/20 focus:border-gold/60"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="up-artist"
                className="text-foreground font-medium"
              >
                Artist *
              </Label>
              <Input
                id="up-artist"
                value={form.artist}
                onChange={(e) =>
                  setForm((p) => ({ ...p, artist: e.target.value }))
                }
                placeholder="Artist name"
                data-ocid="upload.artist.input"
                className="bg-muted/30 border-gold/20 focus:border-gold/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="up-genre" className="text-foreground font-medium">
                Genre
              </Label>
              <Input
                id="up-genre"
                value={form.genre}
                onChange={(e) =>
                  setForm((p) => ({ ...p, genre: e.target.value }))
                }
                placeholder="e.g. Hip-Hop, R&B, Pop"
                data-ocid="upload.genre.input"
                className="bg-muted/30 border-gold/20 focus:border-gold/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="up-price" className="text-foreground font-medium">
                Price (USD) *
              </Label>
              <Input
                id="up-price"
                type="number"
                min="0"
                step="0.01"
                value={form.priceInDollars}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceInDollars: e.target.value }))
                }
                placeholder="9.99"
                data-ocid="upload.price.input"
                className="bg-muted/30 border-gold/20 focus:border-gold/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="up-desc" className="text-foreground font-medium">
              Description
            </Label>
            <Textarea
              id="up-desc"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Tell listeners about this track..."
              rows={3}
              data-ocid="upload.description.textarea"
              className="bg-muted/30 border-gold/20 focus:border-gold/60 resize-none"
            />
          </div>

          {/* Cover Art */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Cover Art</Label>
            <button
              type="button"
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-gold/30 bg-gold/5 cursor-pointer hover:border-gold/60 transition-colors text-left"
              onClick={() => coverInputRef.current?.click()}
              data-ocid="upload.cover.dropzone"
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-16 h-16 rounded-lg object-cover border border-gold/30 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-gold/40" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {form.coverArtFile
                    ? form.coverArtFile.name
                    : "Click to browse all files"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  JPG, PNG, WebP — browse from any location or cloud storage
                </p>
              </div>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              className="hidden"
              onChange={handleCoverChange}
              data-ocid="upload.cover.upload_button"
            />
          </div>

          {/* Audio File */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Audio File *</Label>
            <button
              type="button"
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-gold/30 bg-gold/5 cursor-pointer hover:border-gold/60 transition-colors text-left"
              onClick={() => audioInputRef.current?.click()}
              data-ocid="upload.audio.dropzone"
            >
              <div className="w-16 h-16 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Music2 className="w-6 h-6 text-gold/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {form.audioFile
                    ? form.audioFile.name
                    : "Click to browse all files"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  MP3, WAV, FLAC — browse from any location or cloud storage
                </p>
              </div>
            </button>
            <input
              ref={audioInputRef}
              type="file"
              className="hidden"
              onChange={handleAudioChange}
              data-ocid="upload.audio.upload_button"
            />
          </div>

          {/* Waveform Preview Picker */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">
              Set Preview Clip
            </Label>
            <p className="text-xs text-gold/60">
              Click or drag to choose which 30 seconds buyers hear
            </p>
            <WaveformPicker
              audioFile={form.audioFile}
              previewStartSeconds={form.previewStartSeconds}
              audioDuration={form.audioDuration}
              onPreviewStartChange={(seconds) =>
                setForm((p) => ({ ...p, previewStartSeconds: seconds }))
              }
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || actorLoading}
            data-ocid="upload.submit_button"
            className="gold-glow-btn w-full py-3 h-auto text-sm rounded-md"
          >
            {actorLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" /> Upload Track
              </>
            )}
          </Button>
        </form>
      </motion.div>

      {/* My Uploads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Music className="w-5 h-5 text-gold" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            My Uploads
          </h2>
          <Badge variant="outline" className="border-gold/30 text-gold ml-auto">
            {myTracks.length} tracks
          </Badge>
        </div>

        {loadingMyTracks ? (
          <div className="space-y-3" data-ocid="myuploads.loading_state">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-4 h-16 animate-pulse bg-gold/5"
              />
            ))}
          </div>
        ) : myTracks.length === 0 ? (
          <div
            className="text-center py-16 glass-card rounded-2xl border border-gold/10"
            data-ocid="myuploads.empty_state"
          >
            <Music className="w-12 h-12 text-gold/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              You haven&apos;t uploaded any tracks yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 border border-gold/10 flex items-center gap-4"
                data-ocid={`myuploads.item.${i + 1}`}
              >
                {track.coverArtBlobId ? (
                  <TrackThumbnail blobId={track.coverArtBlobId} />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-gold/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist}
                    {track.genre ? ` · ${track.genre}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-gold font-medium text-sm">
                    ${(Number(track.priceInCents) / 100).toFixed(2)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`myuploads.delete_button.${i + 1}`}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card border-gold/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-gold">
                          Delete Track?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove{" "}
                          <strong className="text-foreground">
                            {track.title}
                          </strong>{" "}
                          from the catalog.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          data-ocid="myuploads.delete.cancel_button"
                          className="border-gold/20"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="myuploads.delete.confirm_button"
                          onClick={() => {
                            deleteTrack.mutate(track.id);
                            toast.success("Track deleted.");
                          }}
                          className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

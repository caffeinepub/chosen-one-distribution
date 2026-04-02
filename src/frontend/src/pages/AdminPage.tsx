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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  DollarSign,
  Loader2,
  Music,
  Plus,
  Save,
  Shield,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import type { Page } from "../App";
import type { Track } from "../backend.d";
import { useBlobStorage } from "../hooks/useBlobStorage";
import {
  useAddTrack,
  useDeleteTrack,
  useGetAllTracks,
  useGetAnalytics,
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from "../hooks/useQueries";

interface AdminPageProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  navigate: (p: Page) => void;
}

interface TrackFormData {
  title: string;
  artist: string;
  genre: string;
  description: string;
  priceInDollars: string;
  coverArtFile: File | null;
  audioFile: File | null;
}

const EMPTY_FORM: TrackFormData = {
  title: "",
  artist: "",
  genre: "",
  description: "",
  priceInDollars: "",
  coverArtFile: null,
  audioFile: null,
};

function TrackThumbnail({ blobId }: { blobId: string }) {
  const { getBlobUrl } = useBlobStorage();
  const url = getBlobUrl(blobId);

  if (!url)
    return <div className="w-10 h-10 rounded bg-gold/10 flex-shrink-0" />;
  return (
    <img
      src={url}
      alt="cover"
      className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gold/20"
    />
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-6 flex flex-col gap-3 border border-gold/20">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs tracking-widest uppercase font-medium">
          {label}
        </span>
        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
          {icon}
        </div>
      </div>
      <div>
        <p className="font-display text-3xl font-bold gold-gradient-text leading-none">
          {value}
        </p>
        {sub && <p className="text-muted-foreground text-xs mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminPage({
  isAuthenticated,
  isAdmin,
}: AdminPageProps) {
  const { data: tracks = [], isLoading } = useGetAllTracks();
  const addTrack = useAddTrack();
  const deleteTrack = useDeleteTrack();
  const setStripeConfig = useSetStripeConfiguration();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics();
  const { uploadBlob } = useBlobStorage();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TrackFormData>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [stripeKey, setStripeKey] = useState("");
  const [stripeCountries, setStripeCountries] = useState("US,GB,CA,AU");

  // Manage cover art preview object URL
  useEffect(() => {
    if (!form.coverArtFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.coverArtFile);
    setCoverPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [form.coverArtFile]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-gold/20 mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold gold-gradient-text mb-3">
          Admin Panel
        </h1>
        <p className="text-muted-foreground">
          {!isAuthenticated
            ? "Please sign in to access the admin panel."
            : "You do not have admin access."}
        </p>
      </div>
    );
  }

  const handleFormChange = (
    field: keyof TrackFormData,
    value: string | File | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTrack = async () => {
    if (!form.title || !form.artist || !form.genre || !form.priceInDollars) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setUploading(true);
    try {
      let coverArtBlobId: string | undefined;
      let audioFileBlobId: string | undefined;

      if (form.coverArtFile) {
        coverArtBlobId = await uploadBlob(form.coverArtFile);
      }
      if (form.audioFile) {
        audioFileBlobId = await uploadBlob(form.audioFile);
      }

      const priceInCents = BigInt(
        Math.round(Number.parseFloat(form.priceInDollars) * 100),
      );

      const track: Track = {
        id: crypto.randomUUID(),
        title: form.title,
        artist: form.artist,
        genre: form.genre,
        description: form.description,
        priceInCents,
        uploadDate: BigInt(Date.now()) * BigInt(1_000_000),
        coverArtBlobId,
        audioFileBlobId,
      };

      const audioFormat = form.audioFile ? form.audioFile.type : null;
      await addTrack.mutateAsync({ track, audioFormat });
      toast.success(`"${track.title}" has been uploaded successfully!`);
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string, title: string) => {
    try {
      await deleteTrack.mutateAsync(trackId);
      toast.success(`"${title}" has been removed.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Delete failed: ${msg}`);
    }
  };

  const handleSaveStripe = async () => {
    if (!stripeKey) {
      toast.error("Please enter a Stripe secret key.");
      return;
    }
    try {
      await setStripeConfig.mutateAsync({
        secretKey: stripeKey,
        allowedCountries: stripeCountries
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      toast.success("Stripe configuration saved!");
      setStripeKey("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save Stripe config: ${msg}`);
    }
  };

  const triggerFileInput = (id: string) => {
    document.getElementById(id)?.click();
  };

  const fmtRevenue = (cents: bigint) => `$${(Number(cents) / 100).toFixed(2)}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
          <h1 className="font-display font-bold text-3xl md:text-4xl">
            <span className="gold-gradient-text">Admin Panel</span>
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
        </div>
        <p className="text-center text-muted-foreground mb-10">
          Manage your distribution platform
        </p>

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="bg-muted border border-gold/20 mb-8">
            <TabsTrigger
              value="tracks"
              data-ocid="admin.tracks.tab"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              Tracks
            </TabsTrigger>
            <TabsTrigger
              value="stripe"
              data-ocid="admin.stripe.tab"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              Stripe Settings
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              data-ocid="admin.analytics.tab"
              className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-display font-semibold text-xl">
                  Uploaded Tracks
                </h2>
                <p className="text-muted-foreground text-sm">
                  {tracks.length} track{tracks.length !== 1 ? "s" : ""} in
                  catalog
                </p>
              </div>
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-ocid="admin.track.open_modal_button"
                    className="gold-glow-btn rounded-md h-9 px-4 text-xs"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Track
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="glass-card border-gold/20 text-foreground max-w-lg max-h-[90vh] overflow-y-auto"
                  data-ocid="admin.track.modal"
                >
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl text-gold">
                      Upload New Track
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                          Title *
                        </Label>
                        <Input
                          value={form.title}
                          onChange={(e) =>
                            handleFormChange("title", e.target.value)
                          }
                          placeholder="Track title"
                          data-ocid="admin.track.title.input"
                          className="bg-muted border-gold/20 focus:border-gold/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                          Artist *
                        </Label>
                        <Input
                          value={form.artist}
                          onChange={(e) =>
                            handleFormChange("artist", e.target.value)
                          }
                          placeholder="Artist name"
                          data-ocid="admin.track.artist.input"
                          className="bg-muted border-gold/20 focus:border-gold/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                          Genre *
                        </Label>
                        <Input
                          value={form.genre}
                          onChange={(e) =>
                            handleFormChange("genre", e.target.value)
                          }
                          placeholder="e.g. Hip-Hop, R&B"
                          data-ocid="admin.track.genre.input"
                          className="bg-muted border-gold/20 focus:border-gold/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                          Price (USD) *
                        </Label>
                        <Input
                          value={form.priceInDollars}
                          onChange={(e) =>
                            handleFormChange("priceInDollars", e.target.value)
                          }
                          placeholder="9.99"
                          type="number"
                          min="0"
                          step="0.01"
                          data-ocid="admin.track.price.input"
                          className="bg-muted border-gold/20 focus:border-gold/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                        Description
                      </Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) =>
                          handleFormChange("description", e.target.value)
                        }
                        placeholder="Describe the track..."
                        data-ocid="admin.track.description.textarea"
                        rows={3}
                        className="bg-muted border-gold/20 focus:border-gold/50 resize-none"
                      />
                    </div>
                    {/* Cover Art Dropzone with live preview */}
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                        Cover Art
                      </Label>
                      <button
                        type="button"
                        className="w-full border-2 border-dashed border-gold/20 rounded-lg overflow-hidden cursor-pointer hover:border-gold/40 transition-colors"
                        onClick={() => triggerFileInput("coverArtInput")}
                        data-ocid="admin.track.cover.dropzone"
                      >
                        {coverPreviewUrl ? (
                          <div className="relative">
                            <img
                              src={coverPreviewUrl}
                              alt="Cover art preview"
                              className="w-full aspect-square object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5">
                              <p className="text-xs text-gold truncate">
                                {form.coverArtFile?.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <Upload className="w-6 h-6 text-gold/40 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              Click to upload cover art
                            </p>
                          </div>
                        )}
                        <input
                          id="coverArtInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFormChange(
                              "coverArtFile",
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                        Audio File *
                      </Label>
                      <button
                        type="button"
                        className="w-full border-2 border-dashed border-gold/20 rounded-lg p-4 text-center cursor-pointer hover:border-gold/40 transition-colors"
                        onClick={() => triggerFileInput("audioFileInput")}
                        data-ocid="admin.track.audio.dropzone"
                      >
                        {form.audioFile ? (
                          <p className="text-sm text-gold">
                            {form.audioFile.name}
                          </p>
                        ) : (
                          <>
                            <Music className="w-6 h-6 text-gold/40 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              Click to upload audio file (MP3, WAV, etc.)
                            </p>
                          </>
                        )}
                        <input
                          id="audioFileInput"
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFormChange(
                              "audioFile",
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </button>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleAddTrack}
                        disabled={uploading || addTrack.isPending}
                        data-ocid="admin.track.submit_button"
                        className="flex-1 gold-glow-btn rounded-md h-9"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" /> Upload Track
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setForm(EMPTY_FORM);
                          setFormOpen(false);
                        }}
                        data-ocid="admin.track.cancel_button"
                        className="border-gold/20 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div
                data-ocid="admin.tracks.loading_state"
                className="text-center py-10 text-muted-foreground"
              >
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
                Loading tracks...
              </div>
            ) : tracks.length === 0 ? (
              <div
                className="text-center py-20 glass-card rounded-xl"
                data-ocid="admin.tracks.empty_state"
              >
                <Music className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tracks uploaded yet. Click "Upload Track" to add your first
                  track.
                </p>
              </div>
            ) : (
              <div className="glass-card rounded-xl overflow-hidden">
                <Table data-ocid="admin.tracks.table">
                  <TableHeader>
                    <TableRow className="border-gold/10 hover:bg-transparent">
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                        Track
                      </TableHead>
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                        Artist
                      </TableHead>
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                        Genre
                      </TableHead>
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                        Price
                      </TableHead>
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                        Files
                      </TableHead>
                      <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase w-24">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks.map((track, i) => (
                      <TableRow
                        key={track.id}
                        className="border-gold/10 hover:bg-gold/5"
                        data-ocid={`admin.tracks.row.${i + 1}`}
                      >
                        <TableCell className="font-medium font-display">
                          <div className="flex items-center gap-3">
                            {track.coverArtBlobId ? (
                              <TrackThumbnail blobId={track.coverArtBlobId} />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 text-gold/30" />
                              </div>
                            )}
                            <span>{track.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {track.artist}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] tracking-wider uppercase">
                            {track.genre}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gold font-semibold">
                          ${(Number(track.priceInCents) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex gap-1 flex-wrap">
                            {track.audioFileBlobId && (
                              <Badge
                                variant="outline"
                                className="border-green-500/30 text-green-400 text-[9px]"
                              >
                                Audio ✓
                              </Badge>
                            )}
                            {track.coverArtBlobId && (
                              <Badge
                                variant="outline"
                                className="border-blue-500/30 text-blue-400 text-[9px]"
                              >
                                Art ✓
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-ocid={`admin.tracks.delete_button.${i + 1}`}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              className="glass-card border-gold/20 text-foreground"
                              data-ocid="admin.tracks.delete.dialog"
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display text-gold">
                                  Delete Track
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to delete "{track.title}
                                  "? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  data-ocid="admin.tracks.delete.cancel_button"
                                  className="border-gold/20 text-muted-foreground hover:text-foreground"
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteTrack(track.id, track.title)
                                  }
                                  data-ocid="admin.tracks.delete.confirm_button"
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Stripe Settings Tab */}
          <TabsContent value="stripe">
            <div className="max-w-lg">
              <div className="glass-card rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-xl">
                    Stripe Configuration
                  </h2>
                  <Badge
                    className={
                      stripeConfigured
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }
                  >
                    {stripeConfigured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Connect your Stripe account to enable payment processing.
                  Enter your Stripe secret key below.
                </p>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs tracking-widest uppercase">
                    Stripe Secret Key
                  </Label>
                  <Input
                    type="password"
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="sk_live_... or sk_test_..."
                    data-ocid="admin.stripe.key.input"
                    className="bg-muted border-gold/20 focus:border-gold/50 font-mono text-sm"
                  />
                  <p className="text-muted-foreground text-xs">
                    Found in your Stripe Dashboard → Developers → API Keys
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs tracking-widest uppercase">
                    Allowed Countries (comma-separated)
                  </Label>
                  <Input
                    value={stripeCountries}
                    onChange={(e) => setStripeCountries(e.target.value)}
                    placeholder="US,GB,CA,AU"
                    data-ocid="admin.stripe.countries.input"
                    className="bg-muted border-gold/20 focus:border-gold/50"
                  />
                </div>

                <Button
                  onClick={handleSaveStripe}
                  disabled={setStripeConfig.isPending}
                  data-ocid="admin.stripe.submit_button"
                  className="gold-glow-btn rounded-md h-10 px-6 w-full"
                >
                  {setStripeConfig.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {analyticsLoading ? (
              <div
                data-ocid="admin.analytics.loading_state"
                className="text-center py-10 text-muted-foreground"
              >
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
                Loading analytics...
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-8"
                data-ocid="admin.analytics.panel"
              >
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard
                    icon={<Music className="w-4 h-4" />}
                    label="Total Tracks"
                    value={String(analytics?.totalTracks ?? 0)}
                    sub="In catalog"
                  />
                  <KpiCard
                    icon={<ShoppingBag className="w-4 h-4" />}
                    label="Total Purchases"
                    value={String(analytics?.totalPurchases ?? 0)}
                    sub="All-time sales"
                  />
                  <KpiCard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Total Revenue"
                    value={fmtRevenue(analytics?.totalRevenueInCents ?? 0n)}
                    sub="All-time earnings"
                  />
                </div>

                {/* Revenue Over Time Chart */}
                {analytics?.revenueOverTime &&
                  analytics.revenueOverTime.length > 0 && (
                    <div data-ocid="admin.analytics.panel">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-gold" />
                        <h2 className="font-display font-semibold text-lg">
                          Revenue Over Time
                        </h2>
                      </div>
                      <div className="glass-card rounded-xl p-4 border border-gold/10">
                        <ChartContainer
                          config={{
                            revenue: { label: "Revenue", color: "#D4AF37" },
                          }}
                          className="h-[260px] w-full"
                        >
                          <AreaChart
                            data={analytics.revenueOverTime.map((d) => ({
                              date: d.dateLabel,
                              revenue: Number(d.revenueInCents) / 100,
                              purchases: Number(d.purchaseCount),
                            }))}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="goldGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#D4AF37"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#D4AF37"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(212,175,55,0.1)"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{
                                fill: "rgba(212,175,55,0.5)",
                                fontSize: 11,
                              }}
                              axisLine={{ stroke: "rgba(212,175,55,0.2)" }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{
                                fill: "rgba(212,175,55,0.5)",
                                fontSize: 11,
                              }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => [
                                    `$${Number(value).toFixed(2)}`,
                                    "Revenue",
                                  ]}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#D4AF37"
                              strokeWidth={2}
                              fill="url(#goldGradient)"
                              dot={{ fill: "#D4AF37", r: 3, strokeWidth: 0 }}
                              activeDot={{
                                r: 5,
                                fill: "#D4AF37",
                                strokeWidth: 0,
                              }}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    </div>
                  )}

                {/* Top Tracks Table */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-gold" />
                    <h2 className="font-display font-semibold text-lg">
                      Top Performing Tracks
                    </h2>
                  </div>

                  {!analytics?.topTracks?.length ? (
                    <div
                      className="text-center py-16 glass-card rounded-xl border border-gold/10"
                      data-ocid="admin.analytics.empty_state"
                    >
                      <BarChart3 className="w-10 h-10 text-gold/20 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No sales data yet. Revenue data will appear here once
                        purchases are made.
                      </p>
                    </div>
                  ) : (
                    <div className="glass-card rounded-xl overflow-hidden border border-gold/10">
                      <Table data-ocid="admin.analytics.table">
                        <TableHeader>
                          <TableRow className="border-gold/10 hover:bg-transparent">
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase w-16">
                              Rank
                            </TableHead>
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                              Track Title
                            </TableHead>
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase">
                              Artist
                            </TableHead>
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase text-right">
                              Sales
                            </TableHead>
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase text-right">
                              Revenue
                            </TableHead>
                            <TableHead className="text-gold/70 font-medium text-xs tracking-widest uppercase text-right">
                              Previews
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...analytics.topTracks]
                            .sort(
                              (a, b) =>
                                Number(b.purchaseCount) -
                                Number(a.purchaseCount),
                            )
                            .map((stat, i) => (
                              <TableRow
                                key={stat.trackId}
                                className="border-gold/10 hover:bg-gold/5"
                                data-ocid={`admin.analytics.row.${i + 1}`}
                              >
                                <TableCell>
                                  {i === 0 ? (
                                    <span className="font-bold text-base gold-gradient-text">
                                      #1
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground font-mono text-sm">
                                      #{i + 1}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="font-display font-medium">
                                  {stat.title}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {stat.artist}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">
                                    {String(stat.purchaseCount)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-gold font-semibold">
                                  {fmtRevenue(stat.revenueInCents)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge className="bg-gold/5 text-gold/70 border-gold/10 text-xs font-mono">
                                    {String(
                                      analytics.trackPlayCounts?.find(
                                        ([id]) => id === stat.trackId,
                                      )?.[1] ?? 0n,
                                    )}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

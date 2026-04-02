import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useVerifyPayment } from "../hooks/useQueries";

export default function PaymentVerifier() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const trackId = params.get("track_id");
  const verifyPayment = useVerifyPayment();
  const { identity } = useInternetIdentity();
  const verifiedRef = useRef(false);
  const mutateAsync = verifyPayment.mutateAsync;

  useEffect(() => {
    if (!sessionId || !trackId || verifiedRef.current) return;
    if (!identity || identity.getPrincipal().isAnonymous()) return;

    verifiedRef.current = true;
    mutateAsync({ sessionId, trackId })
      .then(() => {
        toast.success(
          "Payment verified! Your track is now available for download.",
        );
        const url = new URL(window.location.href);
        url.searchParams.delete("session_id");
        url.searchParams.delete("track_id");
        window.history.replaceState({}, "", url.toString());
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Payment verification failed: ${msg}`);
      });
  }, [sessionId, trackId, identity, mutateAsync]);

  if (!sessionId) return null;

  return (
    <div
      data-ocid="payment.loading_state"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="glass-card rounded-xl p-8 text-center max-w-sm mx-4">
        <div className="crown-glow text-4xl mb-4">👑</div>
        <h2 className="font-display text-xl font-bold text-gold mb-2">
          Verifying Payment
        </h2>
        <p className="text-muted-foreground text-sm">
          Please wait while we confirm your purchase...
        </p>
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

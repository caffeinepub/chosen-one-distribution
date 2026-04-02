import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AnalyticsResult,
  Purchase,
  ShoppingItem,
  StripeConfiguration,
  Track,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllTracks() {
  const { actor, isFetching } = useActor();
  return useQuery<Track[]>({
    queryKey: ["tracks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrack(trackId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Track | null>({
    queryKey: ["track", trackId],
    queryFn: async () => {
      if (!actor || !trackId) return null;
      return actor.getTrack(trackId);
    },
    enabled: !!actor && !isFetching && !!trackId,
  });
}

export function useGetUserPurchases() {
  const { actor, isFetching } = useActor();
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyUploadedTracks() {
  const { actor, isFetching } = useActor();
  return useQuery<Track[]>({
    queryKey: ["myUploads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyUploadedTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<AnalyticsResult | null>({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) return null;
      // getAnalytics is added in the new backend version
      return (
        actor as unknown as { getAnalytics(): Promise<AnalyticsResult> }
      ).getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      track,
      audioFormat,
      previewStartSeconds: _previewStartSeconds,
    }: {
      track: Track;
      audioFormat: string | null;
      previewStartSeconds?: bigint | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addTrack(track, audioFormat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["myUploads"] });
    },
  });
}

export function useUpdateTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (track: Track) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateTrack(track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useDeleteTrack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trackId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteTrack(trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["myUploads"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
  });
}

export function useVerifyPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      trackId,
    }: {
      sessionId: string;
      trackId: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.verifyPaymentAndRecordPurchase(sessionId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
    },
  });
}

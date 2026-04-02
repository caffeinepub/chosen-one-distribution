import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Track {
    id: string;
    audioFileBlobId?: string;
    coverArtBlobId?: string;
    title: string;
    description: string;
    genre: string;
    artist: string;
    priceInCents: bigint;
    uploadDate: Time;
}
export type Time = bigint;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Purchase {
    purchaseDate: Time;
    amountPaidInCents: bigint;
    trackId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTrack(track: Track, audioFormat: string | null, previewStartSeconds: bigint | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteTrack(trackId: string): Promise<void>;
    getAllTracks(): Promise<Array<Track>>;
    getMyUploadedTracks(): Promise<Array<Track>>;
    getCallerUserRole(): Promise<UserRole>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTrack(trackId: string): Promise<Track | null>;
    getTrackAudioFileBlobId(trackId: string): Promise<string | null>;
    getTrackAudioFormat(trackId: string): Promise<string | null>;
    getTrackCoverArtBlobId(trackId: string): Promise<string | null>;
    getTrackPreviewStartSeconds(trackId: string): Promise<bigint | null>;
    getUserPurchases(): Promise<Array<Purchase>>;
    hasPurchasedTrack(trackId: string, userId: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateTrack(track: Track): Promise<void>;
    verifyPaymentAndRecordPurchase(sessionId: string, trackId: string): Promise<void>;
}

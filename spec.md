# Chosen One Distribution

## Current State
Tracks have title, artist, genre, description, price, cover art, audio file, upload date. Users can purchase and download tracks. No concept of pre-sell or future release dates.

## Requested Changes (Diff)

### Add
- `isPreSell: Bool` and `releaseDate: ?Time.Time` fields on the `Track` type
- Backend logic: if track is pre-sell and `releaseDate` is in the future, block audio download even if purchased (return error "Track not yet released")
- Upload form: pre-sell toggle; when enabled, show a release date/time picker
- TrackCard: "PRE-ORDER" gold badge for pre-sell tracks; button says "Pre-Order" instead of "Buy"; show release date label
- Library page: pre-ordered tracks show "Coming Soon" with release date; once release date passes, download becomes available
- `addTrack` signature updated to accept optional `releaseDate` (nanoseconds Int)

### Modify
- `getTrackAudioFileBlobId`: add check — if track is pre-sell and current time < releaseDate, trap even if purchased
- `TrackCard`: display pre-sell state visually (badge, button label, release date)
- `UploadPage`: add pre-sell fields
- `LibraryPage`: show pre-sell status on purchased tracks

### Remove
- Nothing removed

## Implementation Plan
1. Update `Track` type in `main.mo` with `isPreSell` and `releaseDate` fields
2. Update `addTrack` to accept and store `releaseDate`
3. Update `getTrackAudioFileBlobId` to block download for unreleased pre-sell tracks
4. Update `backend.d.ts` to reflect new Track shape and addTrack signature
5. Update `UploadPage.tsx` to include pre-sell toggle and date picker
6. Update `TrackCard.tsx` to show pre-sell badge, release date, and correct button state
7. Update `LibraryPage.tsx` to indicate pre-ordered but unreleased tracks

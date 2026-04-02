# Chosen One Distribution

## Current State
Admin Panel has two tabs: Tracks and Stripe Settings. Backend has tracks, purchases, and user purchase maps but no analytics endpoints. The frontend has no analytics view.

## Requested Changes (Diff)

### Add
- Backend: `getAnalytics()` admin-only query returning total tracks, total purchases, total revenue (cents), top tracks by purchase count, and recent purchases with track title.
- Frontend: "Analytics" tab in Admin Panel displaying KPI cards (total tracks, total purchases, total revenue) and a top tracks table sorted by sales.

### Modify
- `AdminPage.tsx`: Add Analytics tab alongside existing Tracks and Stripe tabs.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `TrackAnalytics` and `AnalyticsResult` types to backend.
2. Add `getAnalytics()` query function iterating all purchases across all users.
3. Regenerate frontend bindings (backend.d.ts).
4. Add `useGetAnalytics` hook in `useQueries.ts`.
5. Build Analytics tab UI in `AdminPage.tsx` with stat cards and top-tracks table.

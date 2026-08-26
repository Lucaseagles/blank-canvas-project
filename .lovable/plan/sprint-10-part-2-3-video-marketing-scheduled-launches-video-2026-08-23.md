# Sprint 10 (Part 2/3) - Video Marketing: Scheduled Launches & Video Campaigns

## Objective
Connect the Video Commerce system with the Campaign Engine to enable scheduled "video premieres" and campaign-driven video discovery.

## Proposed Changes

### Database & Schema
- Extend `videos` table:
    - Add `scheduled_for` (timestamptz) for future releases.
    - Add `campaign_id` (uuid) to link videos to marketing campaigns.
- Create automated publication trigger logic.

### Backend (Server Functions)
- **src/lib/video.functions.ts**:
    - Update `getVideos` to filter out `scheduled_for` videos that haven't reached their time yet for public users.
    - Update `saveVideo` to handle `scheduled_for` and `campaign_id`.
- **src/lib/automation.functions.ts**:
    - Add logic to handle `VIDEO_LAUNCH` automation rules.
- **src/lib/campaigns.functions.ts**:
    - Update campaign retrieval to include associated videos.

### Frontend & UI
- **src/routes/admin/videos.tsx**:
    - Add `scheduled_for` date picker and `campaign_id` selector to the Video creation/edit dialog.
- **src/components/product/VideoCard.tsx**:
    - Implement "Premiere" badge with real countdown for future `scheduled_for` videos.
- **src/routes/index.tsx**:
    - Add spotlight for active campaign videos.
- **src/routes/admin/campaigns.tsx**:
    - Update Funnel Analytics to explicitly display video conversion sources.

## Technical Details
- Countdown logic will use client-side state driven by the `scheduled_for` timestamp.
- RLS policies for `videos` will be updated to ensure `scheduled_for` items are hidden from non-admin users until the timestamp passes.

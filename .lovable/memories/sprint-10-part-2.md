---
name: Sprint 10 Part 2
description: Video Marketing: Scheduled Launches & Video Campaigns
type: feature
---

# Sprint 10 (Part 2/3) - Video Marketing: Scheduled Launches & Video Campaigns

## Overview
Connects the Video Commerce system with the Campaign Engine to enable scheduled "video premieres" and campaign-driven video discovery.

## Features
- **Scheduled Launches**: Videos can now have a `scheduled_for` timestamp. They remain in 'draft' status until the time passes, at which point the automation engine can publish them.
- **Campaign Integration**: Videos can be linked to campaigns via `campaign_id`.
- **Premiere UI**: `VideoCard` displays a real-time countdown for upcoming premieres.
- **Spotlight Feed**: The Home feed includes a spotlight section for active campaign videos.
- **Video Conversion Funnel**: Funnel analytics now explicitly track `video_views` (triggered by `video_start` events).

## Technical Details
- **Database**: Extended `videos` table with `scheduled_for` and `campaign_id`.
- **Automation**: New `processVideoLaunches` server function to handle automated publishing and campaign channel triggering.
- **Analytics**: Updated `get_campaign_funnel` RPC to aggregate video engagement metrics.

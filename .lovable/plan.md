

# Stullio — Core Build Plan

## Overview
A mobile-only app for parents to record themselves reading children's books aloud, mark page turns and chapters, then let children listen back while following along in the physical book. Built with Capacitor for native iOS/Android deployment.

---

## Phase: Core First

We'll build the complete UI system and core recording + playback + basic library functionality. Folders, settings, and advanced features will come in follow-up iterations.

---

## 1. Design System & App Shell

- **Color palette**: Pastel earth tones — warm sand, soft sage, muted terracotta, gentle cream, dusty rose
- **Typography**: Clean, rounded-friendly font with generous spacing
- **Components**: Rounded buttons with soft shadows, card sections, large tap targets
- **Bottom tab bar**: Rounded with soft elevation, three tabs — Record (mic+cassette icon), Library (stacked books icon), Settings (gear icon)
- **Portrait lock** via Capacitor configuration

## 2. Record Tab — Recording Setup Screen

- Text input for **Book Name**
- **Cover Photo** button (camera capture via Capacitor Camera plugin)
- **Page Turn Sound** dropdown with 4 presets (soft page flip, gentle chime, soft pop, paper rustle)
- **"Start Reading"** large primary button at bottom
- Soft card layout with clear visual hierarchy

## 3. Record Tab — Active Recording

- **3-second countdown** overlay before recording begins
- Top area: red recording dot + elapsed time
- Three large centered buttons stacked vertically: **Turn Page** (most prominent), **The End** (second), **New Chapter** (least prominent)
- **Scrolling horizontal timeline** with tick marks every 15 seconds, growing as recording progresses
- Cancel button in top corner (discards recording)
- Screen stays awake during recording (Capacitor KeepAwake plugin)
- Audio recording via Capacitor or Web Audio API
- Markers stored as timestamped tags (page turn, chapter)

## 4. Record Tab — Recording Complete

- After tapping "The End," recording is processed and saved locally
- A new book entry is created with: title, thumbnail, duration, page turn count, chapter count
- All data stored in IndexedDB/local storage; audio as a local file

## 5. Library Tab — Book List

- "All Books" root view showing all recorded books as cards
- Each **Book Card**: thumbnail, title, duration, page turns, chapters, ellipsis menu
- Ellipsis menu: Rename, Delete (with confirmation modal)
- Empty state with friendly illustration/message encouraging first recording

## 6. Library Tab — Book Detail & Player

- **Book Detail Screen**: large thumbnail, title, duration, page turns, chapters, large Play button
- **Player Screen** (after 2-second delay):
  - Title at top
  - Large Play/Pause button centered
  - Skip backward/forward 15 seconds
  - Chapter skip backward/forward
  - Scrolling timeline with 15-second tick marks, chapter markers, and page turn markers visible
  - Page turn sound plays at each page marker
  - Resets to beginning when book ends
  - Background audio playback when phone is locked (Capacitor background audio)

## 7. Settings Tab (Minimal)

- **Page Turn Volume Upper Limit** slider
- Simple, clean layout
- Controls the relative max volume of page turn sounds (independent of narration)

## 8. Capacitor Setup

- Configure Capacitor for iOS and Android
- Plugins: Camera, Microphone permissions, KeepAwake, Background Audio
- Portrait-only orientation lock
- Local file storage for audio recordings

---

## What's Deferred to Follow-Up Iterations

- Folder creation and file-explorer-style navigation with breadcrumbs
- Folder selector on recording setup screen
- Additional page turn sound presets
- Polish, animations, and micro-interactions


# Project Fix & Feature Checklist

## 1. Bug Fix: Zoom Consistency
- [x] Fix inconsistent behavior between zoom-in and zoom-out on the map
- [x] Ensure marker scaling/clustering behaves the same in both directions

## 2. Auth & Notes UX
- [x] Confirm map can be viewed/browsed without signing in
- [x] Add clear indication that an account is required to get notifications on comments
- [x] Prompt account creation when a user tries to leave a note
- [x] Allow users to delete their own notes
- [x] Prevent users from editing their own notes
- [x] Add "Create an account" CTA at relevant touchpoints

## 3. Featured Note Placement
- [x] Reposition the "Featured" note UI element to top-center of the screen

## 4. Real-Time Updates
- [x] Notes removed by admin reflect on the map in real time (no reload needed)
- [x] Notes deleted by a user reflect on the map in real time (no reload needed)

## 5. Admin: Featured Note Control
- [x] Add ability for admin to manually select/force a specific note as "Featured"
- [x] Add a "Randomize" option/button to keep the existing random-selection behavior

## 6. New Feature: Note Sharing (per design-preview.html)
- [x] Review `design-preview.html` (landing page with map/popup design previews)
- [x] Implement the previewed map UI as the new live map UI
- [x] Implement the previewed popup UI as the new live popup UI
- [x] Follow `design-preview.html` strictly as the source of truth for design

## 7. New Feature: Story-Style Sharing (IG/FB Story format)
- [x] Build Instagram/Facebook Story–style sharing for notes
- [x] Match the exact format/flow shown in `design-preview.html`
- [x] Treat `design-preview.html` as the primary reference for this feature

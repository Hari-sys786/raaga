# Raaga Mobile Bug Fixes Plan

**Date:** 2026-04-15  
**Branch:** dev  
**Issues:** 6 critical UI/UX fixes

---

## Issue 1: Artist Screen - Image & Songs List

**Root Cause:** 
- Image component missing proper source URL handling
- FlatList missing onEndReached handler for pagination

**Fix:**
- File: `src/screens/ArtistScreen.tsx`
- Add proper image URL fallback
- Implement onEndReached for loading more songs on scroll

**Verification:**
- Artist image displays correctly
- Scrolling loads all artist songs

---

## Issue 2: Bottom Bar Overlapping System Nav

**Root Cause:**
- PlayerBar missing safeAreaInsets handling
- No padding for Android navigation bar

**Fix:**
- File: `src/components/PlayerBar.tsx`
- Import `useSafeAreaInsets` from react-native-safe-area-context
- Add bottom padding equal to insets.bottom

**Verification:**
- Bottom bar doesn't overlap system navigation
- Test on Android with gesture nav

---

## Issue 3: Play My Mix Feature Missing

**Root Cause:**
- Feature not implemented in HomeScreen
- No recommendation algorithm based on listening history

**Fix:**
- File: `src/screens/HomeScreen.tsx`
- Add "Play My Mix" card in home screen
- File: `src/utils/recommendations.ts` (new)
- Implement algorithm: analyze top artists, genres, languages from listening history
- Return 20 songs weighted by user preferences

**Verification:**
- "Play My Mix" button visible on home
- Generates personalized song list
- Plays songs matching user taste

---

## Issue 4: Search Screen Flicker

**Root Cause:**
- Search results re-rendering on song playback state changes
- Missing memoization of search results

**Fix:**
- File: `src/screens/SearchScreen.tsx`
- Wrap search results in useMemo
- Separate playback state from search state
- Add key prop to prevent unnecessary re-renders

**Verification:**
- Search results don't flicker during playback
- Images stay stable

---

## Issue 5: Mood/Genre Only Hindi

**Root Cause:**
- Mood/genre filter hardcoded to Hindi language
- Not reading user's dominant language from listening history

**Fix:**
- File: `src/screens/MoodScreen.tsx`
- Read userLanguage from profile/listening history
- Filter songs by user's dominant language (Telugu, Tamil, Hindi, etc.)
- Fallback to mixed if no dominant language

**Verification:**
- Mood shows songs in user's primary language
- Telugu users see Telugu songs in mood categories

---

## Issue 6: Download Delete Modal Flicker

**Root Cause:**
- Modal state changing during delete operation
- Missing loading state during async delete

**Fix:**
- File: `src/components/DownloadModal.tsx`
- Add isDeleting state
- Show loading indicator during delete
- Disable modal close during operation

**Verification:**
- Modal doesn't flicker during delete
- Smooth delete animation

---

## Execution Order

1. Issue 2 (Bottom Bar) - Quick fix, 5 min
2. Issue 6 (Download Modal) - Quick fix, 10 min
3. Issue 4 (Search Flicker) - Medium, 15 min
4. Issue 1 (Artist Screen) - Medium, 20 min
5. Issue 5 (Mood/Genre) - Medium, 20 min
6. Issue 3 (Play My Mix) - Large, 45 min

**Total estimated:** ~2 hours

---

## Test Plan

After all fixes:
```bash
cd android && ./gradlew clean assembleRelease --no-daemon -x lint
```

Test on device:
1. Open artist → verify image + scroll songs
2. Check bottom bar on Android
3. Tap "Play My Mix" → verify recommendations
4. Search while playing → no flicker
5. Mood screen → shows correct language
6. Delete download → no modal flicker

# Raaga 🎵

A free, ad-free music player with massive Indian + International catalog, offline downloads, and premium UI.

## Features

- 🎵 Stream 320kbps from JioSaavn + YouTube Music
- 📥 Download songs for offline playback
- 🎨 Dynamic UI that adapts colors from album art
- 🔍 Search across multiple sources seamlessly
- 🎭 Browse by Genre (12), Mood (10), Language (10)
- 🔥 Trending + Viral from social media
- 📋 Queue management, shuffle, repeat
- 🎛️ 5-band equalizer with presets
- ⏰ Sleep timer
- ❤️ Favorites + listening history
- 🎤 Synced lyrics
- 🌙 Beautiful dark theme

## Tech Stack

- **Mobile:** React Native (Expo) + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Audio:** expo-av
- **State:** Zustand (persisted)
- **Sources:** JioSaavn API + Piped (YouTube) + LRCLIB (lyrics)

## Setup

### Backend

```bash
cd server && npm install && npm run build
node dist/index.js  # Port 3080
```

### Mobile

```bash
cd raaga-mobile && npm install
npx expo start
```

### Build APK

```bash
cd raaga-mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

## Made by Panda Dev 🐼

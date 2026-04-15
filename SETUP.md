# 🎵 Raaga — Setup Guide

> A music streaming app built with React Native (Expo). Plays songs from JioSaavn and YouTube Music.

## What You Need

Before starting, make sure you have these installed on your computer:

| Tool | Version | How to check | Install link |
|------|---------|-------------|-------------|
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | `npm --version` | Comes with Node.js |
| **Git** | Any | `git --version` | [git-scm.com](https://git-scm.com) |
| **Android Studio** | Latest | Open it | [developer.android.com](https://developer.android.com/studio) |
| **Java (JDK)** | 17+ | `java -version` | [adoptium.net](https://adoptium.net) |

**On your phone:** Enable "Install from Unknown Sources" (Settings → Security).

---

## Step 1: Clone the Project

```bash
git clone https://github.com/Hari-sys786/raaga.git
cd raaga
```

## Step 2: Install Dependencies

```bash
cd raaga-mobile
npm install
```

This takes 2-5 minutes. You'll see a `node_modules` folder appear.

## Step 3: Set Up Android SDK

Open Android Studio → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**.

Make sure these are installed:
- ✅ Android SDK Platform 36 (or latest)
- ✅ Android SDK Build-Tools 36.0.0
- ✅ NDK (Side by side) — version 27.1.12297006
- ✅ Android SDK Command-line Tools
- ✅ Android SDK Platform-Tools

Note the **Android SDK Location** shown at the top (e.g. `/Users/yourname/Library/Android/sdk`).

### Set Environment Variable

**Mac/Linux** — Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk   # Mac
export ANDROID_HOME=$HOME/Android/Sdk           # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then run: `source ~/.bashrc` (or `source ~/.zshrc`)

**Windows** — Search "Environment Variables" in Start Menu:
- Add `ANDROID_HOME` = `C:\Users\YourName\AppData\Local\Android\Sdk`
- Add `%ANDROID_HOME%\platform-tools` to your PATH

## Step 4: Generate Android Project

```bash
npx expo prebuild --platform android
```

This creates the `android/` folder. Takes about a minute.

## Step 5: Build the APK

```bash
cd android
./gradlew assembleRelease
```

**⏱ First build takes 15-20 minutes.** Subsequent builds take 3-5 minutes.

**If you only need arm64 (most modern phones):**
```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

This builds faster and creates a smaller APK.

### Where's the APK?

After build succeeds:
```
android/app/build/outputs/apk/release/app-release.apk
```

Transfer this file to your phone and install it.

---

## Step 6: Stream Server (Optional)

The app works for **JioSaavn songs without any server**. All search, browse, trending, and metadata calls go directly to JioSaavn/YouTube Music APIs.

For **YouTube Music audio playback**, you need the stream proxy server:

```bash
cd ../server
npm install
npm start
```

The server runs on port `3080` by default.

**To point the app to your server**, edit `raaga-mobile/services/config.ts`:
```typescript
export const STREAM_BASE = 'http://YOUR_SERVER_IP:3080/api';
```

Then rebuild the APK.

**Without the server:** JioSaavn songs play fine. YouTube songs will show in search results but won't play audio.

---

## Troubleshooting

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/path/to/your/Android/sdk
```

### Build fails with NDK errors
Make sure NDK 27.1.12297006 is installed in Android Studio SDK Manager.

### "Could not determine java version"
Install JDK 17+: `java -version` should show 17 or higher.

### Build runs out of memory
Add to `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4g
```

### APK is too large (>50MB)
Build for a single architecture:
```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### App crashes on launch
- Make sure you ran `npx expo prebuild --platform android` before building
- Check if `app.json` has the correct package name

---

## Development (Run with Expo)

For hot-reload development (no APK needed):

```bash
cd raaga-mobile
npx expo start
```

Then scan the QR code with **Expo Go** app on your phone.

---

## Project Structure

```
raaga/
├── raaga-mobile/          # React Native app
│   ├── app/               # Screens (Expo Router)
│   ├── components/        # Reusable UI components
│   ├── services/          # API clients (JioSaavn, YouTube, Lyrics)
│   ├── stores/            # State management (Zustand)
│   ├── assets/            # Icons, images
│   └── android/           # Generated Android project
├── server/                # Stream proxy server (optional)
│   └── src/
│       ├── routes/        # API endpoints
│       └── sources/       # JioSaavn, YouTube, Piped clients
└── SETUP.md               # This file
```

---

## FAQ

**Q: Do I need the server to use the app?**
A: No! JioSaavn songs work fully without any server. The server is only needed for YouTube Music audio streaming.

**Q: Can multiple people use this?**
A: Yes. Each person installs the APK on their phone. JioSaavn calls go directly from each phone — no shared server bottleneck. If you want YouTube streaming too, you can run one server that multiple users share.

**Q: How do I update the app?**
A: Pull latest code, run `npx expo prebuild --platform android --clean`, then `./gradlew assembleRelease` again.

**Q: Does it work without internet?**
A: No, it streams music. You need an internet connection.

# 🌌 NeonLoop Media Player

> **Automated Step-by-Step Segment Looper & Advanced Audio/Video Practice Player**  
> Built for language learners, musicians, vocalists, choreographers, and transcriptionists.

[![GitHub Release](https://img.shields.io/github/v/release/mrsyeko66/NeonLoop-Media-Player?color=00f0ff&label=Windows%20Release&logo=windows)](https://github.com/mrsyeko66/NeonLoop-Media-Player/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Web%20%7C%20Android%20(PWA)-blue)](#-download--installation)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)

---

## 🎯 What is NeonLoop? What is it Used For?

Traditional media players only loop an entire song or require you to repeatedly click back-and-forth manually to replay a sentence or a musical riff.

**NeonLoop Media Player** changes this completely. It automatically divides any audio or video track (from 0:00 to the very end of the file) into timed intervals (e.g., 5s, 10s, 15s) and repeats each segment a set number of times (e.g., 4 times) before automatically transitioning to the next segment.

### 🌟 Primary Use Cases:

1. **🗣️ Language Learners & Polyglots (Speech Shadowing):**
   - Practice the **Shadowing Technique** hands-free.
   - Listen to native audio/dialogue, repeat along on repeats 2 and 3, and check your pronunciation on repeat 4 without touching the keyboard.
   - Insert automated 1–2 second silent pause delays between repetitions to speak out loud.

2. **🎸 Musicians, Transcribers & Vocalists:**
   - Perfect difficult guitar solos, complex drum grooves, piano progressions, or vocal runs phrase-by-phrase.
   - Slow down fast passages to 0.5x or 0.75x with **pitch preservation** (the tone stays identical without robotic chipmunk distortion).

3. **💃 Dancers, Martial Artists & Athletes:**
   - Step through rapid choreographies, stunt sequences, or sports mechanics loop-by-loop.
   - Fullscreen video playback with high-resolution frame rendering.

4. **📝 Audio/Video Transcribers & Journalists:**
   - Transcribe interviews, meetings, and lectures comfortably sentence-by-sentence with automated pacing.

---

## ✨ Key Features & Capabilities

- 🔁 **Continuous Step-by-Step Looping:**
  - Auto-slice any media into customizable chunks (1s to 120s) with 1 to 50 repetitions each.
  - Seamless auto-advancement from segment 1 all the way to the end of multi-hour movies or tracks.
  - Optional pause delays (0.1s to 5s) between repeated passes.

- ⚡ **Pitch-Preserved Speed Controls:**
  - Adjust playback speed dynamically from **0.25x to 3.0x** with real-time natural pitch locking.

- 🎙️ **MKV Multi-Audio Language Switcher:**
  - Switch between multi-language embedded audio streams in MKV containers (e.g., Original English, Persian Dub, German, Japanese).
  - Add external secondary audio files to play synchronized alongside video.

- 📝 **Subtitles & Closed Captions (.SRT & .VTT):**
  - Drag-and-drop or load subtitle files with timing synchronization and customizable font sizes.

- 🌐 **Online Streaming & Local File Support:**
  - Play local files from disk or stream direct web URLs (`.mp4`, `.mkv`, `.webm`, `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`).

- 💾 **Stitched Media Exporter:**
  - Render and export your entire looped practice sequence into a standalone **lossless WAV audio** or **WebM video** file.
  - Take your repetitive practice track on your mobile phone, iPod, or car stereo!

- 🎚️ **3-Band Equalizer & Preamp Boost:**
  - Bass, Midrange, and Treble EQ controls with a 200% volume preamp booster for quiet recordings.

- 🌌 **Cyber Neon Dark Theme:**
  - Audio-reactive ambient glow with customizable neon hues (Cyan, Purple, Emerald, Rose, Amber).

---

## 📦 Download & Installation

### 1. Windows Executables (Direct from GitHub Releases)

Visit the [GitHub Releases](https://github.com/mrsyeko66/NeonLoop-Media-Player/releases) page to download:

| Version | File | Description |
| :--- | :--- | :--- |
| **Portable Version** | `NeonLoop-Portable-v*.exe` | **No installation needed.** Download and run immediately anywhere (runs from USB drives, Desktop, or Downloads folder without admin rights). |
| **Setup Installer** | `NeonLoop-Setup-v*.exe` | **Full Windows Setup.** Standard installation wizard that adds Desktop icons, Start Menu entries, and a clean uninstaller. |

### 2. Progressive Web App (PWA)

NeonLoop can also be installed as a native app on **Windows 10/11**, **Android**, **macOS**, and **iOS**:
1. Open the application in Google Chrome or Microsoft Edge.
2. Click the **Install** button in the top navigation bar or browser address bar.
3. The app will launch in its own standalone window without browser toolbars.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause |
| <kbd>[</kbd> / <kbd>]</kbd> | Previous / Next Looped Segment |
| <kbd>R</kbd> | Restart Current Segment Loop |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek backward / forward by 5 seconds |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / decrease volume |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>S</kbd> / <kbd>D</kbd> | Decrease / increase playback speed |
| <kbd>F</kbd> | Toggle Fullscreen |

---

## 🛠️ Technology Stack

- **UI & Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), Lucide Icons, Custom Neon Canvas Engine
- **Audio Processing:** Web Audio API (OfflineAudioContext, AnalyserNode, BiquadFilterNodes, MediaStreamDestination)
- **Desktop Packaging:** [Electron 33](https://www.electronjs.org/), [Electron-Builder 25](https://www.electron.build/)
- **PWA & Offline:** Service Workers, Web App Manifest via `vite-plugin-pwa`
- **CI/CD:** GitHub Actions automated multi-stage pipeline

---

## 💻 Local Development Setup

To run and build NeonLoop on your local machine:

### Prerequisites
- [Node.js](https://nodejs.org/) v20 or v22 LTS
- `npm`

### 1. Clone the repository
```bash
git clone https://github.com/mrsyeko66/NeonLoop-Media-Player.git
cd NeonLoop-Media-Player
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Build the web app
```bash
npm run build
```

### 5. Build Windows Executables locally
```bash
# Builds both Portable and Setup installer into the release/ directory
npm run build:electron
```

---

## 🚀 GitHub Actions Release Pipeline

The repository includes an automated GitHub Actions workflow (`.github/workflows/release-windows.yml`):
- **Manual Trigger on Demand:** Navigate to **Actions** → **Build & Release Windows App (Installer & Portable)** → **Run workflow**.
- **Automated Version Bumping:** Select `patch`, `minor`, `major`, or specify a custom version.
- **Two-Stage Reliable Build:**
  1. Fast frontend compilation on Ubuntu runner (`dist/`).
  2. Native Windows packaging (`electron-builder`) into `NeonLoop-Portable-v*.exe` and `NeonLoop-Setup-v*.exe`.
  3. Automatic publishing to **GitHub Releases** with release notes and downloadable `.exe` files.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it.

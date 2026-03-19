# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest V3) that automatically speeds up video playback during ads on streaming sites (Netflix, Amazon Prime) and allows manual playback speed control via keyboard shortcuts. No build step — plain JavaScript loaded directly by Chrome.

## Architecture

Two separate extensions in this repo:

### `adskipper/` — Ad Skipper (main)
- **manifest.json** — MV3 config with `storage`, `scripting`, and broad host permissions (`*://*/*`)
- **background.js** — Service worker that injects `content.js` into matching tabs based on user-configured site patterns stored in `chrome.storage.sync`. Contains `DEFAULT_CONFIG` with preset sites and selectors.
- **content.js** — Injected into streaming pages. Two responsibilities:
  1. **Ad detection**: `MutationObserver` + 500ms polling checks for ad-specific DOM elements, then sets `video.playbackRate` to `adSpeed` (mutes audio during ads). Reverts to `normalSpeed` when ads end.
  2. **Keyboard shortcuts**: `D` (+0.1x), `A` (-0.1x), `S` (reset to 1x) — adjusts `normalSpeed`, persists to storage, shows a toast overlay on the video. Disabled during ad playback and when focus is in input fields.
- **popup.html/js** — Settings UI for: sites (URL patterns + enable/disable), CSS selectors for ad detection, normal playback speed, ad playback speed. All persisted to `chrome.storage.sync`.

### Config shape (`chrome.storage.sync`)
```js
{ sites: [{ pattern, enabled }], selectors: [string], normalSpeed: number, adSpeed: number }
```
All components (background, content, popup) read/write this single `config` key. Content script listens for live changes via `chrome.storage.onChanged`.

### `observer/` — DOM Change Detector (dev tool)
- Standalone helper extension for discovering ad-related DOM elements on streaming sites
- Uses `MutationObserver` to log all DOM additions, removals, and attribute changes
- Use this to find new selectors when streaming sites change their DOM structure

## Development

No build, lint, or test commands. To develop:

1. Go to `chrome://extensions`, enable Developer Mode
2. "Load unpacked" → select `adskipper/` (or `observer/` for the dev tool)
3. After code changes, click the reload icon on the extension card

## Known Ad Selectors (Netflix)

- `.watch-video--adsInfo-container`
- `.watch-video--modular-ads-container`

These may change — use the `observer/` extension to discover new ones.

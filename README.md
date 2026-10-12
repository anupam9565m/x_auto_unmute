# X Auto Unmute

A Chrome extension that attempts to automatically unmute videos while browsing X (formerly Twitter).

## Features

- Detects videos dynamically loaded into the X feed.
- Attempts to unmute visible videos automatically.
- Includes a popup to enable or disable the feature.
- Saves user preferences with Chrome Storage.
- Supports X on `x.com` and `twitter.com`.

## Installation

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select the project folder containing `manifest.json`.
6. Open X and enable the extension from its popup.

## Limitations

X may change its video controls, and browser autoplay restrictions can prevent unmuted playback in some situations. Automatic unmuting is not guaranteed for every video.

## Tech Stack

- JavaScript
- Chrome Extension Manifest V3
- DOM APIs and MutationObserver
- Chrome Storage API

## License

See the repository's license file, if one is added.
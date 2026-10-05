# The Sunday Table — project notes

## What the project is
A family cookbook for turning voice memos and family contributions into a shared collection of recipes, photos, and stories.

## Work completed so far
- Started from the idea of turning Grandpa's voice memos into a family recipe book.
- Built a browser app with sample recipes and a cookbook-style interface.
- Added voice memo recording/upload with manual transcript or notes, recipe editing and memo links, family stories, photos, contributions, cookbook themes, and print/PDF support.
- Added a password-protected Node.js server for shared collection and media sync, revision conflict checks, and collection snapshots.
- Added Render service configuration and documentation for persistent storage and deployment setup.
- Added server tests for login, sync, conflict handling, media, and snapshots.
- Iterated on the automatic opening-book hero animation. Its cover alignment and motion still need final visual review; the latest local edits are included in this project.
- This Codex conversation is named **The Sunday Table** and pinned so the project process remains easy to find in chat.

## Current known limits
- Automatic speech transcription is deferred; transcripts are entered manually.
- Family access uses one shared passphrase, not separate family accounts.
- Hosting requires a persistent data disk and a configured `FAMILY_PASSWORD` secret. GitHub Pages alone cannot host the Node sync API.
- This local checkout currently has no commits and no configured `origin`; the GitHub repository previously created is https://github.com/pranay-1306/The-Sundaytable. The latest local animation edits may not be in that remote repository.

## Run and verify
Requires Node.js 20 or newer. From the extracted project folder:

```powershell
$env:FAMILY_PASSWORD = 'choose-a-long-family-passphrase'
$env:DATA_DIR = '.\data'
npm start
```

Open http://localhost:8787. Run `npm test` to execute the included server checks.

## Suggested next steps
1. Review the book-opening animation in a browser and make any final alignment and smoothness adjustments.
2. Reconnect this local checkout to the GitHub repository, commit the complete project, and push the current state.
3. Configure the host's password secret and persistent disk, deploy, then verify the live site and cross-device sync.
4. Consider automatic transcription and per-relative accounts as later features.

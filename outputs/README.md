# Sunday Table

A small family cookbook with voice memos, recipes, contributions, photos, and a shared private collection.

## Run locally with family sync

Requires Node.js 20 or newer. From this project folder in PowerShell:

```powershell
$env:FAMILY_PASSWORD = 'choose-a-family-passphrase-longer-than-15-characters'
$env:DATA_DIR = '.\data'
node server.js
```

Open `http://localhost:8787`. Family members connect from their own browser using the same passphrase. Do not put the passphrase in this repository. The server stores the shared collection and media in `DATA_DIR`, and keeps the 12 most recent prior collection snapshots in its `backups` subfolder. Keep `DATA_DIR` on persistent storage when hosting.

## Included

- Repeatable server checks: run `npm test` with Node.js 20 or newer.

- Record or add voice memos and write/paste transcripts.
- Link memos to editable recipes with ingredients, method, story, and optional photo.
- Add named family stories and photos.
- Customize the cookbook title, family name, dedication, and theme.
- Print the full cookbook or save it as a PDF from the browser.
- Connect with the family passphrase to sync changes and media between devices. New edits are checked against a collection revision so simultaneous changes are not silently overwritten.

## Important limits

Automatic audio transcription is not connected. Audio remains on-device until you connect family sync; after connecting, voice recordings and photos are uploaded to the configured family server. Add transcripts manually for now. The sample recipes and sample family stories are illustrative; check recipe amounts and replace the example stories with your family's own versions.

The family passphrase is shared by relatives, so share it only with people who should access the collection. Use a passphrase with at least 16 characters and keep the host's `DATA_DIR` persistent. If hosted without persistent storage, a service restart can erase the family collection. The browser also keeps a local copy for offline use, but the shared server is the sync source when connected.
## Deployment notes

This is now a Node web service, not a static-only site. `render.yaml` describes the service and its persistent data disk. GitHub can hold the source repository; GitHub Pages alone cannot run the sync API. Before creating the hosted service, set a strong `FAMILY_PASSWORD` in the host's secret settings. The app needs persistent storage mounted at `DATA_DIR` or stored collection/media will be lost when the service restarts. The Render persistent disk is a paid feature; check the current plan and disk cost before creating the service.

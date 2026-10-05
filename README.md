# Sunday Table

A family cookbook for saving voice memos, recipes, photos, and the stories behind them.

## Run locally

Requires Node.js 20 or newer.

PowerShell:

```powershell
$env:FAMILY_PASSWORD = 'choose-a-long-family-passphrase'
$env:DATA_DIR = '.\data'
npm start
```

Open http://localhost:8787. Keep the passphrase out of source control.

## Features

- Record or upload family voice memos and add transcripts or notes manually.
- Turn a memo into a recipe and link the recipe back to its recording.
- Save recipes, photos, family stories, and contributions.
- Customize the family book and print it or save it as a PDF.
- Optionally hide the demo content.
- Sync a shared collection and media across browsers with a family passphrase.
- Keep collection snapshots on the server's persistent data disk.

Automatic transcription and individual family accounts are not included. The shared collection uses one passphrase for all relatives. See [the app guide](outputs/README.md) for privacy, hosting, and deployment details.

## Verify

```sh
npm test
```

The test starts an isolated local server and checks login, state sync, conflict handling, media transfer, and snapshots.

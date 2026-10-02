# Sunday Table

A family recipe book that keeps voice memos, recipes, photos, and the stories behind them together.

## Features

- Record or upload voice memos and add transcripts or notes manually.
- Turn a memo into a recipe and link it back to the recording.
- Add family stories, photos, and recipe contributions.
- Customize book themes, hide demo content, and print or save the book as PDF.
- Optionally sync the collection and media across family browsers with a shared passphrase.

Automatic transcription and individual user accounts are not included. The family passphrase is shared by everyone with access.

## Run locally

Requires Node.js 20 or newer. In PowerShell, from the project folder:

$env:FAMILY_PASSWORD = 'choose-a-long-family-passphrase'
$env:DATA_DIR = '.\data'
npm start

Open http://localhost:8787. Keep the passphrase and data/ out of source control.

## Verify

Run npm test to exercise sign-in, collection sync, conflict handling, media transfer, and snapshots.

## Hosting

This app needs a Node host and persistent storage mounted at DATA_DIR. GitHub Pages cannot run the sync server. The Render blueprint is in render.yaml; configure FAMILY_PASSWORD as a host secret before deploying. See the app guide (outputs/README.md) for privacy and storage notes.

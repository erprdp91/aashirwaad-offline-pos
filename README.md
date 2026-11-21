# Aashirwaad POS — v4 deployment fix

This package is a static offline-first prototype. The visible header/footer now say v4, both camera buttons are explicitly visible, and the service worker cache is bumped to v4. Navigation uses network-first so a new GitHub Pages index can be picked up after deployment.

## GitHub Pages upload (important)
1. Open repository `aashirwaad-offline-pos` and select the branch/folder configured in Settings → Pages.
2. Upload the CONTENTS of this ZIP to that published root. `index.html`, `app.js`, `style.css`, `sw.js`, and `manifest.webmanifest` must sit directly in the root, not inside an extra `Aashirwaad_...` folder. Keep the `icons/` folder.
3. Replace existing files when GitHub asks. Commit changes.
4. Wait for Pages deployment to complete. Open the URL in Safari and refresh. Do not clear website data or delete local storage.
5. Confirm the header says `iPhone prototype v4` and footer says `Prototype v4`. Then open Products: the camera button should be directly below Barcode number. In Billing, it should be below the barcode entry row.

## Camera notes
Camera requires HTTPS and Safari camera permission. The scanner library is currently loaded from jsDelivr the first time, so first camera use requires internet. This prototype has not been physically tested on your iPhone.

## Data safety / limitations
Use dummy products and test bills only until the workflow is validated. Export a JSON backup before changing deployments. No production cloud sync, conflict handling, GST, returns, or complete purchase/supplier ledger is included.

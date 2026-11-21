# Aashirwaad Offline-First POS v2 — iPhone-first prototype

## Added in v2
- Product creation with barcode, name, selling price, purchase cost, opening stock and expiry date.
- Add products to billing by barcode typed or scanned by a USB/Bluetooth scanner in keyboard-wedge mode.
- Camera barcode scan button on BOTH Billing and Add Product screens.
- Camera scanning uses ZXing fallback for iPhone Safari, rather than relying only on BarcodeDetector.
- Quick item billing, quantity controls, offline sale saving and stock decrement.
- WhatsApp bill text via wa.me share link.
- 58mm receipt print layout using browser print.
- Local IndexedDB, offline app shell, pending event queue and JSON backup.

## Important limitations
This remains a prototype, not production-ready. Cloudflare Worker/D1 server and bidirectional sync are not included yet. The current client sync code is only an upload stub expecting `/sync`; it does not download cloud changes to another device. Do not configure a live endpoint until server implementation is deployed and tested.

Camera barcode scanning needs HTTPS, camera permission, and the ZXing scanner library. The library is loaded from jsDelivr the first time; connect to the internet for the first camera scan so the browser can cache it. Then test offline camera scanning separately. iPhone Safari must allow camera access. If scanning still fails, use a Bluetooth/USB scanner in keyboard mode or enter the barcode manually. This code has not been verified on the user’s exact iPhone/iOS version or camera hardware. WhatsApp opens a pre-filled text bill; it does not automatically send it. User must press Send. Printing opens the browser print dialog; iPhone Bluetooth printer compatibility depends on printer/app support and must be tested with the BT-58D.

No GST engine, returns, purchase entry, full customer/supplier ledger, staff accounts, audit trail or robust conflict resolution yet. Use dummy data only until QA is complete.

## iPhone
Host on HTTPS, open in Safari, Share → Add to Home Screen. A ZIP cannot be installed directly as an iPhone app. Service worker/offline support requires HTTPS (except localhost).

## Windows later
Open the same HTTPS URL in Edge/Chrome and install as an app. Device databases remain separate until bidirectional sync is implemented.

## Upgrade from v2 to v3
Upload and replace `index.html`, `app.js`, `style.css`, `sw.js`, and `README.md` in the existing GitHub repository. Keep the existing `icons/` folder and `manifest.webmanifest`. Do not delete browser website data or clear Safari storage; local IndexedDB records should remain on the same site origin. After GitHub Pages deploys, open the site in Safari, refresh it, and if the old version remains, close the installed app and reopen the URL after a short wait for the service worker update.

The first camera scan needs internet to download the ZXing library from jsDelivr. The service worker attempts to cache it for later.

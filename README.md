# Aashirwaad POS v5 — Product database + bulk import

This is a static offline-first prototype built on the v4 file set. It keeps the same IndexedDB database name (`aashirwaad_offline_pos`) and upgrades the schema version without deleting existing products or sales.

## New features
- Product Add barcode lookup: local inventory first, then Open Food Facts API when online.
- Auto-fills available product name, brand, category and pack size. MRP may be absent. Selling price, purchase cost and stock remain the shop's responsibility.
- Saves product details locally so subsequent barcode lookups work offline.
- Bulk CSV import (built-in parser) and Excel `.xlsx`/`.xls` import (SheetJS loaded from CDN on demand).
- CSV template download and product CSV export.
- Duplicate barcode handling: skip or update; blank incoming values preserve existing values.
- Existing sales, products, outbox and settings remain in the same IndexedDB database.
- Service worker cache version bumped to v5.

## Deploy
1. Export a JSON backup from current POS Settings before changing files.
2. Extract this ZIP.
3. Upload the CONTENTS (not the outer folder) to the GitHub Pages publishing root, replacing `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`; keep `icons/`.
4. Commit and wait for GitHub Pages deployment.
5. Open the existing Pages URL. Header/footer should say v5. Do not clear Safari website data.

## Product lookup behaviour
- Existing local product barcode wins.
- If not found and online, request `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`.
- Only available public metadata is populated. Not every Indian grocery barcode is listed; there is no guarantee of full coverage.
- The online API is not bundled as a complete offline catalogue. A product becomes available offline after a successful lookup and local save.
- Verify name, brand and pack size before saving. Enter MRP, selling price, purchase cost, stock and expiry based on your supplier/physical pack.

## Bulk import columns
Accepted header aliases include Barcode/EAN/UPC, Product Name/Name/Item Name, Brand, Category, Pack Size/Quantity, MRP, Selling Price/Price, Purchase Price/Cost, Opening Stock/Stock, Expiry/Expiry Date. Barcode and product name are strongly recommended.

## Important limitations
- This is still a prototype. It has not been tested on the user's actual iPhone/browser or a real supplier file.
- Excel reader and camera scanner libraries load from a CDN when needed; first use requires internet. CSV import is built in.
- The Open Food Facts database is community-contributed and incomplete; MRP may be missing or outdated.
- No automatic bulk download of all Indian grocery products is included. Do not scrape/download a huge catalogue through individual API calls.
- Do not use for live shop billing until the user tests on dummy data and verifies backup/restore. No full cloud bidirectional sync or conflict resolution is implemented.

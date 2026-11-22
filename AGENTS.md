# ShopLedger Agent Guide

## Stack
- Node.js CommonJS application (`server.js`); Express 4 and `body-parser` provide the HTTP server and JSON request parsing.
- Browser UI is static HTML, CSS, and JavaScript in `public/`, served by Express.
- Application data is persisted as JSON in `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, placement, lookup, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon lookup, validation, listing, and discount calculation.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock checks, stock changes, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata debits/reversals, and settlement records.
- `lib/orders.js` — order creation, lookup, cancellation, and filtering.
- `lib/pricing.js` — subtotal, coupon discount delegation, and checkout totals.
- `lib/reports.js` — dashboard summary and invoice-versus-ledger GST reconciliation.
- `lib/store.js` — JSON database read/write, structure defaults, and audit log updates.
- `lib/tax.js` — GST rate resolution and CGST/SGST splitting.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the package's `npm test` script is currently a placeholder).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).

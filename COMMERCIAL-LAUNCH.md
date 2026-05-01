# Commercial Launch Plan

## Product

Sell this as a hosted no-login PWA for UK VAT invoice creation. Buyers open the hosted link, add it to their phone home screen, save drafts locally, and export PDF invoices on their own device.

## Recommended Price

- One-time access: GBP 19.99
- Optional future Pro version: GBP 49-99 with client history, recurring invoices, and backup/export.

## Deployment

### Netlify

1. Create a new Netlify site.
2. Drag this folder into Netlify Drop, or connect a Git repository.
3. Netlify reads `netlify.toml`; publish directory is the project root.
4. Test `https://your-site.netlify.app` on mobile.
5. Use the browser menu to add it to the home screen.

### Vercel

1. Import the project folder into Vercel.
2. Framework preset: Other / Static.
3. No build command needed.
4. Output directory: project root.

## Gumroad Fulfilment

1. Create a Gumroad product named `UK VAT Invoice Generator`.
2. Price it at GBP 19.99.
3. In the purchase confirmation email, include the hosted app URL.
4. Include a short note: `No login required. Your data is saved locally in your browser. Use Export PDF to save invoices.`
5. Add a support email and refund policy.

## Safer Compliance Wording

Use: `Includes common UK VAT invoice fields and MTD-friendly wording. Please confirm suitability with your accountant.`

Avoid: `HMRC guaranteed compliant.`

## Buyer Workflow

1. Open hosted app link.
2. Add to home screen on mobile.
3. Enter company and client details.
4. Upload logo.
5. Save draft locally.
6. Export PDF and send it to the customer.

## Privacy Positioning

No account, no server database, no invoice upload. Drafts stay in the buyer's browser storage, and PDFs are generated locally on the device.

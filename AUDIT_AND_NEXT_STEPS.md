# JASTIP code audit and next steps

## Changes made

- Added explicit loading failure, empty-catalog, and empty-category states to `src/pages/Products.jsx`. The Shop page no longer looks like a broken blank page when the API returns an error or an empty array.
- Normalized `VITE_API_URL` by removing a trailing slash in the customer frontend and backoffice, avoiding malformed URLs when the environment variable ends with `/`.
- Improved `/api/health`: it checks the Supabase REST connection when configured and reports which storage mode is active, configuration warnings, and default admin credential warnings.
- Improved Supabase error parsing so non-JSON error responses still return a useful message.
- Added backend validation for product title, base price, stock, and rating before uploading the image.
- Removed prefilled `admin`/`admin` credentials from the backoffice login form.
- Added `.env` ignore rules to help prevent accidentally committing secrets.
- Updated deployment documentation with verification steps and the known transaction-storage limitation.

## Deploy configuration

### Koyeb backend environment variables

Set these in the Koyeb service settings (do not commit real values):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN`
- `CORS_ORIGIN` (use `*` temporarily for testing, or restrict it to the deployed Vercel origin(s))

Use the Koyeb-provided `PORT` if required by the service; the server reads `process.env.PORT` and defaults to 4000 locally.

### Supabase

Run `supabase/schema.sql` in the correct Supabase project's SQL Editor. Then verify the `products` and `settings` tables exist. The schema creates the tables but does not insert sample products.

### Cloudinary

Set the Cloudinary cloud name and unsigned upload preset in Koyeb. Restrict the preset's allowed formats, file size, and folder from Cloudinary settings where available. Never put the Cloudinary API secret or Supabase service-role key in frontend environment variables.

### Vercel customer frontend and backoffice

Set `VITE_API_URL` to the public Koyeb backend URL in both Vercel projects, without a trailing slash. Redeploy both projects after changing this value because Vite embeds it at build time.

### Verify

1. Open `https://YOUR-KOYEB-URL/api/health`.
2. Confirm `ok: true`, `database: "supabase"`, `databaseStatus: "connected"`, and `imageStorage: "cloudinary"`.
3. Confirm `warnings` is empty. Do not treat local JSON/local uploads as production storage.
4. Open `/api/products`. It should return a JSON array. An empty array means the API is responding but there are no product rows in the connected Supabase database.
5. Test admin login, upload a product, verify its row in Supabase, then confirm the product appears on the customer frontend.

## Known limitation not silently changed

Checkout/payment is currently a simulated demo. Transaction history is stored in browser `localStorage`, not Supabase. It is not shared across browsers/devices and should not be considered a production payment/order system. Persistent orders need an `orders`/`order_items` schema and backend API, plus payment-provider integration if real payments are required.

## Local test

From the project root:

```bash
npm install
npm run backend
```

In another terminal:

```bash
npm run dev
```

Open `http://localhost:5173/api/health` only if Vite proxy is configured; otherwise open the backend directly at `http://localhost:4000/api/health` and the frontend at `http://localhost:5173/products`.

To use local JSON mode, leave the Supabase and Cloudinary environment variables unset. This is for local development only.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.


## Order Management (added)

- Storefront checkout requires a payment-proof image (JPG/PNG/WebP, up to 5 MB) and submits the order to the backend.
- Backoffice shows incoming orders and a pending-review notification count. Admins can inspect the payment proof, customer contact/address, items, and total.
- Order lifecycle: `PROCESSING` → `APPROVED` → `PURCHASED` → `DELIVERED`. Admin can instead `REJECT` a pending order with a required reason.
- Storefront checkout status, My Jastip, and Transaction History poll the backend to reflect status changes.
- Local development stores orders in `backend/data/orders.json`. For Supabase, run the updated `supabase/schema.sql` in the SQL Editor to create the `orders` table.
- Payment is still a prototype simulation. The uploaded proof is reviewed manually; this does not verify a bank transfer automatically.

### Start locally

Install dependencies for your OS with `npm install`, then run these in separate terminals:

```bash
npm run backend
npm run dev
npm run backoffice
```

Keep your existing local `.env` file private and preserve its working values when copying the updated project. `.env.example` is a template only.

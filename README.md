# MultiVend — Frontend

Multi-tenant store management SaaS frontend. Store owners sign up, create a branded storefront, and manage products; shoppers browse, add to cart, and check out; a platform admin views orders and revenue across every store.

**Live app:** https://multivend-frontend.vercel.app
**Backend API:** https://multivend-backend-zjf3.onrender.com
**Backend repo:** https://github.com/divyeshwaghelaworks-del/multivend-backend

> Note: the backend is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. The first request after idle can take 30–50 seconds while the server wakes up — this is expected, not a bug. If a page looks stuck loading right after opening the live app, that's why.

## Tech stack

- Next.js (App Router)
- Tailwind CSS
- Axios (with a request interceptor that auto-attaches the JWT from `localStorage`)

## Setup

1. Clone the repo and install dependencies:
```bash
   git clone https://github.com/divyeshwaghelaworks-del/multivend-frontend.git
   cd multivend-frontend
   npm install
```

2. Create a `.env.local` file in the root with:

(Use the live backend URL instead if you don't want to run the backend locally: `https://multivend-backend-zjf3.onrender.com/api`)

3. Start the dev server:
```bash
   npm run dev
```

The app will be running at `http://localhost:3000`.

## Demo credentials

| Role | Email | Password | Store |
|------|-------|----------|-------|
| Admin | test@example.com | password123 | Acme Corp (`/store/acme-corp`) |

Log in with this account at `/login` to see the CRM dashboard, or visit any `/store/[slug]` page directly without logging in.

## Pages

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing page | Public |
| `/signup` | Store owner signup | Public |
| `/login` | Login (redirects to `/crm` for admins, `/dashboard` for owners) | Public |
| `/dashboard` | Owner dashboard — create/view store, manage products, view own orders | Owner (protected) |
| `/store/[slug]` | Public storefront — branding, product grid, search/filter, product detail, cart, checkout | Public |
| `/crm` | Platform admin dashboard — all orders, revenue by store, filter by store | Admin only (protected) |

## Multi-tenancy on the frontend

The same `/store/[slug]` page template is reused for every store — the slug in the URL determines which store's branding and products get fetched and rendered. No two stores share data on this page since every API call is scoped by that slug, and the backend independently double-checks tenant ownership server-side.

Route protection (`/dashboard`, `/crm`) is currently done client-side: on mount, each page checks for a valid token and role in `localStorage` and redirects if missing/incorrect. The actual data protection is enforced server-side regardless — every protected API call independently checks the JWT and, for CRM routes, the user's role — so even if someone bypassed the client-side redirect, they couldn't retrieve another tenant's data.

## Trade-offs & what I'd improve with more time

- Client-side auth guards (see above) work but aren't as robust as a proper middleware-based check — would move to Next.js middleware for route protection given more time.
- No image upload UI — product images are added via a plain URL field rather than a file picker with Cloudinary/S3 upload.
- No pagination on product grids or order tables yet.
- No loading skeletons — currently just plain "Loading..." text in a few places.
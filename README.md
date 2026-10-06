# SPOTX Partner Platform — Frontend

One React (Vite) web app for everyone who uses the platform: partners of all four types (**Influencer, Affiliate, Vendor, Reseller**), SPOTX admins, vendor customers and reseller customers. Deployed on **Vercel**. This is its own repository; the API it talks to is a separate repository, deployed on Render.

## Structure

```text
.
└─ src/
   ├─ pages/          landing, sign-in / sign-up, and the partner, admin and customer pages
   ├─ layouts/        one shell per signed-in role (partner, admin, customer)
   ├─ components/     shared UI (ui/), partner pieces, admin pieces
   ├─ context/        partner / admin / customer sessions
   ├─ services/       API clients — all read the same `VITE_API_URL`
   ├─ data/           countries, dial codes, Indian states and cities
   └─ utils/
```

## How each partner type works

There is one app, not one per partner type. The type a partner picks at sign-up decides their menu and which pages open; the API enforces the same rules.

### Every partner

1. **Sign up** at `/partner/register`: pick a type, verify the email with a 6-digit code, set a password.
2. **Profile** (`/partner/profile`): business or creator name and address.
3. **Documents** (`/partner/documents`): upload the KYC documents marked as required for their type. GST and MSME certificates are required for Vendor and Reseller, shown as optional for Affiliate, and not shown at all for Influencer. Only the documents are left out for an Influencer; GST on their payouts works the same as for everyone else.
4. **Bank Account** (`/partner/bank`): enter the account, then pay ₹1 to prove it.
5. SPOTX reviews the documents and bank account. Until then, pages that need verification show a lock.

Once verified, every type also has **Dashboard**, **Team** (invite teammates with a role), **Notifications**, and their **agreement** under Documents.

**Search:** every list in the partner panel has a search box — Deals, earnings, Customers, Post / Reel, Team, Notifications, Settlements, and the reseller's customers, orders, invoices and inventory. It matches any word against everything in a row (names, emails, phone numbers, amounts, statuses, references). `components/ui/Table` takes a `searchable` prop; card-style lists use `components/ui/SearchBox` with `utils/searchRows`.

**Notifications** cover whatever that partner type works with — leads for an Affiliate, social accounts and posts / reels for an Influencer, customers for a Vendor, licenses and invoices for a Reseller, plus earnings and settlements for the types that get paid. The bell refreshes on every page change and once a minute. Clicking a notification marks it read and opens the page it is about (`utils/notificationLink.js` holds that mapping).

### Influencer

| Page | What they do there |
| --- | --- |
| Social Media Accounts (`/partner/social-media`) | Add an Instagram, Facebook or YouTube account, by connecting it or entering it. SPOTX verifies it and sets a price per post and per reel. |
| Post / Reel (`/partner/post-reel`) | Submit the link to a published post or reel from a verified account; see whether it was approved. |
| Content Earnings (`/partner/commissions`) | One earning per approved post or reel, at that account's rate. |
| Settlements (`/partner/settlements`) | Payouts of those earnings. |

### Affiliate

| Page | What they do there |
| --- | --- |
| Deals (`/partner/deals`) | Submit a lead — the customer's company and number of screens — and follow its status: new, contacted, won or rejected. SPOTX's team closes the deal. |
| Referral Rewards (`/partner/commissions`) | The reward SPOTX set for each won deal. |
| Settlements (`/partner/settlements`) | Payouts of those rewards. |

### Vendor

| Page | What they do there |
| --- | --- |
| Customers (`/partner/customers`) | Register a customer directly, or copy the referral code / link for customers to register themselves. See each customer's trial and subscription. |
| Customer Commissions (`/partner/commissions`) | Commission earned each time one of their customers pays. |
| Settlements (`/partner/settlements`) | Payouts. A vendor uploads a GST bill for each settlement before it can be paid. An influencer or affiliate who is GST-registered can do the same (bill + GSTIN, no GST certificate) and GST is added to the payout. |

A vendor's customers use their own panel at `/customer/*`: add screens, choose a plan and pay for a subscription, and see their invoices under Billing.

### Reseller

A reseller buys licenses from SPOTX instead of earning commission, so it has no earnings or settlements pages.

| Page | What they do there |
| --- | --- |
| Billing & Payments (`/partner/reseller/billing`) | Pay the one-time prepayment SPOTX sets up first, then invoices. Each purchase is shown as its own bill: price per month, the 12-month total, and every instalment with its date, amount and status. |
| Buy More Licenses (`/partner/reseller/buy`) | Request licenses at their agreed price. SPOTX approves the request, and that purchase becomes a new bill with its own billing cycle from that day. |
| Software Licenses (`/partner/reseller/inventory`) | Licenses purchased, allocated and in use, with the history. |
| Customers (`/partner/reseller/customers`) | Add customers or share the registration link, and allocate licenses to each. Release, suspend, reactivate or cancel an allocation. |

A reseller's customers use their own portal at `/reseller/customer/*`: verify their email, then register screens up to the number allocated to them. They never see pricing or billing.

### Admin

One panel at `/admin` for all four types.

The menu is defined in one place, `src/layouts/adminNav.js`. A menu's sub-menu is shown only after that menu is clicked, and only one is open at a time.

| Menu | What it is for |
| --- | --- |
| Dashboard | Live figures from the real records, refreshed on their own: money coming in by partner type (Reseller, Vendor, Affiliate), commission going out (Vendor, Affiliate, Influencer), two bar graphs whose bars show the details on hover or tap, "Business Gain" and "Business Paid" breakdowns, and partner counts (by type, active, verified, KYC pending, bank pending, rejected, suspended). |
| Notifications | Every notification for admins, from all four partner types. |
| Partners → All Partners | Every partner of every type. **Create Partner is here and nowhere else.** |
| Partners → Influencer | Overview, Post / Reel Approval, Account Approval, Influencers, Influencer Agreement (the template). |
| Partners → Reseller | Overview, Licences & Billing (licence requests, pricing, billing, inventory), Customers, Resellers. |
| Partners → Affiliate | Overview, Leads (mark contacted, won with the reward, or rejected), Affiliates. |
| Partners → Vendor | Overview, Customers (record a payment, cancel or expire a subscription), Vendors. |
| Commission | All Commission, then Influencer, Affiliate and Vendor each on their own. Approve an earning here and it appears under Settlement by itself. A Reseller earns no commission, so it has no entry. |
| Payment from Licence | What Resellers pay SPOTX: their licence invoices, with offline payments recorded here. |
| Settlement | All Settlements, then Influencer, Affiliate and Vendor each on their own. There is no "create settlement" step; mark a settlement paid here. Refreshes on its own. |
| KYC Review, Bank Review | Verify documents and bank accounts. Approving the last one activates the partner. Reseller bank-change requests are approved here. |
| Commission & Pricing | Programs, tiers, commission rules and screen prices. |

**A type's Overview** (`/admin/overview/<type>`) shows what is waiting on SPOTX for that type, its partner counts, the figures that matter for it, and its newest partners.

**Opening one partner** (from All Partners or a type's list) shows everything about it in tabs. It opens on **Overview** (account, KYC, bank and that partner's own figures); then Details, KYC & Bank, Team and Activity for every type; Post / Reel Approval and Account Approval for an Influencer (that influencer's own queues); Leads for an Affiliate; and earnings, Settlements and Payout Settings for the types that get paid.

**Agreement names** follow the type everywhere they are shown: Influencer Agreement, Affiliate Referral Agreement, Vendor Commission Agreement, Reseller Licence Purchase Agreement (`src/utils/agreementName.js`).

## Search and filters

Every list in the app can be searched and filtered, and it is built in rather than added page by page:

- `components/ui/Table.jsx` — every table has a search box above it. A column that sets `filter: (row) => value` also gets a pick-list of that column's values (status, type, role, plan and so on).
- `hooks/useListFilter.js` + `components/ui/ListToolbar.jsx` — the same search and pick-lists for lists that are not tables (notifications, social accounts, post / reel review, activity, screens, invoices).

Search matches anything in a row, including the linked partner's name, code and email. Pick-lists only offer values that are actually in the list, and nothing is drawn while a list is empty. A page that already has its own search and filters above the table (Partners, Settlements, Payment from Licence, Reseller Customers) passes `searchable={false}`.

## Shared form fields

Use these everywhere instead of building a field by hand:

- `components/ui/PasswordInput` — every password field, with the show / hide (eye) button.
- `components/ui/PhoneInput` — every phone / contact number, with a country-code picker. The value is one string, e.g. `+91 9876543210`.
- `components/ui/AddressFields` — country and state picked from a list, city from a list for India, and a 6-digit Indian pincode fills in state and city.
- `components/ui/Input` — `Input` and `Select`, with the label tied to the field.

## Setup

Requirements: Node.js 22.12+.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The app opens on `http://localhost:5173`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | The backend's address, ending in `/api` — e.g. `http://localhost:5000/api` locally, `https://<your-render-service>/api` in production |

It is read at build time, so change it and rebuild (or redeploy) for it to take effect.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Deploying to Vercel

1. Import this repository in Vercel (leave Root Directory empty). Vercel detects Vite; `vercel.json` adds the rewrite that lets page addresses like `/partner/dashboard` load directly.
2. Set `VITE_API_URL` to the Render API address ending in `/api`.
3. On the backend, add this site's address to `CLIENT_URL` and `CLIENT_URLS`, otherwise the browser will block its API calls and emailed links will point at the wrong place.

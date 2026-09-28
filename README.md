# InstaSafe

Payment protection for social commerce: a marketing site, a vendor workspace, a
rider portal, a public buyer tracker, and a super-admin operations console —
against the deployed InstaSafe API.

The marketing site is one surface of the product. The money-moving parts are
vendor order management, rider delivery confirmation, a shareable buyer tracking
link, and admin moderation.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Motion
- Phosphor Icons

## Run locally

Port 3000 was already occupied on this machine, so the current development server uses port 3001.

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open [http://localhost:3001](http://localhost:3001).

## Routes

- `/` — product landing page
- `/login` — vendor login (password, or WhatsApp recovery code)
- `/signup` — vendor onboarding: profile → email verification → payout account
- `/dashboard` — order control room: escrow totals, what needs a decision
- `/dashboard/orders` — filterable order history with pagination
- `/dashboard/orders/new` — create a protected order
- `/dashboard/orders/[id]` — items, timeline, and the money actions
- `/dashboard/profile` — business name, WhatsApp number, pause/resume selling
- `/dispatch` — rider portal: deliveries assigned to your number
- `/login?as=rider` — rider sign-in (phone + WhatsApp code, no password); `/dispatch/login` deep-links the same screen
- `/track` — public order tracking for buyers, keyed by `IS-XXXXXX` number, order id or payment reference

Super-admin console (`[Authorize(Roles="admin")]`, reached by signing in with
the admin email on the same `/login` form):

- `/admin` — held GMV, released today, open disputes/drafts, and payment-plumbing health
- `/admin/disputes` — the dispute queue, oldest first, with release/refund inline
- `/admin/orders` — every order on the platform, status filter applied server-side
- `/admin/orders/[id]` — moderation workspace: refund, resolve dispute, force-release with a note
- `/admin/vendors` — search by name/phone/email, deactivate/reactivate, replace a number
- `/admin/dispatchers` — riders, activate/deactivate
- `/admin/chats` — WhatsApp audit transcript, filtered by phone and date range
- `/admin/webhooks` — Paystack deliveries by signature validity, plus outbox backlog and errors
- `/admin/audit` — the moderation log, filterable by action

## Entry points by audience

Three different people arrive here, so each gets a door instead of guessing:

| Audience | Route | Where it is linked |
| --- | --- | --- |
| Vendor | `/signup`, `/login` | Header buttons (desktop + mobile menu) |
| Rider | `/login?as=rider` | Header mobile menu, hero, footer, vendor signup page |
| Buyer | `/track` | Sticky header "Track order", hero, footer, sign-in footers |

### One sign-in page, two roles

`/login` carries a role switcher (**I'm a vendor** / **I'm a rider**) above the
form rather than a separate "choose your role" page — a chooser page would add a
click for every vendor, who are the primary audience.

- Both forms stay mounted and the inactive one is `hidden`, so switching roles
  mid-entry keeps a half-typed email or a code that just arrived.
- The eyebrow, heading, description and footer copy all follow the role.
- `/dispatch/login` renders the *same* screen with the rider tab preselected, so
  the dispatch link a rider taps in a text still works and there is one sign-in
  implementation rather than two that can drift apart.
- Vendor and rider sessions remain separate httpOnly cookies, so one browser can
  hold both without confusion.

There is deliberately **no `beforeunload` guard on the sign-in forms**: the
browser's generic "Leave site?" dialog fired as soon as anyone typed, including
when they only wanted to switch to the rider tab.

### The buyer link in the vendor's message

`paystackAuthUrl` points at **Paystack's** domain, so the InstaSafe tracking link
cannot be injected into it. Instead the order page builds the buyer link itself
and the vendor pastes it into the same WhatsApp message:

```
{origin}/track?ref=IS-8K4N2Q
```

That URL is assembled on the server from the request host (`src/lib/url.ts`), so
it is correct in dev, on a preview deployment and in production without a
build-time env var. The order page offers **Share tracking link** (OS share sheet
on mobile, clipboard elsewhere) and **Copy link**, with the URL shown underneath
so it can still be selected by hand if the clipboard is blocked.

The `ref` is the customer-facing `IS-XXXXXX` number, not the Paystack reference —
it is what a buyer can read back over the phone, and the tracker accepts it in any
case.

## Dashboard architecture

The dashboard is built from **Server Components and Server Actions**. It reads the
same httpOnly `instasafe_vendor_token` cookie and calls the backend directly, so
the JWT never reaches the browser and there are no extra client-side proxy hops
for reads. Only the interactive pieces (forms, confirmations, copy buttons) are
client components.

`src/app/dashboard/layout.tsx` is the single gate:

- no cookie → `/login`
- `401` from the profile fetch → `/login`
- any other failure → a "we could not reach InstaSafe" panel, because a network
  blip must not look like being logged out
- `!emailVerified` → `/signup?step=verify`
- `!onboardingCompleted` → `/signup?step=payout`

### Endpoints used

| Purpose | Call |
| --- | --- |
| Current vendor | `GET /api/vendors` |
| Create order | `POST /api/orders` |
| Order history | `GET /api/orders?page=&pageSize=` |
| One order | `GET /api/orders/{id}` |
| Public tracker events | `GET /api/orders/by-reference/{ref}/timeline` |
| Refund | `POST /api/orders/{id}/refund` |
| Resolve dispute | `POST /api/orders/{id}/resolve-dispute` |
| Bank-transfer account | `POST /api/orders/{id}/request-bank-transfer` |
| Rename business | `PUT /api/vendors/{id}` |
| Correct WhatsApp number | `PUT /api/vendors/{id}/phone` |
| Pause / resume selling | `POST /api/vendors/{id}/deactivate` / `reactivate` |

### Rider portal (separate principal)

Riders have no accounts. `POST /api/dispatch/request-code` works for any phone and
the backend creates the rider row on first use. The rider token lives in its own
httpOnly cookie, `instasafe_dispatch_token`, so a signed-in vendor is never
mistaken for a signed-in rider.

| Purpose | Call |
| --- | --- |
| Text a login code | `POST /api/dispatch/request-code` (public) |
| Exchange the code for a JWT | `POST /api/dispatch/verify-code` (public) |
| My Held + Delivered deliveries | `GET /api/dispatch/assigned?page=&pageSize=` |
| Confirm with the buyer's code | `POST /api/dispatch/orders/{id}/confirm` |

There is no per-order GET for riders, so the detail page proves ownership by
finding the order inside the rider's own assigned list.

### Buyer tracking (public, no token)

The order reference is the credential here, so `/track` is deliberately
unauthenticated. Contact details are masked because the link is shareable.

| Purpose | Call |
| --- | --- |
| Order facts | `GET /api/orders/by-reference/{ref}` |
| Tracker stepper | `GET /api/orders/by-reference/{ref}/timeline` |
| Release (digital goods) | `POST /api/orders/{id}/confirm-satisfaction` |
| Freeze funds | `POST /api/orders/{id}/dispute` |
| Release (no rider assigned) | `POST /api/orders/{id}/verify-otp` |

Which actions appear follows the guide: satisfaction only for digital goods,
dispute only while money is in escrow (`Held`/`Delivered`), and the OTP box is
**hidden when a rider is assigned**, because the guide requires rider-fulfilment
orders to be confirmed in the dispatch portal.

### Contract details worth knowing

- **The API mixes response serializers.** Most endpoints answer camelCase
  (`success`/`message`/`data`/`errors`) or ASP.NET `problem+json`, but the three
  guest order endpoints (`confirm-satisfaction`, `dispute`, `verify-otp`) answer
  with **PascalCase** (`Success`/`Message`/`Data`/`Errors`).
  `instasafe-server.ts` folds the PascalCase keys into the canonical shape at the
  parse boundary — without that, a PascalCase `{"Success": false}` parses to
  `success: undefined` and a 200 response reads as a success.
- **Those three endpoints are currently broken server-side.** With a well-formed
  GUID in the path they all answer `400 "'Order Id' must not be empty."`, which
  means the route parameter is not being bound. The UI is built to the documented
  contract and reports this specific failure plainly rather than showing raw
  text. Worth raising with whoever owns that controller.
- **Enums arrive as integers.** `OrderStatus` is `0 Draft, 1 AwaitingPayment,
  2 Held, 3 Released, 4 Refunded, 5 Disputed, 6 Cancelled, 7 Delivered`.
  `Delivered` is 7 because it was appended to the enum after the original set
  shipped, so it is *not* in lifecycle order. `src/lib/order-status.ts` decodes
  both numbers and strings so a future string-enum converter cannot break the UI.
- **`401` is overloaded.** It means both an invalid bearer token *and* a wrong
  login/OTP code, so each caller supplies its own wording — a rider entering a bad
  login code is told the code is wrong, not that their session lapsed.
- **Order lists are bare arrays** with no total count. The client passes
  `page`/`pageSize` and, if the response comes back larger than one page,
  paginates locally instead of assuming the server did it.
- **Amounts are kobo** in DTOs and naira on create. Conversion happens only at the
  formatting boundary, via `src/lib/money.ts`.
- **`401` responses have an empty body**, so the client surfaces its own message.
- **Ownership is server-enforced.** A wrong-owner id returns `403`, which the UI
  reports as "that record belongs to another vendor".
- **`POST /api/dispatch/request-code` does not validate Nigerian phone format**,
  unlike the vendor endpoints — it accepted `123`. The client validates anyway so
  riders get a clear error instead of junk dispatcher rows.

### The `IS-XXXXXX` order number

`OrderDto.orderNumber` is the buyer-facing identifier, and the contract is
explicit that it is what a person should read. Six characters from an
unambiguous alphabet, so it survives being read aloud over the phone or typed
from a WhatsApp bubble.

- `orderNumber()` in `src/lib/types.ts` is the single place that decides what to
  print, falling back to the Paystack reference and then the raw id so an order
  created before the field existed still renders something sensible.
- It headlines the order detail page, the tracker, the vendor order list, the
  overview's recent-orders rows, and the rider list and detail pages.
- The tracker accepts the id, the number in **any** case, or the Paystack
  reference — `GET /api/orders/by-reference/{ref}` resolves all three.
- The share link the vendor pastes into their message is built server-side from
  the request host (`src/lib/url.ts`) and uses the number:
  `/track?ref=IS-8K4N2Q`, not a Paystack reference.
- `paystackReference` is still shown, but demoted to a **Payment ref** row so the
  two identifiers are never confused.

### Driver payout details are per order

Riders hold no stored bank details, so the create form asks for the rider's
phone, account number and bank **on every dispatch order**. Partial input is
rejected with an explanation rather than silently sent and bounced by the API:

> Give the rider's phone, account number and bank together — riders have no saved payout details.

The bank dropdown is the same deduped `/api/payments/banks` list the payout step
uses, with a free-text code fallback if that call fails.

## Admin console

The super-admin authenticates through `POST /api/auth/vendor/login` — the same
endpoint as a vendor — so the login proxy files the token under a **third**
cookie, `instasafe_admin_token`, rather than the vendor cookie. An admin session
can then never be mistaken for a vendor one, which matters because
`GET /api/vendors` answers `403` for an admin token.

The role claim in the login response routes the browser: `role !== "vendor"`
goes to `/${role}`. An admin login returns `vendor: null`, so branching on the
vendor flags would have sent the super-admin into onboarding.

**The cookie is not the authority.** It only proves that some InstaSafe session
exists. `src/app/admin/layout.tsx` proves the *role* by calling
`GET /api/admin/stats`, which is `[Authorize(Roles="admin")]`:

| Response | Meaning | What the user sees |
| --- | --- | --- |
| `401` | token missing or lapsed | redirect to `/login` |
| `403` | valid session, wrong role | "This account is not a super-admin" |
| other error | partial outage | retry link, session left intact |

This was tested by planting a vendor JWT in the admin cookie: the console
refused with the 403 notice rather than rendering or crashing.

Logging out clears all three session cookies, so a stray admin token cannot
survive on a shared machine.

Endpoint coverage — all 18 `/api/admin/*` routes are used:

| Screen | Endpoints |
| --- | --- |
| Overview | `stats`, `disputes`, `outbox`, `webhooks` |
| Disputes | `disputes`, `orders/{id}/resolve-dispute` |
| Orders | `orders`, `orders/{id}`, `orders/{id}/refund`, `/resolve-dispute`, `/force-release` |
| Vendors | `vendors?q=`, `vendors/{id}/deactivate|reactivate`, `vendors/{id}/phone` |
| Riders | `dispatchers`, `dispatchers/{id}/deactivate|reactivate` |
| Messages | `chats?phone=&from=&to=` |
| Webhooks | `webhooks?provider=&event=&validOnly=`, `outbox` |
| Audit | `audit?action=` |

Moderation controls are gated on the order's state so an operator is never
offered an action the API will answer `409` to: refund appears only on
`Held`/`Delivered`, dispute resolution only on `Disputed`, force-release only on
`Held`/`Delivered`/`Disputed`. Force-release requires a note (min 5 characters),
which the backend stores on the audit record — that is the record of who released
what, and why.

### Frontend bugs this surfaced

- **Geist has a broken naira glyph.** `₦` measures ~0.2em in Geist versus ~0.6em in
  a system font, so the symbol collided with the first digit of every amount.
  Currency is rendered through a `.money` class with a system font stack; the
  symbol is kept rather than falling back to `NGN`.
- The dispute banner keyed off `disputeReason`, which the backend keeps after a
  dispute is resolved, so it kept claiming "disputed". It now keys off status.
- "Deactivate Account" rendered as `type="submit"` and fired the destructive
  action with no confirmation.


## Authentication API

The frontend uses same-origin Next.js route handlers to proxy the deployed InstaSafe API. This avoids browser CORS issues and keeps the backend URL server-side.

Set the server-only variable in `.env.local`:

```env
INSTASAFE_API_URL=https://instasafe-atfzfsb6c7csbvek.westus3-01.azurewebsites.net
```

### Proxy routes

| Local route | Backend endpoint | Auth |
| --- | --- | --- |
| `POST /api/vendors` | `POST /api/vendors` | public |
| `POST /api/auth/vendor/login` | `POST /api/auth/vendor/login` | public |
| `POST /api/auth/vendor/request-code` | `POST /api/auth/vendor/request-code` | public |
| `POST /api/auth/vendor/verify-code` | `POST /api/auth/vendor/verify-code` | public |
| `POST /api/auth/vendor/request-email-code` | same | public |
| `POST /api/auth/vendor/verify-email` | same | public |
| `GET /api/payments/banks` | same | public |
| `GET /api/payments/banks/resolve` | same | public |
| `GET /api/vendors/[id]` | same | vendor JWT |
| `PUT /api/vendors/[id]/payout` | same | vendor JWT |

Successful `login` and `verify-code` calls set an httpOnly `instasafe_vendor_token` cookie using the backend's `expiresInHours`. The token is stripped from the JSON the browser receives. Protected proxy routes read that cookie and forward it as `Authorization: Bearer …`, so the JWT never reaches client JavaScript.

### Onboarding flow

1. **Profile** — `POST /api/vendors` with `phone`, `displayName`, `firstName`, `lastName`, `email`, `password`. Bank details are no longer part of registration.
2. **Email** — `POST /api/auth/vendor/verify-email` with `email` and the 6-digit `code` (`request-email-code` resends it).
3. **Login** — the payout endpoint needs a vendor JWT, so the email step hands off to `POST /api/auth/vendor/login` with `loginId` (email or phone) and `password`.
4. **Payout** — `GET /api/payments/banks` fills the bank dropdown, `GET /api/payments/banks/resolve` confirms the account name, then `PUT /api/vendors/{id}/payout` saves it.

Login branches on `role` first, then on the vendor flags: a non-vendor `role`
goes straight to its own console, otherwise `emailVerified === false` → verify
step, `onboardingCompleted === false` → payout step, and otherwise the workspace.
An admin login returns `vendor: null`, so the flags cannot be the first check.
WhatsApp OTP remains available as a recovery path.

Three separate httpOnly cookies hold the three principals, and one control signs
out of all of them:

| Cookie | Principal | Set by |
| --- | --- | --- |
| `instasafe_vendor_token` | vendor | `role === "vendor"` |
| `instasafe_dispatch_token` | rider | `POST /api/dispatch/verify-code` |
| `instasafe_admin_token` | super-admin | `role === "admin"` |

When account resolution returns `503` the vendor is told verification is unavailable and must tick a confirmation box before the details can be saved unverified, rather than being silently blocked.

`NEXT_PUBLIC_AUTH_SUCCESS_REDIRECT` controls the post-authentication destination for vendors and currently defaults to `/`. The role in the login response overrides it for the other two principals.

## Not built yet

Deliberately left out of this pass:

- **Order text parsing** (`POST /api/orders/parse`) — would let a vendor paste a
  WhatsApp message and prefill the create form.
- **Transfer bank picker** — `request-bank-transfer` works without
  `preferredBank` and uses the backend default. The create form does load
  `?transferOnly=true` banks for the *rider* payout, falling back to a free-text
  code if that call fails.
- **Order create confirmation screen** — creating redirects straight to the new
  order's detail page, where the Paystack link and transfer details live.
- **A rider fee breakdown** — the rider portal shows goods value, but
  `OrderDto` does not expose the fee the backend pays, so the UI deliberately
  does not imply a payout amount.
- **An admin dashboard per-vendor drill-down** — `/admin/vendors` lists stores but
  does not link to that vendor's orders. `GET /api/admin/orders` takes only
  `status`/`page`, so there is no server-side vendor filter to build the link
  from; a cross-vendor order search needs an endpoint change first.
- **Admin actions from the audit log** — entries are read-only. The backend
  records the note but exposes no way to amend one after the fact.
- **Bulk moderation** — refunds and resolutions are one order at a time. The API
  has no batch endpoint, and a bulk refund is exactly the kind of thing that
  should not be one click away.

## Backend quirks handled

- `GET /api/payments/banks` currently returns each bank five times (1440 rows, 282 unique codes). The proxy collapses duplicates by code and sorts by name before the browser sees it.
- Validation failures come back as `application/problem+json` with a field-keyed `errors` object, not the normal envelope. `src/lib/instasafe-server.ts` reads both shapes.
- Every list endpoint under `/api/admin/*` returns a **bare array** with no total count, so `src/lib/admin-api.ts` over-fetches by one row (`pageSize + 1`) to answer "is there a next page" without a total. A `null` body is normalised to `[]` rather than pushed onto every page.
- The admin order-status filter is passed through to the API rather than applied in the browser, so a filtered view pages through the real result set. The vendor order list does the opposite — it fetches a wide window and filters locally — because that endpoint's filter is a UI concept (`Active` is not a backend status).

## Quality checks

```bash
npm run lint
npm run build
```

The landing page and both auth pages were reviewed with Playwright at desktop and mobile sizes, in light and dark color schemes, and with reduced motion enabled. The full onboarding path was exercised with mocked API responses covering success, validation, wrong code, expired session, and bank-verifier outages.

The admin console was verified against a local mock of all 18 `/api/admin/*`
endpoints: every screen rendered, a force-release with a note moved a held order
to `Released` and wrote the note to the audit log, a vendor token in the admin
cookie was refused with the 403 notice, a vendor session was redirected away from
`/admin`, and the role-specific controls appeared and disappeared with order
state. Lighthouse reports 100 for accessibility, best practices and SEO on
`/admin`, `/admin/disputes`, `/admin/orders/[id]`, `/admin/vendors`,
`/admin/chats` and `/admin/audit`.

The `IS-XXXXXX` identifier and the per-order driver-bank rule were verified the
same way: order create accepted all three rider fields and was rejected with an
explanation when only some were given, and the tracker resolved the number in
both upper and lower case.

## Design notes

- The full Blue Spruce, Shamrock, Muted Teal, Ash Grey, and Cinnamon Wood palette is registered in `src/app/globals.css`.
- The transaction timeline and CTA patterns were researched through 21st.dev and adapted to InstaSafe rather than copied as generic templates.
- The WhatsApp order preview is a front-end product demonstration. It does not call Groq, Paystack, or move money.
- Replace the demo CTA target with the production WhatsApp Business number when available.

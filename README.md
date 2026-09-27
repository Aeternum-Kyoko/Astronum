# Astronum

A Vedic astrology site: free kundli (birth chart), kundli matching, daily Panchang and Moon-sign horoscopes, plus a
blog and consultation requests. Charts are computed from real ephemeris data (`astronomy-engine`) on the Lahiri
ayanamsa.

## Features

- **Kundli** (`/kundali`) — North/South Indian charts, 16 divisional charts, Vimshottari dasha to three levels,
  Ashtakavarga, Shadbala, yogas and doshas (Mangal Dosha from Lagna, Moon and Venus with classical cancellations),
  avakahada chakra and birth panchang. Birth details live in the URL, so every chart is a shareable link.
- **Kundli matching** (`/matching`) — 36-point Ashtakoota Guna Milan with a koota-by-koota breakdown and a Manglik
  comparison.
- **Panchang** (`/panchang`) — tithi, nakshatra, yoga and karana with end times, sunrise/sunset, Rahu Kaal,
  Yamaganda, Gulika, Abhijit and Choghadiya for any city and date.
- **Daily horoscope** (`/horoscope`, `/horoscope/[sign]`) — by Moon sign, from the Moon's transit with Jupiter and
  Saturn as the longer backdrop (including Sade Sati).
- **Festivals & muhurat** (`/festivals/[year]`, `/muhurat`) — festival, Ekadashi and vrat dates computed from the
  lunar calendar, and shubh muhurat shortlists for marriage, griha pravesh, vehicle, property and business.
- **Remedies** (kundli Remedies tab, `/learn/gemstones`) — life/lucky/fortune stones, and mantra, charity and rudraksha
  for weak planets and doshas. **Numerology** (`/numerology`) — Moolank, Bhagyank and Chaldean name number.
- **Hindi** (`/hi`, `/hi/horoscope`, `/hi/panchang`, `/hi/festivals`) — full Hindi versions with hreflang links;
  strings live in `src/lib/i18n/`.
- **Accounts** (`/signup`, `/login`, `/account`, password reset) — save charts and reopen them later.
- **Paid consultations** — Razorpay checkout with server-side signature verification and a webhook; off until keys
  are set. Bookings appear in `/admin`.
- **Learn** (`/learn/*`), **blog** with an admin editor (`/admin`), and a **consultation** request form.
- Light and dark themes, sitemap, robots.txt, Open Graph image and JSON-LD structured data.

## Getting started

```bash
npm install            # also generates the Prisma client
cp .env.example .env   # then fill in the values below
npx prisma migrate deploy --config prisma7.config.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string, e.g. `file:./dev.db` |
| `SESSION_SECRET` | Long random string used to sign admin and user session cookies |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the `/admin` password: `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email (password reset, booking confirmations). Without them, development logs emails to the console |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Paid consultations. Set your prices in `src/lib/consultationPlans.ts` first; point the webhook at `/api/razorpay/webhook` (event `payment.captured`) |
| `ADMIN_NOTIFY_EMAIL` | Receives a notification for each new booking |
| `NEXT_PUBLIC_SITE_URL` | Public origin (e.g. `https://astronum.in`) used for the sitemap, canonical URLs and share images. Defaults to `http://localhost:3000` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) — the astrology engine is covered against known astronomical dates |
| `npm run lint` | ESLint |

## Database changes

The Prisma config lives in `prisma7.config.ts`, so pass it to Prisma commands:

```bash
npx prisma migrate dev --config prisma7.config.ts --name describe_change
```

## Notes

- User sessions are signed cookies (30 days) carrying a session version; a password reset bumps it and signs the
  account out everywhere. Rotate `SESSION_SECRET` to invalidate every session at once.
- Login rate limiting is in-memory, per server process. Back it with a shared store before running multiple instances.

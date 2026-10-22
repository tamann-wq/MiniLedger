# MiniLedger

A small full-stack app for tracking money lent to friends.

## Stack
- API: Node.js, TypeScript, Express, PostgreSQL (`pg`), JWT
- Mobile: Expo React Native + TypeScript
- OTP: mock OTP printed in the API server log (development only)

## Requirements
- Node.js 20+
- PostgreSQL 14+
- Expo Go or an Android emulator

## 1. Start PostgreSQL
Create a database:
```sql
CREATE DATABASE miniledger;
```
The API creates its table automatically on startup.

## 2. Run the API
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Set `DATABASE_URL` in `.env`. By default, the API listens on port `4000`.
For an Android emulator, the app API URL should be `http://10.0.2.2:4000`; for a physical phone, use your computer's LAN IP.

### OTP flow
1. Call `POST /auth/request-otp` with `{"phone":"+919876543210"}`.
2. Read the OTP printed in the API terminal.
3. Call `POST /auth/verify-otp` with the phone and OTP. The response includes a JWT.
OTP storage is in memory and expires after 5 minutes. This is a demo, not production authentication.

## 3. Run the mobile app
```bash
cd mobile
npm install
```
Edit `src/config.ts` and set `API_URL`:
- Android emulator: `http://10.0.2.2:4000`
- iOS simulator: `http://localhost:4000`
- Physical device: `http://YOUR_COMPUTER_LAN_IP:4000`

Then run:
```bash
npx expo start
```
Scan the QR code with Expo Go, or press `a` for Android.

## API endpoints
- `POST /auth/request-otp` — request a mock OTP
- `POST /auth/verify-otp` — verify OTP and return a bearer token
- `GET /entries` — list current user's loan entries
- `POST /entries` — create `{ friendName, amount, dueDate }`
- `PATCH /entries/:id/repay` — mark a loan as repaid
- `GET /summary` — `{ totalLent, totalRepaid, overdueAmount }`
- `GET /health` — health check

All entry and summary routes require `Authorization: Bearer <token>`.

## Notes / limitations
- Amounts are stored as PostgreSQL `NUMERIC`; the API serializes them as numbers for the client.
- Each phone number gets a user row and can only access its own entries.
- OTPs are intentionally mocked and logged. Never log real OTPs in production.
- Receipt uploads are not included in this MVP.
- Tests: run `npm test` in `backend` for validation and summary tests.

## Suggested 2–3 minute demo recording
1. Show the login screen and request an OTP.
2. Show the API terminal log containing the mock OTP.
3. Verify OTP and enter the app.
4. Show summary totals and the entries list.
5. Add a loan due today / in the past to show overdue highlighting.
6. Mark an entry as repaid and show the summary update.
7. Briefly show README and API routes.

## GitHub submission
Create an empty repository on GitHub, then from this folder run:
```bash
git init
git add .
git commit -m "Build MiniLedger MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/miniledger.git
git push -u origin main
```
Replace the URL with your actual repository URL. Record the demo with Loom or your screen recorder and add the share link to this README.

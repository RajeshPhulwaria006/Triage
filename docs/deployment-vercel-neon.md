# 🚀 Deploying Triage to Vercel + Neon PostgreSQL

This is the exact, end-to-end guide to publish this project live with a **managed cloud PostgreSQL database on Neon** and **Next.js on Vercel**.

---

## 📋 Pre-Flight Checklist: CI/CD & Production Readiness
All the following checks are already configured and passing in this codebase:
- ✅ **ESLint Linter**: `npm run lint` passes with **0 errors**.
- ✅ **Comprehensive Test Suite**: `npm test` runs 20 tests (100% passing).
- ✅ **Clinical Verification**: `npm run verify` verifies patient priority jumps & overrides.
- ✅ **Next.js Production Build**: `npm run build` generates optimized standalone assets.
- ✅ **Production Health Route**: `GET /api/health` reports status, engine, and database latency.
- ✅ **GitHub Actions CI/CD**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) validates every push/PR with a PostgreSQL service container.

---

## 🐘 Step 1: Create Your Free Database on Neon (2 Minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and sign in with GitHub or Google (Free tier, no credit card required).
2. Click **Create Project**:
   * **Project Name**: `triage-opd`
   * **Postgres Version**: `16` or `17`
   * **Region**: Select the region closest to you (e.g., `AWS ap-southeast-1 Singapore` or `AWS us-east-1`).
3. Click **Create Project**.
4. In the Neon Console Dashboard, you will see a connection string labeled **Connection string**:
   * Select the **Pooled** connection (or Direct connection).
   * It looks like this:
     ```text
     postgres://neondb_owner:npg_AbCdEf123456@ep-cool-butterfly-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   * **Copy this connection string**. You will need it for Vercel.

---

## ▲ Step 2: Deploy to Vercel (3 Minutes)

### Option A: Via Vercel Web Dashboard (Easiest)

1. Push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete Triage system with Postgres, CI/CD, and health routes"
   git push origin main
   ```
2. Open **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
3. Click **"Add New..."** $\rightarrow$ **"Project"**.
4. Select your `aayu_helix` (or `triage`) repository and click **Import**.
5. In the **Configure Project** screen:
   * **Framework Preset**: `Next.js` (automatically detected).
   * **Root Directory**: `./` (leave default).
   * Expand the **Environment Variables** section:
     * **Key**: `DATABASE_URL`
     * **Value**: Paste your Neon connection string from Step 1:
       ```text
       postgres://neondb_owner:npg_AbCdEf123456@ep-cool-butterfly-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
       ```
6. Click **Deploy**.

Vercel will build the app, connect to Neon via `postgres.js`, run DDL to create the `patients` and `audit_logs` tables, and seed the default 14 demonstration patients automatically on first boot!

---

### Option B: Via Vercel CLI (From Terminal)

If you have the `vercel` CLI installed:
```bash
# 1. Install CLI if not already installed
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Set the DATABASE_URL environment variable
vercel env add DATABASE_URL production
# Paste your Neon connection string when prompted

# 5. Trigger production deployment
vercel --prod
```

---

## 🩺 Step 3: Verify Your Live Deployment

Once Vercel gives you your live URL (e.g., `https://triage-medical.vercel.app`):

### 1. Check the Health Endpoint
Open:
```text
https://your-app.vercel.app/api/health
```
You will get a JSON response like this:
```json
{
  "status": "healthy",
  "service": "triage",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "engine": "postgresql",
    "status": "connected",
    "latencyMs": 14
  },
  "queue": {
    "activeWaiting": 14,
    "immediateCases": 4
  }
}
```

### 2. Verify Live Functionality in Browser
1. **Live Queue**: Open `https://your-app.vercel.app/dashboard` $\rightarrow$ see the prioritized patients.
2. **Registration Desk**: Open `https://your-app.vercel.app/register` $\rightarrow$ register a patient $\rightarrow$ click "View in Queue" $\rightarrow$ auto-scrolls with the active highlight ring!
3. **Clinical Override**: Click "Override Priority" on any patient $\rightarrow$ watch the queue reorder in real time.
4. **Audit Log**: Open `https://your-app.vercel.app/audit` $\rightarrow$ inspect the tamper-resistant audit logs stored in Neon.

---

## 🔄 How the CI/CD Pipeline Works
Whenever you push code to GitHub:
1. GitHub Actions runs `.github/workflows/ci.yml`.
2. It launches an automated PostgreSQL container.
3. It runs `npm run lint`, `npm test`, `npm run verify`, and `npm run seed:db`.
4. If everything passes, Vercel automatically deploys the new release to production.

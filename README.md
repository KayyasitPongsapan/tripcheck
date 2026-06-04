# 🧳 TripCheck — Deploy Guide

A shared calendar where friends mark their days off and the app finds when you're all free.
No coding or command line needed — everything below is done in a web browser.

You'll use three **free** services: **Supabase** (the database), **GitHub** (stores the code),
and **Vercel** (puts the app online). Total time: ~15 minutes.

---

## STEP 1 — Set up the database (Supabase)

1. Go to **https://supabase.com** and sign up (free).
2. Click **New Project**. Give it a name, set a database password (save it somewhere), pick a region near you, and create it. Wait ~1 minute for it to finish.
3. In the left sidebar click **SQL Editor** → **New query**.
4. Open the file **`supabase_setup.sql`** (included in this folder), copy everything, paste it into the editor, and click **Run**. You should see "Success".
5. In the left sidebar click **Project Settings** (gear icon) → **API**. Keep this tab open — you'll need two values in Step 3:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (a long string under "Project API keys")

---

## STEP 2 — Put the code on GitHub

1. Go to **https://github.com** and sign up (free).
2. Click **+** (top right) → **New repository**. Name it `tripcheck`, leave it Public or Private, and click **Create repository**.
3. On the new repo page click **uploading an existing file** (the link in the middle).
4. Drag **all the files in this folder** into the upload box — *except* the `node_modules` and `dist` folders if they exist (you don't need them). Make sure you include the `src` folder, `package.json`, `index.html`, `vite.config.js`, `vercel.json`, and `supabase_setup.sql`.
5. Click **Commit changes**.

---

## STEP 3 — Put it online (Vercel)

1. Go to **https://vercel.com** and **Sign up with GitHub** (free).
2. Click **Add New… → Project**, find your `tripcheck` repo, and click **Import**.
3. Vercel auto-detects it's a Vite app — leave the build settings as-is.
4. Expand **Environment Variables** and add these two (from Step 1.5):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |

5. Click **Deploy**. Wait ~1 minute.
6. Done! You'll get a link like **`https://tripcheck-xxxx.vercel.app`**.

---

## STEP 4 — Use it

1. Open your Vercel link. The app automatically creates a private trip with a code in the address bar (e.g. `...vercel.app/?g=a1b2c3d`).
2. Click **🔗 Copy invite link** at the top and send that link to your friends.
3. Everyone opens the link, types their name once, and taps the days they're free.
4. You (the organizer) use the **"Tap = set holiday"** toggle to mark public holidays.
5. Check **Heatmap**, **Spreadsheet**, and **Recommendations** to see when you can all travel.

> Starting a *different* trip later? Just open the bare Vercel link again (without the `?g=...` part) and it creates a fresh trip with a new code.

---

## Notes

- **Privacy:** each trip is protected by the random code in its link. Anyone with that link can view and edit that trip, so only share it with your group. Different trips can't see each other.
- **Syncing:** the app refreshes every few seconds, so everyone sees each other's days within moments.
- **Cost:** all three services' free tiers are far more than enough for a group of friends.
- **Running locally (optional):** if you ever want to test on your own computer, install Node.js, copy `.env.example` to `.env` and fill in your two values, then run `npm install` and `npm run dev`.

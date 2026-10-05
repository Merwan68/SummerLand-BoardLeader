# Summerland Academy - Board Leader Portal

Executive School Management and Monitoring Web Application for the Board Leader of **Summerland Academy**.

- **School Tier:** Kindergarten (KG 1–3) & Elementary (Grade 1–8)
- **Academic Session:** 2019 E.C. / 2026–2027 G.C.
- **Audience:** Private executive web dashboard for the Board Leader / School Leader.

---

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion
- **Database & Backend:** Google Cloud Firestore (provisioned enterprise database)
- **Authentication:** Firebase Authentication (Single Board Leader account enforcement)
- **Routing:** HTML5 History API SPA routing with direct link fallback support for Vercel, Netlify, Firebase Hosting, and GitHub Pages

---

## 1. Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (Version 18, 20, or 22 LTS recommended)
- `npm` (bundled with Node.js) or `pnpm` / `yarn`
- [Git](https://git-scm.com/)

---

## 2. Local Setup & Installation

1. **Clone or Download the Repository:**
   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd summerland-academy-portal
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create your local `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase project credentials (from your Firebase Console or `firebase-applet-config.json`):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_web_app_id
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_firestore_database_id
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 3. Production Build & Verification

To verify that the application compiles cleanly for production:

```bash
# Type-check and lint
npm run lint

# Compile production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Pushing to GitHub

Run the following commands in your project root terminal:

```bash
# 1. Initialize Git (if not already initialized)
git init

# 2. Stage all project files (sensitive .env files and node_modules are automatically protected by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: production-ready Summerland Academy portal"

# 4. Set default branch to main
git branch -M main

# 5. Connect your GitHub repository (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 5. Deployment Options

### Option A: Vercel (Recommended — 1-Click Git Integration)

1. Sign in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New...** &rarr; **Project**.
3. Select your `summerland-academy-portal` repository.
4. In **Project Settings**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add the variables from `.env.example`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`
6. Click **Deploy**. Vercel will build and assign you a secure HTTPS domain (e.g., `https://summerland-portal.vercel.app`).
   *(The included `vercel.json` ensures direct route refreshes like `/students` and `/reports` work out of the box).*

---

### Option B: Netlify

1. Sign in to [Netlify](https://netlify.com) with GitHub.
2. Click **Add new site** &rarr; **Import an existing project**.
3. Select your repository.
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. In **Site configuration &rarr; Environment variables**, add your `VITE_FIREBASE_*` variables.
6. Click **Deploy site**.
   *(The included `public/_redirects` ensures all SPA routes route smoothly without 404s).*

---

### Option C: Firebase Hosting

If you want to host directly on Google Firebase Hosting:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize:
   ```bash
   firebase login
   firebase init hosting
   ```
   Select your existing Firebase project. Set public directory to `dist` and configure as a single-page app (`y`).
3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 6. CRITICAL: Authorize Your Domain in Firebase Console

Once your app is deployed to a live domain (e.g. `https://your-app.vercel.app` or `https://your-domain.com`):

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`gen-lang-client-0752559481`**.
3. In the left navigation, click **Authentication** &rarr; **Settings** tab.
4. Click **Authorized domains**.
5. Click **Add domain** and enter your deployed domain:
   - e.g., `your-app.vercel.app` or `your-custom-domain.com`
6. Click **Save**.

> **Note:** If you skip this step, Google Sign-in or Firebase Auth popups from your deployed domain will be blocked by Firebase security.

---

## 7. Security & Account System

- **Single Board Leader Account:**
  - Upon first access, the portal prompts you to create your chosen Board Leader email and password.
  - Once created, account registration is permanently locked and closed. No unauthorized secondary accounts can ever be created.
  - The Board Leader can edit their title/name, authorized email, and password at any time in **Settings &rarr; Board Leader Profile & Credentials**.
- **No Hardcoded Passwords or Autofill:**
  - All credentials are real and managed through Firebase Authentication and Firestore.
- **Zero-Trust Firestore Security Rules:**
  - Security rules are defined in `firestore.rules` and enforced directly by Cloud Firestore servers.
  - Unauthenticated access to school records is completely forbidden.

---

## 8. Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts local development server on port 3000 |
| `npm run build` | Compiles production bundle with Vite into `/dist` |
| `npm run lint` | Runs TypeScript type checking without emitting files |
| `npm run preview` | Runs local web server to preview production build |

---

## 9. Project File Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI build check
├── public/
│   ├── _redirects               # Netlify SPA routing redirects
│   └── 404.html                 # GitHub Pages SPA fallback
├── src/
│   ├── components/              # Modals, charts, layout, cards
│   ├── context/                 # SchoolContext (state, Firebase, auth, calculations)
│   ├── types/                   # TypeScript interfaces (Student, Teacher, Grade, etc.)
│   ├── utils/                   # Calculations, status algorithms, i18n
│   ├── views/                   # Dashboard, Students, Teachers, Classes, Reports, etc.
│   ├── firebase.ts              # Firebase SDK initialization with env support
│   ├── index.css                # Tailwind CSS styling and print media rules
│   └── main.tsx                 # React DOM root entry point
├── .env.example                 # Environment variables template
├── .gitignore                   # Comprehensive Git ignore rules
├── firebase.json                # Firebase Hosting and Firestore rules config
├── firestore.rules              # Cloud Firestore security rules
├── index.html                   # HTML entry point with metadata
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vercel.json                  # Vercel SPA routing rewrite rules
├── vite.config.ts               # Vite configuration
└── README.md                    # Project documentation
```

---

© Summerland Academy • Kindergarten & Elementary School Management System

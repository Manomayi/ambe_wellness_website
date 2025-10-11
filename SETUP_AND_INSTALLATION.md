# Setup and Installation Guide

**Last Updated**: October 2025

Complete guide for setting up the Ambé Wellness platform on your local machine and deploying to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [Stripe Configuration](#stripe-configuration)
5. [Agora Configuration](#agora-configuration)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Building for Production](#building-for-production)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Download |
|----------|----------------|-------------|----------|
| **Node.js** | 18.x | 20.x LTS | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x | 10.x | Included with Node.js |
| **Git** | 2.x | Latest | [git-scm.com](https://git-scm.com) |

### Required Accounts

You'll need accounts for the following services:

1. **Firebase** (free tier available)
   - [firebase.google.com](https://firebase.google.com)
   - Used for: Authentication, Database (Firestore), Storage

2. **Stripe** (test mode available)
   - [stripe.com](https://stripe.com)
   - Used for: Payment processing, subscriptions

3. **Agora** (free minutes available)
   - [agora.io](https://agora.io)
   - Used for: Video consultations

### System Requirements

- **OS**: macOS, Linux, or Windows 10+
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd ambe_wellness_website

# Or if you're starting fresh
cd ambe_wellness_website
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - Next.js 15.2.4
# - React 19.0.0
# - Tailwind CSS 4
# - Firebase 11.6.1
# - Stripe libraries
# - Agora RTC SDK
# - And all other dependencies
```

**Expected Output:**
```
added 267 packages, and audited 268 packages in 45s
```

### Step 3: Verify Installation

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# List installed packages
npm list --depth=0
```

---

## Firebase Configuration

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `ambe-wellness` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode** (we'll configure rules later)
4. Choose a location closest to your users
5. Click "Enable"

### Step 4: Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function isDoctor() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/doctors/$(request.auth.uid));
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isDoctor();

      // User subcollections
      match /cart/{cartItem} {
        allow read, write: if isOwner(userId);
      }

      match /appointments_upcoming/{appointmentId} {
        allow read, write: if isOwner(userId) || isDoctor();
      }

      match /appointments_completed/{appointmentId} {
        allow read, write: if isOwner(userId) || isDoctor();
      }

      match /messages/{messageId} {
        allow read, write: if isOwner(userId) || isDoctor();
      }
    }

    // Doctors collection
    match /doctors/{doctorId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(doctorId);

      // Doctor subcollections
      match /users/{userId} {
        allow read, write: if isOwner(doctorId);
      }

      match /appointments_upcoming/{appointmentId} {
        allow read, write: if isOwner(doctorId);
      }

      match /appointments_completed/{appointmentId} {
        allow read, write: if isOwner(doctorId);
      }

      match /messages/{messageId} {
        allow read, write: if isOwner(doctorId);
      }
    }

    // Products collection (read-only for authenticated users)
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin can write
    }

    // Store collection (read-only for authenticated users)
    match /store/{storeId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin can write
    }
  }
}
```

3. Click "Publish"

### Step 5: Enable Storage (Optional)

1. Go to **Storage**
2. Click "Get started"
3. Use production mode
4. Click "Done"

### Step 6: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app with nickname: "Ambe Wellness Web"
5. Copy the `firebaseConfig` object

**Example Configuration:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ambe-wellness.firebaseapp.com",
  projectId: "ambe-wellness",
  storageBucket: "ambe-wellness.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## Stripe Configuration

### Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete verification (can use test mode during development)

### Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. You'll see:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)
3. Copy the **Publishable key** (we'll use the secret key for backend later)

### Step 3: Create Products and Prices

#### Create Subscription Product

1. Go to **Products** → **Add product**
2. Enter:
   - **Name**: "Ambe Wellness Monthly Subscription"
   - **Description**: "Access to consultations and messaging"
   - **Pricing**: $50.00 USD
   - **Billing period**: Monthly
   - **Recurring**: Yes
3. Click "Save product"
4. Copy the **Price ID** (starts with `price_`)

#### Create Test Products (Optional)

You can add test products for the store:
1. Go to **Products** → **Add product**
2. Enter product details
3. Set pricing
4. Click "Save product"

### Step 4: Configure Webhooks (for Production)

1. Go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

---

## Agora Configuration

### Step 1: Create Agora Account

1. Go to [console.agora.io](https://console.agora.io)
2. Sign up for an account
3. Verify your email

### Step 2: Create a Project

1. In Agora Console, click "Project Management"
2. Click "Create"
3. Enter project name: "Ambe Wellness"
4. Select "Secured mode: APP ID + Token"
5. Click "Submit"

### Step 3: Get App ID

1. Find your project in the list
2. Copy the **App ID**
3. Enable the following features:
   - Real-time Communication (RTC)
   - Cloud Recording (optional)

### Step 4: Generate Tokens (Development)

For development, you can use temporary tokens:

1. Go to your project settings
2. Click "Generate temp token"
3. Enter a channel name (e.g., "test-channel")
4. Copy the token

**Note**: For production, you'll need a token server. See [INTEGRATIONS.md](./INTEGRATIONS.md) for details.

---

## Environment Variables

### Step 1: Create Environment File

```bash
# Create .env.local file in project root
touch .env.local
```

### Step 2: Add Environment Variables

Open `.env.local` and add the following:

```bash
# ============================================
# FIREBASE CONFIGURATION
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ============================================
# STRIPE CONFIGURATION
# ============================================
# Use test keys (pk_test_...) for development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Secret key (for backend/API routes only)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Subscription price ID
NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID=price_your_price_id_here

# Webhook secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ============================================
# AGORA CONFIGURATION
# ============================================
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id_here

# For token generation (backend only)
AGORA_APP_CERTIFICATE=your_app_certificate_here

# ============================================
# API CONFIGURATION
# ============================================
# Your API endpoint (if using external API)
NEXT_PUBLIC_API_ENDPOINT=https://your-api-domain.com

# ============================================
# ENVIRONMENT
# ============================================
# development | production | test
NODE_ENV=development

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Verify Environment Variables

The configuration file is located at `src/lib/firebase/config.js`:

```javascript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

### Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local` to git** (it's in `.gitignore`)
2. **Use different keys for development and production**
3. **Keep secret keys server-side only** (no `NEXT_PUBLIC_` prefix)
4. **Rotate keys regularly** in production
5. **Use Stripe test mode** during development

---

## Running the Application

### Start Development Server

```bash
# Start the dev server
npm run dev

# The app will be available at:
# http://localhost:3000
```

**Expected Output:**
```
▲ Next.js 15.2.4
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

### Development Features

The development server includes:
- **Hot Module Replacement** (HMR) - Changes reflect instantly
- **Fast Refresh** - Component state preserved during edits
- **Error Overlay** - Errors displayed in browser
- **Detailed Logs** - Console logs for debugging

### Access the Application

Open your browser to:

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Sign Up**: http://localhost:3000/signup
- **User Dashboard**: http://localhost:3000/user/home
- **Doctor Dashboard**: http://localhost:3000/doctor/dashboard

### Run Linting

```bash
# Check for code issues
npm run lint

# Auto-fix issues (where possible)
npm run lint -- --fix
```

---

## Building for Production

### Step 1: Build the Application

```bash
# Create production build
npm run build
```

This will:
1. Compile all TypeScript/JavaScript
2. Optimize and minify code
3. Generate static pages where possible
4. Create production bundles

**Expected Output:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        92.1 kB
├ ○ /login                              3.8 kB        89.7 kB
├ ○ /signup                             4.1 kB        90.0 kB
├ λ /doctor/dashboard                   8.5 kB        95.4 kB
└ λ /user/home                          9.2 kB        96.1 kB

○  (Static)  prerendered as static content
λ  (Dynamic)  server-rendered on demand
```

### Step 2: Test Production Build Locally

```bash
# Start production server
npm run start

# Access at http://localhost:3000
```

### Step 3: Verify Production Build

Test the following:

- [ ] Homepage loads correctly
- [ ] Authentication works (login/signup)
- [ ] Protected routes redirect properly
- [ ] Firebase connection established
- [ ] Stripe checkout works (test mode)
- [ ] Video calls connect (Agora)
- [ ] Images and assets load
- [ ] No console errors

---

## Deployment

### Deploying to Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Prerequisites

1. Create a [Vercel account](https://vercel.com)
2. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

#### Method 1: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variables (copy from `.env.local`)
5. Click "Deploy"

#### Method 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all variables from `.env.local`
4. Select environments: Production, Preview, Development
5. Click "Save"

**Important**: Update these values:
```bash
# Production Firebase project
NEXT_PUBLIC_FIREBASE_API_KEY=production_key
# ... (other Firebase production values)

# Production Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Production app URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS settings as shown
4. Wait for SSL certificate (automatic)

### Deploying to Other Platforms

#### Netlify

```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables
Add all from .env.local
```

#### AWS Amplify

1. Connect your Git repository
2. Build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```

#### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ambe-wellness .
docker run -p 3000:3000 --env-file .env.local ambe-wellness
```

---

## Post-Deployment Configuration

### 1. Update Firebase Configuration

Add your production domain to Firebase:

1. Go to **Firebase Console** → **Authentication** → **Settings**
2. Add authorized domain: `your-domain.com`
3. Save changes

### 2. Update Stripe Webhook

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Copy signing secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Configure CORS (if using API)

Update your API to allow requests from your domain:
```javascript
const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com'
];
```

### 4. Set up Monitoring

Consider adding:
- **Vercel Analytics** (built-in)
- **Sentry** for error tracking
- **Google Analytics** for user analytics
- **LogRocket** for session replay

---

## Troubleshooting

### Common Setup Issues

#### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Firebase connection error

**Symptoms:**
```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

**Solution:**
1. Verify all Firebase environment variables are correct
2. Check for extra spaces or quotes in `.env.local`
3. Restart dev server after changing environment variables

#### Issue: Stripe not loading

**Symptoms:**
```
Error: Stripe publishable key is invalid
```

**Solution:**
1. Ensure you're using `pk_test_` key for development
2. Verify key is correctly set in `.env.local`
3. Check for typos in environment variable name

#### Issue: Agora video not connecting

**Solution:**
1. Verify App ID is correct
2. Check browser permissions for camera/microphone
3. Ensure you're using HTTPS (required for production)
4. Test with Agora's demo app first

#### Issue: Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 npm run dev
```

#### Issue: Module not found errors

**Solution:**
```bash
# Verify jsconfig.json is correct
cat jsconfig.json

# Should contain:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Build Issues

#### Issue: Build fails with memory error

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Issue: Image optimization error

**Solution:**
1. Ensure images are in `public/` directory
2. Use Next.js Image component:
   ```javascript
   import Image from 'next/image';
   ```

### Deployment Issues

#### Issue: Environment variables not working in production

**Solution:**
1. Verify all variables are added in Vercel/deployment platform
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

#### Issue: 404 on dynamic routes

**Solution:**
1. Ensure dynamic route files use correct naming: `[id]/page.jsx`
2. Check route group parentheses: `(dashboard)`
3. Verify `app` directory structure

---

## Verification Checklist

After setup, verify everything works:

### Local Development
- [ ] Dev server starts without errors
- [ ] Homepage loads (http://localhost:3000)
- [ ] Can create new user account
- [ ] Can log in with created account
- [ ] Firebase console shows new user
- [ ] Can navigate to protected routes
- [ ] Tailwind styles are applied
- [ ] Images load correctly

### Firebase
- [ ] Authentication works
- [ ] Firestore reads/writes work
- [ ] Security rules are in place
- [ ] Console shows no errors

### Stripe (Test Mode)
- [ ] Can initiate checkout
- [ ] Test payment succeeds
- [ ] Webhook receives events (if configured)
- [ ] Subscription shows in Stripe dashboard

### Agora
- [ ] Can initialize video call
- [ ] Camera and microphone access granted
- [ ] Video stream appears
- [ ] Connection is stable

---

## Next Steps

Once setup is complete:

1. **Explore the codebase**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Understand authentication**: See [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)
3. **Learn the database structure**: See [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)
4. **Review user features**: See [USER_PORTAL.md](./USER_PORTAL.md)
5. **Review doctor features**: See [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Agora Documentation](https://docs.agora.io)
- [Vercel Documentation](https://vercel.com/docs)

---

**Setup Complete!** You're ready to start developing. 🚀

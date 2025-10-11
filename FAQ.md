# Frequently Asked Questions (FAQ)

**Last Updated**: October 2025

Common questions and answers for developers working on the Ambé Wellness platform.

---

## General Questions

### What is this platform?

Ambé Wellness is a telemedicine platform connecting patients (users) with healthcare providers (doctors) through video consultations, messaging, and an integrated wellness product store.

### What tech stack is used?

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Payments**: Stripe
- **Video**: Agora RTC SDK
- **Language**: JavaScript/JSX (no TypeScript)

### Where is the documentation?

All documentation is in the `/docs` folder. Start with [OVERVIEW.md](./OVERVIEW.md).

---

## Setup Questions

### How do I get started?

1. Clone the repository
2. Run `npm install`
3. Configure `.env.local` with API keys
4. Run `npm run dev`

See [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) for details.

### What environment variables are required?

- Firebase: API key, auth domain, project ID, etc.
- Stripe: Publishable key, secret key
- Agora: App ID

Full list in [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md#environment-variables).

### How do I get Firebase credentials?

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Go to Project Settings
3. Copy configuration values
4. Add to `.env.local`

---

## Development Questions

### Why use `<div>` instead of `<h1>`?

**Answer**: Design system requirement. Use Tailwind classes for styling instead:

```javascript
// ❌ Don't use
<h1>Title</h1>

// ✅ Use instead
<div className="text-4xl font-bold">Title</div>
```

### How do I import from `src/`?

Use the `@/` alias:

```javascript
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
```

### How do protected routes work?

Wrap components in `<ProtectedRoute>`:

```javascript
<ProtectedRoute userType="user">
  {children}
</ProtectedRoute>
```

See [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md).

### How do I add a new page?

1. Create file in `src/app/[route]/page.jsx`
2. Add to appropriate route group if needed
3. Wrap in `ProtectedRoute` if private

---

## Database Questions

### Where is user data stored?

In Firestore collections:
- `/users/{uid}` - User/patient data
- `/doctors/{uid}` - Doctor data

See [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md).

### How do I query Firestore?

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const q = query(
  collection(db, 'users'),
  where('subscription.active', '==', true)
);
const snapshot = await getDocs(q);
```

### Why are appointments stored twice?

For efficient queries. Stored in both:
- `/users/{uid}/appointments_*`
- `/doctors/{uid}/appointments_*`

This avoids complex queries and improves performance.

---

## Authentication Questions

### How does user type detection work?

Checks if document exists in `doctors` collection:
- Exists → User is a doctor
- Doesn't exist → User is a patient/user

### How do I get current user?

```javascript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, userType } = useAuth();
  // user: Firebase Auth user
  // profile: Firestore profile data
  // userType: "doctor" or "user"
}
```

### How do I protect API routes?

Verify Firebase token server-side:

```javascript
import { auth } from '@/lib/firebase/config';

export async function POST(request) {
  const token = request.headers.get('Authorization');
  const decodedToken = await auth.verifyIdToken(token);
  const uid = decodedToken.uid;
  // Process request
}
```

---

## Feature Questions

### How does the subscription work?

- **Price**: $50/month
- **Provider**: Stripe
- **Benefits**: Unlimited messaging, consultations, store discount
- **Flow**: Checkout → Stripe → Webhook → Update Firestore

### How does the referral system work?

1. User A gets unique code
2. User B signs up with code
3. Both get 25% off next order
4. No limit on referrals

See [USER_PORTAL.md](./USER_PORTAL.md#referral-program).

### How do video consultations work?

- **Provider**: Agora RTC SDK
- **Flow**: Join channel → Stream video/audio → Leave channel
- **Features**: Camera/mic toggle, screen sharing

See [INTEGRATIONS.md](./INTEGRATIONS.md#agora-video-integration).

---

## Styling Questions

### What CSS framework is used?

Tailwind CSS v4

### How do I use brand colors?

Use design tokens:

```javascript
import { colors } from '@/lib/design-tokens';

// Or use Tailwind arbitrary values
className="bg-[#FFD3AC] text-[#353535]"
```

### How do I make components responsive?

Use Tailwind breakpoints:

```javascript
className="text-base md:text-lg lg:text-xl"
//          Mobile    Tablet    Desktop
```

### Where are custom fonts?

In `/public/fonts/` directory.

Configured in `src/app/globals.css:1`.

---

## Deployment Questions

### How do I deploy?

Recommended: Vercel

1. Connect Git repository
2. Configure environment variables
3. Deploy automatically on push

See [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md#deployment).

### What about environment variables in production?

Add them in Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all variables from `.env.local`
4. Redeploy

### How do I test before deploying?

```bash
npm run build  # Test production build
npm run start  # Test locally
```

---

## Troubleshooting Questions

### Build fails - what do I do?

1. Clear cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install`
4. Try build again

### Firebase not connecting?

1. Check `.env.local` exists
2. Verify all Firebase variables
3. Restart dev server
4. Check Firebase Console for errors

### Video calls not working?

1. Check browser permissions
2. Use HTTPS (required for production)
3. Verify Agora App ID
4. Check Agora Console logs

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more.

---

## Best Practices

### Should I use TypeScript?

Currently no TypeScript. Project uses JavaScript/JSX.

### How do I handle errors?

```javascript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly message
  alert('Something went wrong. Please try again.');
}
```

### How do I clean up listeners?

```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(ref, callback);

  return () => unsubscribe();  // Cleanup
}, [dependencies]);
```

### How do I optimize performance?

1. Use Next.js Image component
2. Lazy load below-the-fold content
3. Limit Firestore queries
4. Unsubscribe from listeners
5. Use React.memo for expensive components

---

## Contributing

### How do I contribute?

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

### What coding standards should I follow?

- Use Tailwind for all styling
- No HTML heading tags (`<h1>`, etc.)
- Use `@/` import alias
- Clean up listeners in useEffect
- Handle loading states
- Show user-friendly errors

---

## Getting More Help

### Where can I find more information?

- **Overview**: [OVERVIEW.md](./OVERVIEW.md)
- **Setup**: [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)
- **User Features**: [USER_PORTAL.md](./USER_PORTAL.md)
- **Doctor Features**: [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md)
- **Database**: [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)
- **Auth**: [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)
- **Integrations**: [INTEGRATIONS.md](./INTEGRATIONS.md)
- **UI/UX**: [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Who do I contact for issues?

Check the project README or repository issues page.

---

**FAQ complete!**

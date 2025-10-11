# Troubleshooting Guide

**Last Updated**: October 2025

Common issues and solutions for the Ambé Wellness platform.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Authentication Issues](#authentication-issues)
3. [Database Issues](#database-issues)
4. [Video Call Issues](#video-call-issues)
5. [Payment Issues](#payment-issues)
6. [Build Issues](#build-issues)

---

## Installation Issues

### Issue: `npm install` fails

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 3000 already in use

**Solution**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## Authentication Issues

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Cause**: Incorrect or missing Firebase API key

**Solution**:
1. Check `.env.local` file exists
2. Verify all Firebase environment variables are correct
3. Restart dev server after changes
4. Ensure no extra spaces or quotes

### Issue: User redirected to login after page refresh

**Cause**: Loading state not handled properly

**Solution**:
```javascript
const { user, loading } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}

if (!user) {
  router.push('/login');
}
```

### Issue: "User type not detected"

**Cause**: Document missing in Firestore

**Solution**:
1. Check if document exists in `/doctors/{uid}` or `/users/{uid}`
2. Manually create document if missing
3. Ensure sign-up process creates document

---

## Database Issues

### Issue: "Missing or insufficient permissions"

**Cause**: Firestore security rules blocking access

**Solution**:
1. Check Firestore rules in Firebase Console
2. Ensure user is authenticated
3. Verify user has access to specific document

### Issue: Real-time listener not updating

**Cause**: Listener not set up correctly

**Solution**:
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    setData(snapshot.data());
  });

  // IMPORTANT: Cleanup
  return () => unsubscribe();
}, [dependencies]);
```

### Issue: "Document does not exist"

**Cause**: Trying to read non-existent document

**Solution**:
```javascript
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
  const data = docSnap.data();
} else {
  console.log('Document not found');
}
```

---

## Video Call Issues

### Issue: Camera/microphone not working

**Cause**: Browser permissions not granted

**Solution**:
1. Check browser permissions
2. Use HTTPS (required for production)
3. Test in different browser
4. Check Agora console for errors

### Issue: "Failed to join channel"

**Cause**: Agora configuration issue

**Solution**:
1. Verify `NEXT_PUBLIC_AGORA_APP_ID` is correct
2. Check Agora project is active
3. For production, generate token server-side
4. Verify channel name is valid

### Issue: Video freezes or lags

**Cause**: Network issues or CPU overload

**Solution**:
1. Check internet connection
2. Close other applications
3. Lower video quality in Agora settings
4. Check Agora network quality indicator

---

## Payment Issues

### Issue: "Stripe publishable key is invalid"

**Cause**: Wrong or missing Stripe key

**Solution**:
1. Use `pk_test_` key for development
2. Use `pk_live_` key for production
3. Verify key in `.env.local`
4. Restart server after changes

### Issue: Webhook not receiving events

**Cause**: Webhook endpoint not configured

**Solution**:
1. Add webhook endpoint in Stripe Dashboard
2. Use correct URL: `https://your-domain.com/api/webhooks/stripe`
3. Select correct events
4. Copy webhook secret to `.env.local`
5. Test with Stripe CLI

### Issue: Payment succeeds but subscription not activated

**Cause**: Webhook handler not updating Firestore

**Solution**:
1. Check webhook logs in Stripe Dashboard
2. Verify webhook handler is working
3. Check Firestore for updated subscription data
4. Manually update if needed for testing

---

## Build Issues

### Issue: "Module not found"

**Cause**: Import path incorrect

**Solution**:
1. Check if file exists
2. Verify import path
3. Use `@/` alias for src imports
4. Check `jsconfig.json` is configured

### Issue: Build fails with memory error

**Solution**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Issue: Image optimization error

**Solution**:
1. Ensure images in `public/` directory
2. Use Next.js Image component
3. Verify image paths are correct

---

## Common Error Messages

### "Cannot read property 'X' of undefined"

**Cause**: Trying to access property of undefined object

**Solution**:
```javascript
// Use optional chaining
const value = object?.property?.subProperty;

// Or check before accessing
if (object && object.property) {
  const value = object.property;
}
```

### "Hydration mismatch"

**Cause**: Server and client rendering different content

**Solution**:
1. Ensure components render same on server and client
2. Use `useEffect` for client-only code
3. Avoid `window` or `localStorage` in initial render

### "Maximum update depth exceeded"

**Cause**: State update in render causing infinite loop

**Solution**:
```javascript
// ❌ BAD
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1);  // Causes infinite loop
  return <div>{count}</div>;
}

// ✅ GOOD
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1);
  }, []);  // Only once on mount

  return <div>{count}</div>;
}
```

---

## Getting Help

If issue persists:

1. Check [Firebase Status](https://status.firebase.google.com/)
2. Check [Stripe Status](https://status.stripe.com/)
3. Check [Vercel Status](https://www.vercel-status.com/)
4. Review related documentation
5. Check browser console for errors
6. Review server logs

---

## Related Documentation

- [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)
- [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)
- [INTEGRATIONS.md](./INTEGRATIONS.md)

---

**Troubleshooting guide complete!**

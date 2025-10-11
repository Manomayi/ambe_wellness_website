# Third-Party Integrations

**Last Updated**: October 2025

Documentation for all third-party service integrations: Stripe (payments), Agora (video), and Firebase services.

---

## Table of Contents

1. [Firebase Integration](#firebase-integration)
2. [Stripe Integration](#stripe-integration)
3. [Agora Video Integration](#agora-video-integration)

---

## Firebase Integration

### Services Used

1. **Firebase Authentication**: User sign-in/sign-up
2. **Firestore Database**: NoSQL data storage
3. **Firebase Storage**: File and image storage

### Configuration

**Location**: `src/lib/firebase/config.js:1`

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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

See [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) and [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) for detailed usage.

---

## Stripe Integration

### Purpose

- Subscription payments ($50/month)
- One-time product purchases
- Payment method management

### Setup

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Configuration

```javascript
// Environment variables
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  // Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Client-Side Implementation

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Create checkout session
async function handleSubscribe() {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.uid,
      priceId: 'price_subscription_monthly',
      mode: 'subscription'
    })
  });

  const { sessionId } = await response.json();
  const stripe = await stripePromise;
  await stripe.redirectToCheckout({ sessionId });
}
```

### Subscription Flow

1. User clicks subscribe
2. Create Stripe checkout session
3. Redirect to Stripe hosted checkout
4. User enters payment
5. Webhook receives event
6. Update Firestore user document
7. Redirect to success page

### Product Purchase Flow

1. User adds items to cart
2. Clicks checkout
3. Create Stripe checkout session with line items
4. Redirect to checkout
5. Payment processed
6. Webhook updates order
7. Clear cart, show confirmation

### Webhooks

Handle Stripe events:

```javascript
// api/webhooks/stripe/route.js
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user subscription in Firestore
      break;

    case 'customer.subscription.updated':
      // Handle subscription updates
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

---

## Agora Video Integration

### Purpose

Real-time video consultations between doctors and users.

### Setup

```bash
npm install agora-rtc-sdk-ng
```

### Configuration

```javascript
// Environment variables
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
```

### Video Call Component

**Location**: `src/components/video/VideoCall.jsx:1`

### Implementation

```javascript
"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export default function VideoCall({ channelName, userType }) {
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState({});
  const [joined, setJoined] = useState(false);
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    // Initialize Agora client
    const client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8'
    });
    clientRef.current = client;

    // Handle user published
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        const playerContainer = document.getElementById(`remote-${user.uid}`);
        remoteVideoTrack.play(playerContainer);
      }

      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack.play();
      }

      setRemoteUsers(prev => ({
        ...prev,
        [user.uid]: user
      }));
    });

    // Handle user unpublished
    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => {
        const newUsers = { ...prev };
        delete newUsers[user.uid];
        return newUsers;
      });
    });

    return () => {
      leaveCall();
    };
  }, []);

  const joinCall = async () => {
    try {
      const client = clientRef.current;
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

      // Join channel
      await client.join(appId, channelName, null, null);

      // Create local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      setLocalTracks({ audio: audioTrack, video: videoTrack });

      // Play local video
      videoTrack.play(localVideoRef.current);

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      setJoined(true);
    } catch (error) {
      console.error('Error joining call:', error);
      alert('Failed to join video call');
    }
  };

  const leaveCall = async () => {
    try {
      const client = clientRef.current;

      // Close local tracks
      if (localTracks.audio) {
        localTracks.audio.close();
      }
      if (localTracks.video) {
        localTracks.video.stop();
        localTracks.video.close();
      }

      // Leave channel
      await client.leave();
      setJoined(false);
      setRemoteUsers({});
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  const toggleMute = () => {
    if (localTracks.audio) {
      localTracks.audio.setEnabled(!localTracks.audio.enabled);
    }
  };

  const toggleVideo = () => {
    if (localTracks.video) {
      localTracks.video.setEnabled(!localTracks.video.enabled);
    }
  };

  return (
    <div className="video-call-container">
      {/* Local Video */}
      <div ref={localVideoRef} className="local-video" />

      {/* Remote Videos */}
      {Object.keys(remoteUsers).map(uid => (
        <div key={uid} id={`remote-${uid}`} className="remote-video" />
      ))}

      {/* Controls */}
      <div className="controls">
        {!joined ? (
          <button onClick={joinCall}>Join Call</button>
        ) : (
          <>
            <button onClick={toggleMute}>
              {localTracks.audio?.enabled ? 'Mute' : 'Unmute'}
            </button>
            <button onClick={toggleVideo}>
              {localTracks.video?.enabled ? 'Stop Video' : 'Start Video'}
            </button>
            <button onClick={leaveCall}>Leave Call</button>
          </>
        )}
      </div>
    </div>
  );
}
```

### Token Generation (Production)

For production, generate tokens server-side:

```javascript
// api/agora-token/route.js
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export async function POST(req) {
  const { channelName, uid, role } = await req.json();

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const roleType = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    roleType,
    privilegeExpiredTs
  );

  return Response.json({ token });
}
```

### Screen Sharing

```javascript
const startScreenShare = async () => {
  try {
    const screenTrack = await AgoraRTC.createScreenVideoTrack();

    // Replace video track with screen track
    await client.unpublish([localTracks.video]);
    await client.publish([screenTrack]);

    // Play screen locally
    screenTrack.play(localVideoRef.current);

    // Handle screen share stopped
    screenTrack.on('track-ended', () => {
      stopScreenShare();
    });

    setLocalTracks(prev => ({ ...prev, screen: screenTrack }));
  } catch (error) {
    console.error('Screen share error:', error);
  }
};

const stopScreenShare = async () => {
  if (localTracks.screen) {
    localTracks.screen.close();
    await client.unpublish([localTracks.screen]);
    await client.publish([localTracks.video]);
    localTracks.video.play(localVideoRef.current);
  }
};
```

---

## Related Documentation

- [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) - Configuration setup
- [USER_PORTAL.md](./USER_PORTAL.md) - User features using integrations
- [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor features using integrations

---

**Integrations documentation complete!**

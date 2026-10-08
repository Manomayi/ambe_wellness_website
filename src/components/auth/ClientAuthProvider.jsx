"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import WebPushManager from "@/components/notifications/WebPushManager";

export default function ClientAuthProvider({ children }) {
  return (
    <AuthProvider>
      {children}
      <WebPushManager />
    </AuthProvider>
  );
}
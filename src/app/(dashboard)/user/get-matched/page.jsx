"use client";

import GetMatched from '@/components/user/GetMatched';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function GetMatchedPage() {
  return (
    <ProtectedRoute userType="user">
      <GetMatched />
    </ProtectedRoute>
  );
}
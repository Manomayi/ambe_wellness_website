"use client";

import React from "react";

export default function WebLayoutWrapper({
  children,
  maxWidth = "800px",
  className = "",
  contentClassName = "",
}) {
  return (
    <div className={`w-full flex justify-center items-start ${className}`}>
      <div
        style={{ maxWidth }}
        className={`w-full px-4 sm:px-6 py-4 sm:py-6 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

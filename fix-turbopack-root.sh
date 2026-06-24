#!/bin/bash
# Sets turbopack.root so Next.js uses this project (not ~/package-lock.json).
set -euo pipefail
cd "$(dirname "$0")"

TARGET="next.config.mjs"

if [ ! -w "$TARGET" ]; then
  echo "Need write access to $TARGET. Run:"
  echo "  sudo chown \$(whoami):\$(whoami) $TARGET"
  exit 1
fi

cat > "$TARGET" << 'EOF'
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
    ],
  },
};

export default nextConfig;
EOF

echo "Updated $TARGET with turbopack.root."

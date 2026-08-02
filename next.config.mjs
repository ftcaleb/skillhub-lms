import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// KNOWN ISSUE: this repo currently lives under %USERPROFILE%\OneDrive, so
// OneDrive syncs .next — a multi-GB tree Turbopack rewrites continuously.
// OneDrive locks/replaces those files mid-write and corrupts the persistent
// cache, surfacing as "An unexpected Turbopack error occurred".
//
// Two in-place workarounds were tried and both fail; do not retry them:
//   1. distDir outside the project — Turbopack rejects it outright:
//      "Invalid distDirRoot ... should not navigate out of the projectPath".
//   2. .next as a directory junction — Node resolves generated chunks from
//      the junction's real path, so `next/dist/...` externals stop resolving.
//
// The only real fix is to move the repo off OneDrive (e.g. C:\dev\).
// Until then, `Remove-Item -Recurse -Force .next` clears the corruption.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root. Turbopack otherwise infers it by walking up for
  // lockfiles, and a stray package-lock.json in the user profile directory
  // made it root the build at C:\Users\<user> — which puts an unrelated
  // node_modules (including a second copy of React) on the resolution path.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '143.110.154.83',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/moodle/:path*',
        destination: 'http://143.110.154.83/:path*',
      },
    ];
  },
};

export default nextConfig;

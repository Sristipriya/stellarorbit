// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: false, // We're using public/manifest.json manually, or we can configure it here.
        // Actually, better to configure manifest here so it gets injected
        // but for now, we just enable the service worker
        injectRegister: "auto",
        workbox: {
          // Tell workbox not to fail if it finds nothing, we are just mocking PWA for now
          // or we can just leave it empty and let it cache what it finds
          globPatterns: [],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/horizon-testnet\.stellar\.org\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "stellar-api-cache",
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});

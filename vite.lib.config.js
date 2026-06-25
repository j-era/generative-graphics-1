import { resolve } from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import glsl from "vite-plugin-glsl"

/**
 * Library build config. Produces an ESM bundle of the reusable
 * `GenerativeGraphics` component for consumption by other React apps (e.g. the
 * personal website built with Gatsby/webpack).
 *
 * - GLSL shaders are inlined as strings by `vite-plugin-glsl`.
 * - Texture assets are inlined as base64 data URIs (`assetsInlineLimit`), so the
 *   consumer doesn't need to serve any extra files. glTF/draco models are still
 *   fetched at runtime from the host's server root (see README).
 * - React / three / R3F / drei / leva / zustand are externalized so the host
 *   provides a single shared instance of each (peer dependencies).
 */
export default defineConfig({
  plugins: [react(), glsl()],
  build: {
    outDir: "lib",
    emptyOutDir: true,
    copyPublicDir: false,
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      formats: ["es"],
      fileName: () => "generative-graphics.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "leva",
        "zustand",
      ],
    },
  },
})

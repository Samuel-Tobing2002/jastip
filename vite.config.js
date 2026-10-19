import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const isBackoffice = mode === "backoffice";

  return {
    root: isBackoffice
      ? resolve(process.cwd(), "backoffice")
      : process.cwd(),
    plugins: [react(), tailwindcss()],
    build: {
      outDir: isBackoffice
        ? resolve(process.cwd(), "dist-backoffice")
        : resolve(process.cwd(), "dist"),
      emptyOutDir: true,
    },
  };
});
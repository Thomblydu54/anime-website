// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({

  site: "https://anime_application.com",

  base: isProd ? "/anime-website/" : "/",

  vite: {
    plugins: [tailwindcss()],
  },

});
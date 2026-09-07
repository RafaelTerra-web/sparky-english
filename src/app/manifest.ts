import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sparky English",
    short_name: "Sparky",
    description: "Inglês para falantes de português do Brasil.",
    lang: "pt-BR",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f3ec",
    theme_color: "#172f36",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/sparky-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/sparky-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/sparky-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

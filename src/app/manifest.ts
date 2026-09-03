import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sparky English",
    short_name: "Sparky",
    description: "Private, practical English lessons with Sparky.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#172f36",
    icons: [
      { src: "/visuals/sparky-panda.png", sizes: "1024x1536", type: "image/png", purpose: "any" },
    ],
  };
}

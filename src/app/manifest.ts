import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sparky English",
    short_name: "Sparky",
    description: "Inglês para falantes de português do Brasil.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#172f36",
    icons: [
      { src: "/visuals/sparky-panda.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
    ],
  };
}

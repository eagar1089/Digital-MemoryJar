import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Memory Jar",
    short_name: "DMJ",
    description: "AI-powered personal life logger",
    start_url: "/home",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

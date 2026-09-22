import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lumen — Online Tutoring",
    short_name: "Lumen",
    description:
      "Book verified tutors, learn online or in person, and pay securely — a modern tutoring platform for South African students.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf6ec",
    theme_color: "#0d1b2e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

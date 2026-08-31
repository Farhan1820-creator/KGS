import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Learnex Academy",
    short_name: "Learnex Academy",
    description:
      "Premier coaching for PG–Matric, O Level, Intermediate (FSc, ICS, I.Com), Bachelor Degrees, CA (PRC), Canva & MS Office.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFCFF",
    theme_color: "#1E5FA8",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192 512x512",
        type: "image/png",
      },
    ],
  };
}

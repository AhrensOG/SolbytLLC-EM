import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SolbytLLC EM",
    short_name: "Solbyt EM",
    description: "Controla tus gastos personales y compártelos con tu equipo.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf5ff",
    theme_color: "#9333ea",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

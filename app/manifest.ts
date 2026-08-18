import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SolbytLLC EM",
    short_name: "Solbyt EM",
    description: "Controla tus gastos personales y compártelos con tu equipo.",
    start_url: "/dashboard",
    background_color: "#0b0612",
    theme_color: "#171026",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

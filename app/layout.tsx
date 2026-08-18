import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SplashScreen } from "@/components/SplashScreen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

const APPLE_SPLASH_LINKS = [
  { deviceWidth: 320, deviceHeight: 568, ratio: 2, src: "/apple-splash-640x1136.png" },
  { deviceWidth: 375, deviceHeight: 667, ratio: 2, src: "/apple-splash-750x1334.png" },
  { deviceWidth: 414, deviceHeight: 896, ratio: 2, src: "/apple-splash-828x1792.png" },
  { deviceWidth: 375, deviceHeight: 812, ratio: 3, src: "/apple-splash-1125x2436.png" },
  { deviceWidth: 390, deviceHeight: 844, ratio: 3, src: "/apple-splash-1170x2532.png" },
  { deviceWidth: 393, deviceHeight: 852, ratio: 3, src: "/apple-splash-1179x2556.png" },
  { deviceWidth: 428, deviceHeight: 926, ratio: 3, src: "/apple-splash-1284x2778.png" },
  { deviceWidth: 430, deviceHeight: 932, ratio: 3, src: "/apple-splash-1290x2796.png" },
  { deviceWidth: 768, deviceHeight: 1024, ratio: 2, src: "/apple-splash-1536x2048.png" },
  { deviceWidth: 1024, deviceHeight: 1366, ratio: 2, src: "/apple-splash-2048x2732.png" },
];

export const metadata: Metadata = {
  title: "SolbytLLC EM",
  description: "Controla tus gastos personales y compártelos con tu equipo.",
  appleWebApp: {
    capable: true,
    title: "SolbytLLC EM",
    statusBarStyle: "default",
  },
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("sexpense-theme");
    var theme = stored === "light" ? "light" : "dark";
    var root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#171026" : "#faf5ff");
  } catch (e) {}
})();
`;

const criticalSplashCss = `
html { background: #0b0612; }
html:not(.dark) { background: #faf5ff; }
body { background: transparent; }
.splash-critical {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0612;
}
html:not(.dark) .splash-critical { background: #faf5ff; }
@media (min-width: 768px) {
  .splash-critical { display: none; }
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="theme-color" content="#171026" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {APPLE_SPLASH_LINKS.map((link) => (
          <link
            key={link.src}
            rel="apple-touch-startup-image"
            media={`(device-width: ${link.deviceWidth}px) and (device-height: ${link.deviceHeight}px) and (-webkit-device-pixel-ratio: ${link.ratio})`}
            href={link.src}
          />
        ))}
        <link
          rel="apple-touch-startup-image"
          href="/apple-splash-1290x2796.png"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: criticalSplashCss }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

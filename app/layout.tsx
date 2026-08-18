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

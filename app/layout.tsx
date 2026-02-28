import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OndeDoar.io",
  description:
    "OndeDoar.io - Encontre pontos de coleta de doações perto de você",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Providers>{children}</Providers>
          </div>

          <footer className="bg-slate-100 border-t border-slate-200 p-4">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center">
              <a
                href="tel:190"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Polícia Militar: 190
              </a>
              <a
                href="tel:192"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                SAMU: 192
              </a>
              <a
                href="tel:193"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Bombeiros: 193
              </a>
              <a
                href="tel:199"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Defesa Civil: 199
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

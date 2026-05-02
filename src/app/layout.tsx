import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlmereTaxiBoeken — Betrouwbaar Taxivervoer in Almere",
  description:
    "Professioneel taxivervoer in Almere. Vaste tarieven voor luchthavens, zakelijke ritten en particulier vervoer. Direct bevestigd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsBrowserKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    "";
  const hasGoogleMapsBrowserKey = googleMapsBrowserKey.length > 0;
  const browserKeyStartsWithAIza = googleMapsBrowserKey.startsWith("AIza");

  if (process.env.NODE_ENV === "development") {
    console.info("[Google Maps] browser key exists:", hasGoogleMapsBrowserKey);
    console.info("[Google Maps] browser key prefix AIza:", browserKeyStartsWithAIza);
  }

  return (
    <html
      lang="nl"
      className={`${inter.variable} ${playfair.variable} dark scroll-smooth antialiased`}
    >
      <body>
        {children}
        {hasGoogleMapsBrowserKey ? (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsBrowserKey}&libraries=places`}
            strategy="afterInteractive"
          />
        ) : (
          <div
            style={{
              position: "fixed",
              bottom: 12,
              right: 12,
              zIndex: 9999,
              background: "#7f1d1d",
              color: "#fff",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              maxWidth: 360,
            }}
          >
            Google Maps is not configured: set
            ` NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ` in your environment.
          </div>
        )}
      </body>
    </html>
  );
}

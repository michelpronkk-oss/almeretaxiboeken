import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "AlmereTaxiBoeken | Taxi in Almere, Schiphol & Zakelijk Vervoer",
  description:
    "Boek betrouwbaar taxivervoer in Almere. Bereken direct uw ritprijs, betaal veilig online en reserveer taxi, taxibus of luchthavenvervoer.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} ${playfair.variable} dark scroll-smooth antialiased`}
    >
      <body>
        {children}
        {/* Google Maps is now loaded lazily on first address-field focus.
            See src/components/address-autocomplete.tsx → loadGoogleMaps() */}
        {process.env.NODE_ENV === "development" &&
          !process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY && (
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
              Google Maps not configured: set NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY
            </div>
          )}
      </body>
    </html>
  )
}

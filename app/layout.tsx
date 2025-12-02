import { Providers } from "@/components/providers"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Voice-to-Notes",
  description: "Record voice notes, transcribe them, and convert them into structured text notes using AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


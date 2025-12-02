import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In / Register - AI Voice-to-Notes",
  description: "Sign in or register for AI Voice-to-Notes",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


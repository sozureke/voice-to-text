import { NavTabs } from "@/components/nav-tabs"
import { UserStatus } from "@/components/user-status"
import { getSession } from "@/lib/auth-helpers"
import Link from 'next/link'
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="px-4 pb-3 pt-3 mb-4 relative">
        <div className="max-w-7xl mx-auto w-full font-mono text-sm">
          <div className="hidden md:flex items-baseline justify-between gap-4 pb-1">
            <div className="text-white">
              <Link href="/">
                <span>&gt;</span> AI Voice-to-Note
                </Link>
            </div>
            <NavTabs />
            <div className="flex items-baseline gap-2">
              <div className="text-muted-foreground">
                <span>│</span>
              </div>
              <UserStatus />
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden flex flex-col gap-3 pb-1">
            <div className="flex items-baseline justify-between">
              <div className="text-white">
                <span>&gt;</span> v0.1
              </div>
              <UserStatus />
            </div>
            <div className="flex justify-center">
              <NavTabs />
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}

"use client"

import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserStatus() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="font-mono text-sm text-muted-foreground">
        <span>&gt;</span> loading...
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const email = session.user.email || "unknown"

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="font-mono text-sm text-white hover:text-muted-foreground transition-colors cursor-pointer outline-none inline-flex items-baseline">
          <span>&gt;</span> {email}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={4}
        className="bg-black border border-border font-mono min-w-[200px] max-w-[90vw] p-0 shadow-none rounded-none"
      >
        <div className="px-3 py-2 border-b border-border">
          <div className="text-xs text-muted-foreground font-mono">
            <span>&gt;</span> user session
          </div>
        </div>
        <div className="p-0">
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-white hover:bg-muted hover:text-white cursor-pointer focus:bg-muted focus:text-white rounded-none px-3 py-2 text-sm border-b border-border"
          >
            <span>&gt;</span> logout
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


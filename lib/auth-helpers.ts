import { auth } from "@/lib/auth"

export const getSession = async () => {
  return await auth()
}

export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getSession()
  return session?.user?.id || null
}

export const requireAuth = async (): Promise<{ id: string; email: string }> => {
  const session = await getSession()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  return { id: session.user.id, email: session.user.email || "" }
}


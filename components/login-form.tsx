"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          setMessage(`> error: ${data.error}`)
          setIsLoading(false)
          return
        }

        setMessage("> user created. signing in...")
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        router.push("/notes")
        router.refresh()
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setMessage(`> error: invalid email or password.`)
        } else {
          router.push("/notes")
          router.refresh()
        }
      }
    } catch (error) {
      setMessage(`> error: ${error instanceof Error ? error.message : "failed to authenticate"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black border-border rounded-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-mono text-xl text-white">
          <span>&gt;</span> {isRegister ? "register" : "sign in"}
        </CardTitle>
        <CardDescription className="text-muted-foreground font-mono text-sm">
          {isRegister ? "create a new account" : "enter your credentials"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-mono text-white block">
              <span>&gt;</span> email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="bg-black border-border text-white focus:border-white focus:ring-0"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-mono text-white block">
              <span>&gt;</span> password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-black border-border text-white focus:border-white focus:ring-0"
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className="font-mono text-sm text-muted-foreground p-2 bg-black border border-border">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-white text-black hover:bg-muted hover:text-white font-mono font-bold rounded-none border border-border"
          >
            {isLoading ? (
              <>
                <span>&gt;</span> {isRegister ? "registering..." : "signing in..."}
              </>
            ) : (
              <>
                <span>&gt;</span> {isRegister ? "register" : "sign in"}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setMessage("")
            }}
            className="font-mono text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <span>&gt;</span> {isRegister ? "already have an account? sign in" : "need an account? register"}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}


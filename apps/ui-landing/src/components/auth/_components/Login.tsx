"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function Login() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleLogin = async () => {
        if (!isLoaded) return
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            })
        } catch (err: any) {
            console.error("OAuth error", err)
            toast.error("Failed to start Google login")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        if (!email || !password) {
            toast.error("Please provide email and password")
            return
        }

        setIsLoading(true)
        try {
            const result = await signIn.create({
                identifier: email,
                password,
            })

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId })
                toast.success("Welcome back!")
                router.push("/dashboard")
            } else {
                console.log(result)
                toast.error("Something went wrong during sign in")
            }
        } catch (err: any) {
            console.log("Login error", err.errors[0].message)
            const msg = err.errors[0].message || "Invalid credentials"
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Button
                onClick={handleGoogleLogin}
                className='w-full rounded-full text-foreground py-6 border-zinc-200/20 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                variant="outline"
                type="button"
            >
                <Image src="/google.png" alt="Google" width={20} height={20} /> Continue with Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full rounded-full py-6 text-base font-medium"
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </form>
        </div>
    )
}

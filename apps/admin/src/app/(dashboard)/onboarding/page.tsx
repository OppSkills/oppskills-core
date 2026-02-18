"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateAdminPassword } from "@/lib/api/actions"
import { logoutAdmin } from "@/lib/api/auth"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ChangePasswordFormValues = z.infer<typeof formSchema>

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    // Check if user is already onboarded
    useEffect(() => {
        const checkUser = async () => {
            try {
                // We import getMe dynamically or just use fetch to avoid circular deps if any, 
                // but standard import should be fine here as it's a client component.
                const { getMe } = await import("@/lib/api/actions");
                const response = await getMe();
                if (!response.data.isFirstLogin) {
                    router.replace("/");
                }
            } catch (error) {
                console.error("Failed to check user status", error);
            }
        };
        checkUser();
    }, [router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit: SubmitHandler<ChangePasswordFormValues> = async (data) => {
        setLoading(true)
        try {
            await updateAdminPassword({ password: data.password })
            toast.success("Password updated successfully. Please login again.")
            // Force logout or just redirect? 
            // The backend updates the user, invalidating the session might be good practice, 
            // but for now let's redirect to dashboard which should auto-redirect if check fails, 
            // or just reload triggers the check where isFirstLogin is now false.
            logoutAdmin()
        } catch (error: any) {
            console.error(error)
            const message = error?.response?.data?.message || error?.message || "Failed to update password"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Welcome! Setup your password</CardTitle>
                    <CardDescription>
                        Since this is your first time logging in, please create a new password to secure your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password")}
                                    disabled={loading}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register("confirmPassword")}
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set Password & Continue
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

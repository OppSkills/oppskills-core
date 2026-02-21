"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { handleAdminLogin } from "@/lib/api/auth";
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function Login() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await handleAdminLogin(data.email, data.password);
            await refreshUser();
            toast.success("Welcome back, Admin");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-0 sm:px-4 py-0 sm:py-6 lg:px-8">
            <Card className="w-full gap-0 py-0 max-w-md sm:border-border bg-card shadow-none border-0 sm:border sm:shadow-sm relative z-10 transition-all hover:shadow-md">
                <CardHeader className="space-y-4 items-center px-2 sm:px-8  py-8">
                    <div className="relative w-full flex justify-center mb-2 px-8">
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="h-16 w-auto object-contain transition-transform hover:scale-105 duration-300"
                        />
                    </div>
                    <div className="text-center space-y-1.5">
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Admin Access
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">
                            Enter your credentials to manage the platform
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-8 pb-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground text-xs uppercase tracking-wider font-semibold ml-1">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                {...register("email")}
                                disabled={loading}
                                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 pl-4 rounded-md"
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive pl-1 animate-in slide-in-from-left-2 fade-in">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground text-xs uppercase tracking-wider font-semibold ml-1">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                                disabled={loading}
                                className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 pl-4 rounded-md"
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive pl-1 animate-in slide-in-from-left-2 fade-in">{errors.password.message}</p>
                            )}
                        </div>
                        <Button
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border-0 rounded-md font-medium tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
                            type="submit"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border pt-6 pb-8 bg-muted/20">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-muted-foreground font-medium">
                            Secure Administrative Portal
                        </p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

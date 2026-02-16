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

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function Login() {
    const router = useRouter();
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 py-12 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <Card className="w-full max-w-md border-gray-800 bg-gray-950/50 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="space-y-1 items-center pb-8">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-white">Admin Access</CardTitle>
                    <CardDescription className="text-center text-gray-400">
                        Enter your credentials to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                {...register("email")}
                                disabled={loading}
                                className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-blue-600"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                                disabled={loading}
                                className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-blue-600"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
                            type="submit"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
                    <p className="text-xs text-gray-500">
                        Secure Connection • 256-bit Encryption
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

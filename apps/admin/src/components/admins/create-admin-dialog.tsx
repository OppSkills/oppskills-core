"use client"

import { useState } from "react"
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { createAdmin } from "@/lib/api/actions"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    immutable: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type CreateAdminFormValues = z.infer<typeof formSchema>

export function CreateAdminDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
        control,
    } = useForm<CreateAdminFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            immutable: false,
        },
    })

    const password = watch("password")

    // Effect to sync confirmPassword when showPassword is true
    if (showPassword && password) {
        setValue("confirmPassword", password)
    }

    const onSubmit: SubmitHandler<CreateAdminFormValues> = async (data) => {
        setLoading(true)
        try {
            const { confirmPassword, ...payload } = data
            await createAdmin(payload)
            toast.success("Admin created successfully")
            setOpen(false)
            reset()
            setShowPassword(false)
        } catch (error: any) {
            console.error(error)
            const message = error?.response?.data?.message || error?.message || "Failed to create admin"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] sm:max-w-md max-h-[calc(100vh-10rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                    <DialogDescription>
                        Add a new administrator to the system. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit as any)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            {...register("name")}
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            {...register("email")}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
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

                    {!showPassword && (
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                {...register("confirmPassword")}
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-start space-x-2 rounded-md p-4 shadow-sm">
                        <div className="flex items-center h-5">
                            <Controller
                                control={control}
                                name="immutable"
                                render={({ field }) => (
                                    <Checkbox
                                        id="immutable"
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked)
                                            if (checked) {
                                                // Warning logic handled by UI below
                                            }
                                        }}
                                    />
                                )}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="immutable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Make Immutable
                            </Label>

                            {watch("immutable") && (
                                <p className="text-xs text-destructive font-medium mt-1">
                                    This admin will have the power to create or delete ANY other admin along with special privileges.
                                </p>
                            )}
                            {!watch("immutable") && (
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Immutable admins cannot be deleted by others and have higher privileges.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Admin
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

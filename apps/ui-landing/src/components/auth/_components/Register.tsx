"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function Register({ setIsOpenLogin }: { setIsOpenLogin: (mode: boolean) => void }) {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()

    // UI State
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Form States
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [userDetails, setUserDetails] = useState({
        firstName: "",
        lastName: "",
        password: "",
        phone: ""
    })

    // Education States
    const [educationDetails, setEducationDetails] = useState({
        collegeName: "",
        course: "",
        specialisation: "",
        fromYear: "",
        toYear: "",
        gender: "",
        rollNumber: ""
    })

    const [currentSkill, setCurrentSkill] = useState("")
    const [skills, setSkills] = useState<string[]>([])

    // Handlers
    const handleSendOtp = async () => {
        if (!isLoaded) return
        if (!email) {
            toast.error("Please enter an email address")
            return
        }

        setIsLoading(true)
        try {
            await signUp.create({
                emailAddress: email,
            })
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
            setStep(2)
            toast.success("Verification code sent!")
        } catch (err: any) {
            console.log(JSON.stringify(err, null, 2))
            const errorMsg = err.errors?.[0]?.message || "Something went wrong"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!isLoaded) return
        if (!otp) return

        setIsLoading(true)
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: otp,
            })

            if (completeSignUp.status !== "complete") {
                setStep(3)
                toast.success("Email verified!")
            } else {
                setStep(3)
            }
        } catch (err: any) {
            console.log(JSON.stringify(err, null, 2))
            const errorMsg = err.errors?.[0]?.message || "Invalid Code"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userDetails.firstName || !userDetails.password) {
            toast.error("Please fill in all required fields")
            return
        }
        setStep(4)
    }

    const handleEducationSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Simple validation
        if (!educationDetails.collegeName || !educationDetails.course || !educationDetails.gender) {
            toast.error("Please fill in required education fields")
            return
        }
        setStep(5)
    }

    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault()
            const skill = currentSkill.trim()
            if (!skills.includes(skill)) {
                setSkills([...skills, skill])
            }
            setCurrentSkill("")
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(skill => skill !== skillToRemove))
    }

    const handleFinalRegister = async () => {
        if (!isLoaded) return
        setIsLoading(true)
        try {
            // Update user details
            await signUp.update({
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                password: userDetails.password,
                unsafeMetadata: {
                    phone: userDetails.phone,
                    education: educationDetails,
                    skills: skills
                }
            })

            // Check status
            if (signUp.status === 'complete') {
                await setActive({ session: signUp.createdSessionId })
                toast.success("Registration Successful!")
                setIsOpenLogin(false)
                router.push("/dashboard")
            } else {
                console.log("Signup status:", signUp.status)
                toast.error("Need more information to complete registration")
            }

        } catch (err: any) {
            console.log(JSON.stringify(err, null, 2))
            const errorMsg = err.errors?.[0]?.message || "Registration failed"
            toast.error(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    // Navigation Step Click Handler
    const handleStepClick = (s: number) => {
        if (s < step) {
            setStep(s)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div id="clerk-captcha"></div>
            {/* Steps Indicator - Clickable */}
            <div className="flex justify-between mb-4 px-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        onClick={() => handleStepClick(i)}
                        disabled={i > step}
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors border-none outline-none focus:ring-2 ring-offset-1 focus:ring-primary ${step >= i ? "bg-primary text-primary-foreground cursor-pointer" : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}>
                        {step > i ? <Check className="w-4 h-4" /> : i}
                    </button>
                ))}
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleSendOtp}
                        disabled={isLoading || !email}
                        className="w-full rounded-full py-6"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Send OTP
                    </Button>
                </div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">We sent a code to <span className="font-medium text-foreground">{email}</span></p>
                        <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline mt-1">Change email</button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="otp">Enter 6-digit Code</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest letter-spacing-2"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full rounded-full py-6"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Verify Code
                    </Button>
                </div>
            )}

            {/* Step 3: Personal Details */}
            {step === 3 && (
                <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                value={userDetails.firstName}
                                onChange={(e) => setUserDetails({ ...userDetails, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                value={userDetails.lastName}
                                onChange={(e) => setUserDetails({ ...userDetails, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            placeholder="+1 234 567 890"
                            value={userDetails.phone}
                            onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pass">Password</Label>
                        <Input
                            id="pass"
                            type="password"
                            placeholder="••••••••"
                            value={userDetails.password}
                            onChange={(e) => setUserDetails({ ...userDetails, password: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full rounded-full py-6">
                        Next: Education
                    </Button>
                </form>
            )}

            {/* Step 4: Educational Details */}
            {step === 4 && (
                <form onSubmit={handleEducationSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label htmlFor="college">College Name</Label>
                        <Select
                            value={educationDetails.collegeName}
                            onValueChange={(val) => setEducationDetails({ ...educationDetails, collegeName: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select your college" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mit">MIT</SelectItem>
                                <SelectItem value="stanford">Stanford University</SelectItem>
                                <SelectItem value="iit_bombay">IIT Bombay</SelectItem>
                                <SelectItem value="bits_pilani">BITS Pilani</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Input
                                id="course"
                                placeholder="B.Tech, B.Sc..."
                                value={educationDetails.course}
                                onChange={(e) => setEducationDetails({ ...educationDetails, course: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialisation">Specialisation</Label>
                            <Input
                                id="specialisation"
                                placeholder="CSE, ECE..."
                                value={educationDetails.specialisation}
                                onChange={(e) => setEducationDetails({ ...educationDetails, specialisation: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fromYear">From Year</Label>
                            <Input
                                id="fromYear"
                                type="number"
                                placeholder="2020"
                                value={educationDetails.fromYear}
                                onChange={(e) => setEducationDetails({ ...educationDetails, fromYear: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="toYear">To Year</Label>
                            <Input
                                id="toYear"
                                type="number"
                                placeholder="2024"
                                value={educationDetails.toYear}
                                onChange={(e) => setEducationDetails({ ...educationDetails, toYear: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={educationDetails.gender}
                                onValueChange={(val) => setEducationDetails({ ...educationDetails, gender: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rollNumber">Roll Number</Label>
                            <Input
                                id="rollNumber"
                                placeholder="Your ID/Roll No"
                                value={educationDetails.rollNumber}
                                onChange={(e) => setEducationDetails({ ...educationDetails, rollNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full rounded-full py-6">
                        Next: Skills
                    </Button>
                </form>
            )}

            {/* Step 5: Skills */}
            {step === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label>Add Your Skills</Label>
                        <p className="text-xs text-muted-foreground">Type a skill and press Enter to add it.</p>
                        <div className="min-h-[100px] p-3 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                        {skill}
                                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <input
                                className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                                placeholder={skills.length === 0 ? "e.g. React, UX Design..." : ""}
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                onKeyDown={handleAddSkill}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleFinalRegister}
                        disabled={isLoading}
                        className="w-full rounded-full py-6"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Complete Registration
                    </Button>
                </div>
            )}
        </div>
    )
}

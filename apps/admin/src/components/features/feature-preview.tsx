"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Save, Calendar, MapPin, Users, Globe, Info, Undo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import RichTextEditor from "@/components/ui/editor/RichtextEditor"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { toggleFeatureApproval, updateFeatureDetail, ApprovalStatus } from "@/lib/api/actions"

interface FeaturePreviewProps {
    type: 'hackathon' | 'event' | 'festival';
    data: any;
}

export function FeaturePreview({ type, data: initialData }: FeaturePreviewProps) {
    const router = useRouter()
    const [data, setData] = useState(initialData)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleApproval = async (status: ApprovalStatus) => {
        setLoading(true)
        try {
            await toggleFeatureApproval(type, data.id, status)
            toast.success(`${type} status updated to ${status} successfully`)
            setData({ ...data, approvalStatus: status })
        } catch (error) {
            console.error("Failed to update status", error)
            toast.error("Failed to update status. Ensure the item is PUBLISHED.")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Sanitize data: remove nested objects and calculated fields Prisma might not like
            const {
                owner,
                organizer,
                attachments,
                rounds,
                prizeBreakdown,
                registrationCount,
                createdAt,
                updatedAt,
                id: _id, // Already passed as param
                slug: _slug,
                ...sanitizedData
            } = data;

            await updateFeatureDetail(type, data.id, sanitizedData)
            setIsEditing(false)
            toast.success("Changes saved successfully")
        } catch (error) {
            console.error("Failed to save changes", error)
            toast.error("Failed to save changes")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }))
    }

    const isPublished = data.status === 'PUBLISHED';
    const approvalStatus = data.approvalStatus;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10 py-4 border-b">
                <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {isEditing ? (
                        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            Edit Details
                        </Button>
                    )}

                    {!isEditing && (
                        <>
                            {isPublished ? (
                                <>
                                    {approvalStatus === 'PENDING' && (
                                        <>
                                            <Button
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApproval('APPROVED')}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                            </Button>
                                            <Button
                                                disabled={loading}
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                                onClick={() => handleApproval('REJECTED')}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {approvalStatus === 'APPROVED' && (
                                        <Button
                                            disabled={loading}
                                            variant="outline"
                                            className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                                            onClick={() => handleApproval('PENDING')}
                                        >
                                            <Undo className="h-4 w-4" />
                                            Revert to Pending
                                        </Button>
                                    )}
                                    {approvalStatus === 'REJECTED' && (
                                        <Button
                                            disabled={loading}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApproval('APPROVED')}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Approve
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 py-1">
                                    Approval available only for PUBLISHED items
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 w-full">
                                    {isEditing ? (
                                        <Input
                                            value={data.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="text-2xl font-bold h-auto py-1"
                                        />
                                    ) : (
                                        <CardTitle className="text-3xl">{data.name}</CardTitle>
                                    )}
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="capitalize">{type}</Badge>
                                        <Badge variant={data.approvalStatus === 'APPROVED' ? 'default' : data.approvalStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
                                            {data.approvalStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    Description
                                </Label>
                                {isEditing ? (
                                    <RichTextEditor
                                        value={data.description}
                                        onChange={(content) => handleChange('description', content)}
                                        placeholder="Enter description..."
                                    />
                                ) : (
                                    <div
                                        className="rich-text-content text-lg leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: data.description || 'No description provided.' }}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Starts At
                                    </Label>
                                    {isEditing ? (
                                        <Input type="datetime-local" value={data.startDate.split('Z')[0]} onChange={(e) => handleChange('startDate', e.target.value + 'Z')} />
                                    ) : (
                                        <p className="font-medium">{new Date(data.startDate).toLocaleString()}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Ends At
                                    </Label>
                                    {isEditing ? (
                                        <Input type="datetime-local" value={data.endDate?.split('Z')[0]} onChange={(e) => handleChange('endDate', e.target.value + 'Z')} />
                                    ) : (
                                        <p className="font-medium">{data.endDate ? new Date(data.endDate).toLocaleString() : 'N/A'}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location & Organization */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Type</Label>
                                    <p className="font-medium capitalize">{data.locationType}</p>
                                </div>
                                {data.locationType === 'PHYSICAL' ? (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Address</Label>
                                            {isEditing ? (
                                                <Input value={data.locationAddress} onChange={(e) => handleChange('locationAddress', e.target.value)} />
                                            ) : (
                                                <p className="font-medium">{data.locationAddress}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">City</Label>
                                            {isEditing ? (
                                                <Input value={data.locationCity} onChange={(e) => handleChange('locationCity', e.target.value)} />
                                            ) : (
                                                <p className="font-medium">{data.locationCity}</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Virtual Link</Label>
                                        {isEditing ? (
                                            <Input value={data.locationVirtualLink} onChange={(e) => handleChange('locationVirtualLink', e.target.value)} />
                                        ) : (
                                            <a href={data.locationVirtualLink} target="_blank" className="font-medium text-primary hover:underline block truncate">
                                                {data.locationVirtualLink}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Organization
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    {isEditing ? (
                                        <Input value={data.organizationName} onChange={(e) => handleChange('organizationName', e.target.value)} />
                                    ) : (
                                        <p className="font-medium">{data.organizationName}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Contact/Link</Label>
                                    {isEditing ? (
                                        <Input value={data.contactEmail || data.websiteUrl} onChange={(e) => handleChange(data.contactEmail ? 'contactEmail' : 'websiteUrl', e.target.value)} />
                                    ) : (
                                        <p className="font-medium">{data.contactEmail || data.websiteUrl || 'N/A'}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Sidebar Stats */}
                <div className="flex flex-col gap-6">
                    {(type === 'event' || type === 'hackathon') && (
                        <Card className="py-0">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Registration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={data.isFree ? "secondary" : "default"}>
                                        {data.isFree ? "Free" : "Paid"}
                                    </Badge>
                                </div>
                                {!data.isFree && (
                                    <div className="flex justify-between items-center py-2 border-b border-muted">
                                        <span className="text-muted-foreground">Entry Fee</span>
                                        <span className="font-bold">{data.currency} {data.entryFeeAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                    <span className="text-muted-foreground">Capacity</span>
                                    <span className="font-medium">{data.maxUsers || data.maxTeams || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Registered</span>
                                    <span className="font-medium">{data.registrationCount || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="overflow-hidden py-0">
                        <img
                            src={data.bannerImageUrl || data.posterImageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop"}
                            alt="Cover"
                            className="w-full h-48 object-cover"
                        />
                        <CardContent className="p-4">
                            <Label className="text-xs text-muted-foreground mb-2 block">Media Preview</Label>
                            <p className="text-sm text-muted-foreground italic">Current banner/poster image</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

"use client"

import { FeaturePreview } from "@/components/features/feature-preview"
import { getFeatureDetail } from "@/lib/api/actions"
import { use, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function HackathonPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getFeatureDetail('hackathon', slug)
                setData(response.data)
            } catch (error) {
                console.error("Failed to fetch hackathon detail", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [slug])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading hackathon details...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
                <p className="text-xl font-semibold">Hackathon Not Found</p>
                <p className="text-muted-foreground">The hackathon you are looking for does not exist or has been removed.</p>
            </div>
        )
    }

    return <FeaturePreview type="hackathon" data={data} />
}

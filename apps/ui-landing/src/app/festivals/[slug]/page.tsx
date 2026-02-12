import type { Metadata } from "next";
import FestivalDetailsClient from "./_components/FestivalDetailsClient";
import { getFestivalBySlug } from "@/lib/api/festivalApi";
import { getPublicHackathons } from "@/lib/api/hackathonApi";
import { getPublicEvents } from "@/lib/api/eventApi";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getFestivalData(slug: string) {
    try {
        const festival = await getFestivalBySlug(null, slug);
        return festival as any;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const festival = await getFestivalData(slug);

    if (!festival) {
        return {
            title: "Festival Not Found | OppSkills",
            description: "The requested festival could not be found.",
        };
    }

    const title = `${festival.name} | OppSkills`;
    // Strip HTML from description for meta description
    const description = festival.description
        ? festival.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Join ${festival.name} at OppSkills.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://oppskills.com/festivals/${festival.slug}`,
            siteName: "OppSkills",
            images: festival.posterImageUrl
                ? [
                    {
                        url: `https://api.oppskills.com/image/serve?url=${festival.posterImageUrl}`,
                        width: 1200,
                        height: 630,
                        alt: festival.name,
                    },
                ]
                : undefined,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: festival.posterImageUrl
                ? [`https://api.oppskills.com/image/serve?url=${festival.posterImageUrl}`]
                : undefined,
        },
        alternates: {
            canonical: `https://oppskills.com/festivals/${festival.slug}`,
        },
    };
}

export default async function FestivalPage({ params }: Props) {
    const { slug } = await params;
    const festival = await getFestivalData(slug);

    if (!festival) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Festival Not Found</h1>
                <p className="text-muted-foreground">
                    The festival you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
            </div>
        );
    }

    // Fetch Hackathons and Events for this festival
    // Note: getPublicHackathons/getPublicEvents returns an array or paginated result depending on implementation.
    // Checking api implementation: returns PublicHackathonListItem[] directly.
    const hackathons = await getPublicHackathons({ festival_id: festival.id });
    const events = await getPublicEvents({ festival_id: festival.id });

    // Handle potential different response structures (if paginated vs array)
    // Based on api file 'getPublicHackathons' returns 'PublicHackathonListItem[]'
    // 'getPublicEvents' returns 'unknown' casted, but typically it might be paginated or array.
    // Let's assume it returns array or { data: [] } or similar, strict typing would help.
    // For now, we'll cast safely in the client component or here.

    // Safe cast helper
    const safeList = (data: any) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.items)) return data.items;
        return [];
    };

    const festivalSchema = {
        "@context": "https://schema.org",
        "@type": "Festival",
        name: festival.name,
        description: festival.description?.replace(/<[^>]*>/g, ""),
        startDate: festival.startDate,
        endDate: festival.endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode:
            festival.locationType === "ONLINE" || festival.locationType === "VIRTUAL"
                ? "https://schema.org/OnlineEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
        location:
            festival.locationType === "ONLINE" || festival.locationType === "VIRTUAL"
                ? {
                    "@type": "VirtualLocation",
                    url: festival.locationVirtualLink || "https://oppskills.com",
                }
                : {
                    "@type": "Place",
                    name: festival.locationAddress || "TBD",
                    address: {
                        "@type": "PostalAddress",
                        addressLocality: festival.locationCity,
                        addressCountry: "IN",
                    },
                },
        image: festival.posterImageUrl
            ? [`https://api.oppskills.com/image/serve?url=${festival.posterImageUrl}`]
            : undefined,
        organizer: {
            "@type": "Organization",
            name: festival.organizationName || "OppSkills",
            logo: festival.organizationLogoUrl,
            url: festival.websiteUrl,
        },
        url: `https://oppskills.com/festivals/${festival.slug}`,
    };

    return (
        <>
            <JsonLd data={festivalSchema} />
            <FestivalDetailsClient
                festival={festival}
                hackathons={safeList(hackathons)}
                events={safeList(events)}
            />
        </>
    );
}

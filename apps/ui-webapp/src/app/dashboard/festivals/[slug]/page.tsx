"use client"
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function FestivalPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = React.use(params);
    const route = useRouter();
    useEffect(() => {
        if (!slug) return;
        route.push(`/dashboard/festivals/${slug}/settings`);
    }, [slug]);
    return null;
}

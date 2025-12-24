import { MetadataRoute } from "next";

// In a real application, you would import these from your API client
// import { getEvents } from "@/lib/api/eventApi";
// import { getHackathons } from "@/lib/api/hackathonApi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://oppskills.com";

  // Static routes
  const routes = [
    "",
    "/about",
    "/competitions",
    "/events",
    "/contact",
    "/communities",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }));

  // Dynamic routes would be fetched here
  // const events = await getEvents();
  // const eventRoutes = events.map((event) => ({
  //   url: `${baseUrl}/events/${event.slug}`,
  //   lastModified: new Date(event.updatedAt),
  //   changeFrequency: "weekly" as const,
  //   priority: 0.8,
  // }));

  return [
    ...routes,
    // ...eventRoutes,
  ];
}

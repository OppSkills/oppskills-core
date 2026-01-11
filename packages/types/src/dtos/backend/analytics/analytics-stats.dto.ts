export interface AnalyticsGeneralStatsDto {
    registrations: number;
    views: string; // BigInt serialized as string
    impressions: string; // BigInt serialized as string
}

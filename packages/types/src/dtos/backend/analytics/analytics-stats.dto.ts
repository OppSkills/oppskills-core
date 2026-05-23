export interface AnalyticsGeneralStatsDto {
  registrations: number; // Global total
  periodRegistrations: number; // Count for the selected date range
  views: string; // BigInt serialized as string
  impressions: string; // BigInt serialized as string
}

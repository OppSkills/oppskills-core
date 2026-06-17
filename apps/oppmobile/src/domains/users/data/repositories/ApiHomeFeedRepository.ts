import { apiClient } from '../../../../shared/api/apiClient';
import type { HomeFeedEntity, HomeOpportunityItemEntity, HomeEventItemEntity } from '../../domain/entities/HomeFeed';
import type { HomeFeedRepository } from '../../domain/repositories/HomeFeedRepository';
import { mapHomeFeed } from '../mappers/mapHomeFeed';

export class ApiHomeFeedRepository implements HomeFeedRepository {
  async getFeed(): Promise<HomeFeedEntity> {
    const baseFeed = mapHomeFeed();

    try {
      const [hackathons, events] = await Promise.all([
        apiClient.get<Record<string, unknown>[]>('/hackathons/public?appendResults=true'),
        apiClient.get<Record<string, unknown>[]>('/events/public?appendResults=true'),
      ]);

      const mapOpp = (item: Record<string, unknown>, kind: 'Hackathon' | 'Competition' | 'Event'): HomeOpportunityItemEntity => {
        let eventDate = 'TBD';
        if (item.startDate) {
          eventDate = new Date(item.startDate as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }

        let registerBy = 'TBD';
        if (item.registrationDeadline) {
          registerBy = new Date(item.registrationDeadline as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }

        let prizeLabel = item.isFree ? 'Free' : (item.entryFeeAmount ? `${(item.currency as string) || '$'} ${item.entryFeeAmount}` : 'Paid');
        if (kind === 'Hackathon' || kind === 'Competition') {
          prizeLabel = item.prizeTotalWorthAmount ? `${(item.currency as string) || '$'} ${item.prizeTotalWorthAmount}` : 'TBD';
        }

        const mode = item.locationType === 'VIRTUAL' ? 'Online' : 'Offline';
        const fee = item.isFree ? 'Free' : `₹${item.entryFeeAmount ?? ''}`;
        const modeLabel = `${fee} · ${mode}`;

        return {
          id: (item.id as string) || (item.slug as string),
          title: (item.name as string) || (item.title as string) || '',
          kind,
          host: (item.organizationName as string) || 'OppSkills',
          eventDate,
          registerBy,
          prizeLabel,
          modeLabel,
          imageUrl: (item.bannerImageUrl as string) || undefined,
        };
      };

      const topOpportunities = [
        ...(hackathons || []).map((item: Record<string, unknown>) =>
          (item.hackathonType as string) === 'CASE_STUDY_COMPETITION' ? mapOpp(item, 'Competition') : mapOpp(item, 'Hackathon'),
        ),
        ...(events || []).map((item: Record<string, unknown>) => mapOpp(item, 'Event')),
      ].slice(0, 6);

      const listedCompetitions = (hackathons || [])
        .filter((h: Record<string, unknown>) => (h.hackathonType as string) === 'CASE_STUDY_COMPETITION')
        .map((h: Record<string, unknown>) => mapOpp(h, 'Competition'))
        .slice(0, 6);

      const upcomingEvents = (events || [])
        .slice(0, 6)
        .map((e: Record<string, unknown>): HomeEventItemEntity => ({
          id: (e.id as string) || (e.slug as string),
          title: (e.name as string) || (e.title as string) || '',
          venue: (e.locationType as string) === 'PHYSICAL' ? ((e.locationCity as string) || (e.locationAddress as string) || 'Offline') : 'Online',
          timing: e.startDate ? new Date(e.startDate as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'TBD',
          attendees: (e.registrationCount as number) || 0,
          imageUrl: (e.bannerImageUrl as string) || undefined,
        }));

      return {
        ...baseFeed,
        topOpportunities,
        listedCompetitions,
        upcomingEvents,
      };
    } catch (error) {
      console.warn('Failed to fetch real feed data', error);
      return baseFeed;
    }
  }
}

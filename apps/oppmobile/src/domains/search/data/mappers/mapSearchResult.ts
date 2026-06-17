import { SearchResultEntity } from '../../domain/entities/SearchCatalog';

export function mapOpportunityToSearchResult(opp: Record<string, unknown>, kind: 'hackathon' | 'competition' | 'event'): SearchResultEntity {
  // Use organizationName or fallback
  const host = (opp.organizationName as string) || 'OppSkills';
  
  // Format date
  let eventDate = 'TBD';
  if (opp.startDate) {
    const d = new Date(opp.startDate as string);
    eventDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  // Format registerBy
  let registerBy = 'TBD';
  if (opp.registrationDeadline) {
    const d = new Date(opp.registrationDeadline as string);
    registerBy = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  // Format value
  let valueLabel = 'Entry Fee';
  let value = opp.isFree ? 'Free' : (opp.entryFeeAmount ? `${(opp.currency as string) || '$'} ${opp.entryFeeAmount}` : 'Paid');
  
  if (kind === 'hackathon' || kind === 'competition') {
    valueLabel = 'Prizes';
    value = opp.prizeTotalWorthAmount ? `${(opp.currency as string) || '$'} ${opp.prizeTotalWorthAmount}` : 'TBD';
  }

  return {
    id: (opp.id as string) || (opp.slug as string),
    title: (opp.name as string) || (opp.title as string) || '',
    host,
    tagLabel: kind === 'hackathon' ? 'Hackathon' : kind === 'competition' ? 'Competition' : 'Event',
    kind,
    eventDate,
    registerBy,
    valueLabel,
    value,
    tone: 'violet',
  };
}

import { TeamDetailResponse } from "@/lib/api/teamApi";
import { CompetitionDetails, RegistrationField } from "./types";

export interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: CompetitionDetails;
  onSuccess?: (response: any) => void;
  initialMode?: RegistrationMode;
  initialInvitationCode?: string;
  type?: "HACKATHON" | "EVENT";
  /** Paid/free team exists but registration answers were not saved; submit without payment */
  completionMode?: boolean;
  /** Tier chosen on the opportunity detail page before opening the modal */
  pageSelectedTicketTierId?: string | null;
  /** When true, in-modal tier cards are hidden (selection already on the page) */
  omitTicketTierSection?: boolean;
  /** Saved answers from a previous checkout draft (paid events) */
  prefillAnswers?: Array<{ fieldId: string; value: unknown }> | null;
  paymentCompleted?: boolean;
  teamId?: string;
  isLeader?: boolean;
}

export type RegistrationMode = "CREATE" | "JOIN";

export interface UserDataForPrefill {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  collegeName?: string;
  companyName?: string;
  schoolName?: string;
}

export interface CreateTeamFormContentProps {
  fields: RegistrationField[];
  answers: Record<string, any>;
  onUpdateAnswer: (fieldId: string, value: any) => void;
  teamName: string;
  setTeamName: (name: string) => void;
  onFileSelect: (
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  isUploading: boolean;
  uploadedFiles: Record<string, { name: string; url: string }>;
  isIndividual?: boolean;
  isFree?: boolean;
  entryFeeAmount?: number | null;
  feeBearer?: "ORGANISER" | "PARTICIPANT";
  discountCode?: string;
  setDiscountCode?: (code: string) => void;
  isOpenToggle: boolean;
  setIsOpenToggle: (value: boolean) => void;
  type?: "HACKATHON" | "EVENT";
  /** Hide team name / fee / discount; show completion notice (hackathon only) */
  completionMode?: boolean;
  paymentCompleted?: boolean;
  ticketTiers?: any[];
  ticketTierId?: string;
  setTicketTierId?: (id: string) => void;
  /** Hide tier list when tiers were chosen on the detail page */
  omitTicketTierSection?: boolean;
}

export interface JoinTeamFormContentProps {
  fields: RegistrationField[];
  answers: Record<string, any>;
  onUpdateAnswer: (fieldId: string, value: any) => void;
  invitationCode: string;
  setInvitationCode: (code: string) => void;
  teams: TeamDetailResponse[];
  isLoadingTeams: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onJoinTeam: (code: string) => void;
  onFileSelect: (
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  isUploading: boolean;
  uploadedFiles: Record<string, { name: string; url: string }>;
  slug: string;
}

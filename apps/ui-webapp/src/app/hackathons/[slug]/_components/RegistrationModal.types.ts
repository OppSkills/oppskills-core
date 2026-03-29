import { TeamDetailResponse } from "@/lib/api/teamApi";
import { CompetitionDetails, RegistrationField } from "./types";

export interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: CompetitionDetails;
  onSuccess?: (team: TeamDetailResponse) => void;
  initialMode?: RegistrationMode;
  initialInvitationCode?: string;
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
  onFileSelect: (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onFileSelect: (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadedFiles: Record<string, { name: string; url: string }>;
  slug: string;
}
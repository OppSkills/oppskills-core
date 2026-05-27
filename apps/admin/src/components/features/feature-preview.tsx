"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
  Calendar,
  MapPin,
  Users,
  Earth,
  Info,
  Undo,
  Shield,
  DollarSign,
  Settings,
  Hash,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  toggleFeatureApproval,
  updateFeatureDetail,
  ApprovalStatus,
} from "@/lib/api/actions";
import { cn } from "@/lib/utils";

interface FeaturePreviewProps {
  type: "hackathon" | "event" | "festival";
  data: any;
}

// Enum values from schema.prisma
const ENUM_VALUES: Record<string, string[]> = {
  lifecycleStatus: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"],
  approvalStatus: ["PENDING", "APPROVED", "REJECTED"],
  visibility: ["PUBLIC", "PRIVATE", "UNIVERSITY_ONLY"],
  locationType: ["PHYSICAL", "VIRTUAL"],
  hackathonMode: ["ONLINE", "OFFLINE", "HYBRID"],
  hackathonType: [
    "CODING_HACKATHON",
    "IDEA_HACKATHON",
    "CASE_STUDY_COMPETITION",
    "DESIGN_HACKATHON",
    "OPEN_HACKATHON",
  ],
  participantType: [
    "INDIVIDUAL",
    "TEAM_OF_2",
    "TEAM_OF_3",
    "TEAM_OF_4",
    "TEAM_OF_5",
    "TEAM_OF_6",
    "MORE_THAN_6",
    "TEAM_OF_2_3",
    "TEAM_OF_2_4",
    "TEAM_OF_3_4",
    "TEAM_OF_3_5",
    "TEAM_OF_4_5",
    "TEAM_OF_4_6",
    "TEAM_OF_5_6",
  ],
  eventType: [
    "WORKSHOP",
    "CONFERENCE",
    "MEETUP",
    "NETWORKING",
    "SEMINAR",
    "WEBINAR",
    "OTHER",
  ],
  passSendingMode: ["IMMEDIATE", "APPROVAL"],
  collegeMatchMode: [
    "PROFILE_ONLY",
    "EMAIL_ONLY",
    "EITHER_OR",
    "BOTH_REQUIRED",
  ],
  experienceLevel: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
  teamPreference: [
    "LOOKING_FOR_TEAM",
    "HAVE_TEAM",
    "OPEN_TO_EITHER",
    "PREFER_SOLO",
  ],
};

// Precise field mapping based on Prisma schema to ensure correct rendering and error handling
const FIELD_METADATA: Record<
  string,
  {
    type:
      | "string"
      | "datetime"
      | "boolean"
      | "enum"
      | "number"
      | "richtext"
      | "url"
      | "json";
    enumKey?: string;
  }
> = {
  // Basic Info
  name: { type: "string" },
  slug: { type: "string" },
  description: { type: "richtext" },
  status: { type: "enum", enumKey: "lifecycleStatus" },
  visibility: { type: "enum", enumKey: "visibility" },

  // Dates
  startDate: { type: "datetime" },
  endDate: { type: "datetime" },
  registrationDeadline: { type: "datetime" },
  approvalSubmittedAt: { type: "datetime" },
  approvalApprovedAt: { type: "datetime" },
  approvalRejectedAt: { type: "datetime" },

  // Type/Mode
  mode: { type: "enum", enumKey: "hackathonMode" },
  hackathonType: { type: "enum", enumKey: "hackathonType" },
  participantType: { type: "enum", enumKey: "participantType" },
  eventType: { type: "enum", enumKey: "eventType" },

  // Location
  locationType: { type: "enum", enumKey: "locationType" },
  locationAddress: { type: "string" },
  locationCoords: { type: "string" },
  locationVirtualLink: { type: "url" },

  // Pricing
  isFree: { type: "boolean" },
  entryFeeAmount: { type: "number" },
  currency: { type: "string" },
  chargeMode: { type: "enum", enumKey: "hackathonChargeMode" },
  prizeTotalWorthAmount: { type: "number" },
  prizeDescription: { type: "json" },
  prizeCertificate: { type: "boolean" },

  // Organization
  organizationName: { type: "string" },
  organizationLogoUrl: { type: "url" },
  websiteUrl: { type: "url" },
  contactName: { type: "string" },
  contactEmail: { type: "string" },
  contactPhone: { type: "string" },

  // Settings
  isRegistrationPaused: { type: "boolean" },
  passSendingMode: { type: "enum", enumKey: "passSendingMode" },
  collegeRestrictionEnabled: { type: "boolean" },
  collegeMatchMode: { type: "enum", enumKey: "collegeMatchMode" },

  // Metadata
  approvalStatus: { type: "enum", enumKey: "approvalStatus" },
  approvalNote: { type: "string" },
  bannerImageUrl: { type: "url" },
  posterImageUrl: { type: "url" },
};

const EXCLUDED_FIELDS = [
  "id",
  "owner",
  "organizer",
  "createdAt",
  "updatedAt",
  "attachments",
  "rounds",
  "prizeBreakdown",
  "registrationCount",
  "registrationForm",
  "teams",
  "participants",
  "userRoles",
  "registrationSubmissions",
  "eventPasses",
  "payments",
  "discountCodes",
  "payouts",
  "ownerId",
  "organizerId",
  "festival",
  "festivalId",
  "impressions",
  "views",
  "allowedUniversities",
  "freeCollegeIds",
  "attendeeEligibility",
  "allowedCollegeIds",
  "allowedEmailDomains",
];

export function FeaturePreview({
  type,
  data: initialData,
}: FeaturePreviewProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApproval = async (status: ApprovalStatus) => {
    setLoading(true);
    try {
      await toggleFeatureApproval(type, data.id, status);
      toast.success(`${type} status updated to ${status} successfully`);
      setData({ ...data, approvalStatus: status });
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status. Ensure the item is PUBLISHED.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { ...sanitizedData } = data;
      // Clean up fields that Prisma shouldn't receive
      EXCLUDED_FIELDS.forEach((field) => delete (sanitizedData as any)[field]);
      // Remove nulls for non-nullable fields if necessary or keep them for optional ones

      await updateFeatureDetail(type, initialData.id, sanitizedData);
      setIsEditing(false);
      toast.success("Changes saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to save changes", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderField = (key: string, value: any) => {
    const metadata = FIELD_METADATA[key];
    if (!metadata || EXCLUDED_FIELDS.includes(key)) return null;

    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
    const { type: fieldType, enumKey } = metadata;
    const options = enumKey ? ENUM_VALUES[enumKey] : null;

    if (!isEditing) {
      let displayValue = value;
      if (fieldType === "datetime" && value)
        displayValue = new Date(value).toLocaleString();
      if (fieldType === "boolean") displayValue = value ? "Yes" : "No";
      if (fieldType === "json") displayValue = JSON.stringify(value);
      if (value === null || value === undefined) displayValue = "N/A";

      return (
        <div
          key={key}
          className="space-y-1 py-1 border-b border-muted/50 last:border-0"
        >
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </Label>
          {fieldType === "richtext" ? (
            <div
              className="text-sm rich-text-content"
              dangerouslySetInnerHTML={{ __html: value || "No description" }}
            />
          ) : fieldType === "url" && value ? (
            <a
              href={value}
              target="_blank"
              className="font-medium text-sm text-primary hover:underline block truncate"
            >
              {String(value)}
            </a>
          ) : (
            <p className="font-medium text-sm break-all">
              {String(displayValue)}
            </p>
          )}
        </div>
      );
    }

    // Editing mode
    return (
      <div key={key} className="space-y-2 py-2">
        <Label className="text-sm font-medium">{label}</Label>
        {options ? (
          <Select value={value} onValueChange={(val) => handleChange(key, val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : fieldType === "richtext" ? (
          <RichTextEditor
            value={value}
            onChange={(content) => handleChange(key, content)}
          />
        ) : fieldType === "boolean" ? (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        ) : fieldType === "datetime" ? (
          <Input
            type="datetime-local"
            value={(() => {
              if (!value) return "";
              const date = new Date(value);
              return isNaN(date.getTime())
                ? ""
                : date.toISOString().slice(0, 16);
            })()}
            onChange={(e) =>
              handleChange(
                key,
                e.target.value ? new Date(e.target.value).toISOString() : null,
              )
            }
          />
        ) : fieldType === "json" ? (
          <Textarea
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : (value ?? "")
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(key, parsed);
              } catch {
                handleChange(key, e.target.value);
              }
            }}
            placeholder="Enter JSON content..."
          />
        ) : (
          <Input
            type={fieldType === "number" ? "number" : "text"}
            value={value ?? ""}
            onChange={(e) =>
              handleChange(
                key,
                fieldType === "number"
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
          />
        )}
      </div>
    );
  };

  // Categorized dynamic groups
  const keys = Object.keys(data).filter(
    (k) => !EXCLUDED_FIELDS.includes(k) && FIELD_METADATA[k],
  );

  const locationFields = keys.filter((k) =>
    k.toLowerCase().includes("location"),
  );
  const mediaFields = keys.filter(
    (k) =>
      k.toLowerCase().includes("image") ||
      k.toLowerCase().includes("logo") ||
      k.toLowerCase().includes("url") ||
      k.toLowerCase().includes("link"),
  );
  const financialFields = keys.filter(
    (k) =>
      k.toLowerCase().includes("price") ||
      k.toLowerCase().includes("fee") ||
      k.toLowerCase().includes("amount") ||
      k === "currency" ||
      k === "chargeMode",
  );
  const orgFields = keys.filter(
    (k) =>
      k.toLowerCase().includes("organization") ||
      k.toLowerCase().includes("contact") ||
      k === "websiteUrl",
  );

  const handledKeys = [
    ...locationFields,
    ...mediaFields,
    ...financialFields,
    ...orgFields,
  ];
  const basicFields = keys.filter((k) => !handledKeys.includes(k));
  const isPublished = data.status === "PUBLISHED";
  const approvalStatus = data.approvalStatus;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Sticky Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-20 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-md">
              {data.name}
            </h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="capitalize">
                {type}
              </Badge>
              <Badge
                variant={data.status === "PUBLISHED" ? "default" : "secondary"}
              >
                {data.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setData(initialData);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Details
            </Button>
          )}

          {!isEditing && isPublished && (
            <div className="flex gap-2">
              {approvalStatus === "PENDING" && (
                <>
                  <Button
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproval("APPROVED")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button
                    disabled={loading}
                    variant="destructive"
                    onClick={() => handleApproval("REJECTED")}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </>
              )}
              {approvalStatus === "APPROVED" && (
                <Button
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => handleApproval("PENDING")}
                >
                  <Undo className="h-4 w-4 mr-2" /> Revert
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-6">
              {basicFields.map((k) => renderField(k, data[k]))}
            </CardContent>
          </Card>

          {/* Location & Media */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {locationFields.map((k) => renderField(k, data[k]))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Media & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {mediaFields.map((k) => renderField(k, data[k]))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {financialFields.map((k) => renderField(k, data[k]))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {orgFields.map((k) => renderField(k, data[k]))}
            </CardContent>
          </Card>

          {/* Meta Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Internal ID</span>
                <span className="font-mono text-xs">{initialData.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Approval Status</span>
                <Badge
                  variant={
                    approvalStatus === "APPROVED"
                      ? "default"
                      : approvalStatus === "REJECTED"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {approvalStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

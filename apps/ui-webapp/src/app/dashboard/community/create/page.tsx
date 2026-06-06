"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { isAxiosError } from "axios";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { presignImageUpload } from "@/lib/api/mediaApi";
import { uploadImageToS3PresignedPost } from "@/lib/uploads/uploadImageToS3";
import { createCommunity } from "@/lib/api/communityApi";
import { getApiErrorMessage } from "@/lib/utils";
import {
  COMMUNITY_INDUSTRY_LABELS,
  COMMUNITY_INDUSTRY_VALUES,
  type CommunityIndustryValue,
} from "@oppskills/types/enums";
import {
  COMMUNITY_DESCRIPTION_MAX_LENGTH,
  COMMUNITY_HANDLE_MAX_LENGTH,
  COMMUNITY_HANDLE_MIN_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
} from "@oppskills/types/constants";
import RegistrationSidebar from "./_components/RegistrationSidebar";
import ImageCropDialog from "./_components/ImageCropDialog";
import CreateCommunityIdentityFields from "./_components/CreateCommunityIdentityFields";

const topColleges = [
  { img: "iith.png", name: "IIT Hyderabad" },
  { img: "iitd.png", name: "IIIT Delhi" },
  { img: "sharda.png", name: "Sharda University" },
  { img: "iilm.png", name: "IILM University" },
  { img: "krrc.png", name: "KRRC" },
  { img: "rishihood.png", name: "Rishihood University" },
  { img: "gla.png", name: "GLA University" },
];

const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(COMMUNITY_NAME_MAX_LENGTH),
  handle: z
    .string()
    .min(COMMUNITY_HANDLE_MIN_LENGTH, "Handle must be at least 3 characters")
    .max(COMMUNITY_HANDLE_MAX_LENGTH)
    .regex(
      /^[a-z0-9_-]+$/,
      "Handle may only contain lowercase letters, numbers, underscores, and hyphens",
    ),
  description: z.string().max(COMMUNITY_DESCRIPTION_MAX_LENGTH).optional(),
  website: z
    .union([z.string().url("Enter a valid URL"), z.literal("")])
    .optional(),
  industry: z.enum([...COMMUNITY_INDUSTRY_VALUES], {
    message: "Select an industry",
  }),
  coverImage: z.string().optional(),
  avatarImage: z.string().optional(),
  consent: z.literal(true, {
    message: "You must verify to continue",
  }),
});

type CreateCommunityFormValues = z.infer<typeof createCommunitySchema>;

type FieldName = keyof CreateCommunityFormValues;

export default function CreateCommunityPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [handleReady, setHandleReady] = useState(false);
  const handleReadyRef = useRef(false);
  const handleHandleReadyChange = useCallback((ready: boolean) => {
    handleReadyRef.current = ready;
    setHandleReady(ready);
  }, []);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputId = useMemo(
    () => `community-cover-upload-${crypto.randomUUID()}`,
    [],
  );
  const avatarInputId = useMemo(
    () => `community-avatar-upload-${crypto.randomUUID()}`,
    [],
  );

  // Cropping Modal states
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState<number>(4 / 1);
  const [cropTitle, setCropTitle] = useState<string>("");
  const [cropType, setCropType] = useState<"cover" | "avatar" | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Core trigger for cropping flow
  const triggerCropFlow = (file: File, type: "cover" | "avatar") => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image too large. Max size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropAspect(type === "cover" ? 4 / 1 : 1 / 1);
      setCropTitle(
        type === "cover" ? "Crop Cover Banner" : "Crop Community Logo",
      );
      setCropType(type);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const form = useForm({
    defaultValues: {
      name: "",
      handle: "",
      description: "",
      website: "",
      industry: "" as CommunityIndustryValue | "",
      coverImage: "",
      avatarImage: "",
      consent: false as boolean,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const parsed = createCommunitySchema.safeParse({
        ...value,
        industry: value.industry || undefined,
      });

      if (!parsed.success) {
        const first = parsed.error.issues[0];
        toast.error(first?.message ?? "Please fix the form errors.");
        return;
      }

      if (!handleReadyRef.current) {
        toast.error("Choose an available community handle before listing.");
        return;
      }

      setIsSubmitting(true);
      try {
        const token = await getToken();
        if (typeof token !== "string" || token.trim().length === 0) {
          toast.error("Please sign in to create a community.");
          return;
        }

        const payload = {
          name: parsed.data.name.trim(),
          handle: parsed.data.handle.trim().toLowerCase(),
          description: parsed.data.description?.trim() || undefined,
          website: parsed.data.website?.trim() || undefined,
          industry: parsed.data.industry,
          coverImage: parsed.data.coverImage?.trim() || undefined,
          avatarImage: parsed.data.avatarImage?.trim() || undefined,
        };

        const community = await createCommunity(token, payload);
        router.push(`/dashboard/community/manage/${community.id}`);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 409) {
          const message = getApiErrorMessage(
            error,
            "This handle is already taken",
          );
          setFieldErrors((prev) => ({
            ...prev,
            handle: message.includes("name")
              ? message
              : "This handle is already taken",
          }));
          setTouched((prev) => ({ ...prev, handle: true }));
          return;
        }

        setSubmitError(
          getApiErrorMessage(
            error,
            "Failed to create community. Please try again.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  function validateField(field: FieldName, values = form.state.values) {
    const parsed = createCommunitySchema.safeParse({
      ...values,
      industry: values.industry || undefined,
    });

    if (parsed.success) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }

    const issue = parsed.error.issues.find((i) => i.path[0] === field);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: issue?.message,
    }));
  }

  function handleBlur(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  }

  async function uploadImage(
    file: File,
    purpose: "COMMUNITY_COVER" | "COMMUNITY_AVATAR",
  ): Promise<string | null> {
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image too large. Max size is 10MB.");
      return null;
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.");
      return null;
    }

    const token = await getToken();
    if (typeof token !== "string" || token.trim().length === 0) {
      toast.error("Please sign in to upload.");
      return null;
    }

    const presign = await presignImageUpload(token, {
      purpose,
      mimeType: file.type,
    });
    await uploadImageToS3PresignedPost({ presign, file });

    const publicUrl = presign.publicUrl.startsWith("http")
      ? presign.publicUrl
      : presign.publicUrl.startsWith("//")
        ? `https:${presign.publicUrl}`
        : `https://${presign.publicUrl}`;

    return publicUrl;
  }

  async function handleCoverSelected(file: File | null) {
    if (!file || isUploadingCover) return;
    triggerCropFlow(file, "cover");
  }

  async function handleAvatarSelected(file: File | null) {
    if (!file || isUploadingAvatar) return;
    triggerCropFlow(file, "avatar");
  }

  const handleCropComplete = async (croppedFile: File) => {
    if (!cropType) return;

    const setUploading =
      cropType === "cover" ? setIsUploadingCover : setIsUploadingAvatar;
    const setPreview =
      cropType === "cover" ? setCoverPreview : setAvatarPreview;
    const fieldName = cropType === "cover" ? "coverImage" : "avatarImage";
    const purpose =
      cropType === "cover" ? "COMMUNITY_COVER" : "COMMUNITY_AVATAR";

    setUploading(true);
    try {
      const publicUrl = await uploadImage(croppedFile, purpose);
      if (publicUrl) {
        form.setFieldValue(fieldName, publicUrl);
        setPreview(publicUrl);
        toast.success(
          `${cropType === "cover" ? "Cover banner" : "Logo"} uploaded successfully!`,
        );
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        `${cropType === "cover" ? "Cover banner" : "Logo"} upload failed.`,
      );
      setPreview(null);
      form.setFieldValue(fieldName, "");
    } finally {
      setUploading(false);
      setCropImage(null);
      setCropType(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 flex flex-col justify-start items-center">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[62%] order-2 lg:order-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
            className="w-full max-w-5xl mx-auto overflow-hidden p-4 flex flex-col gap-8"
          >
            {submitError ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {submitError}
              </div>
            ) : null}

            <form.Subscribe
              selector={(state) => state.values}
              children={(formValues) => {
                const consentChecked = formValues.consent === true;
                const industryValue =
                  formValues.industry.length > 0
                    ? formValues.industry
                    : undefined;

                return (
                  <>
                    <div className="relative w-full">
                      <label htmlFor={coverInputId} className="sr-only">
                        Upload cover image
                      </label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => coverInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            coverInputRef.current?.click();
                          }
                        }}
                        className={cn(
                          "relative w-full aspect-[4/1] rounded-3xl bg-[#E6E0FA]/60 border-2 border-dashed border-[#BCA5F4]/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden hover:bg-[#E6E0FA]/80 group",
                          coverPreview ? "border-none" : "",
                        )}
                      >
                        <input
                          id={coverInputId}
                          type="file"
                          ref={coverInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void handleCoverSelected(file);
                            e.target.value = "";
                          }}
                        />
                        {isUploadingCover ? (
                          <div className="flex items-center gap-2 text-[#3A2482] font-semibold text-sm">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Uploading cover…
                          </div>
                        ) : coverPreview ? (
                          <>
                            <Image
                              src={coverPreview}
                              alt="Community cover preview"
                              fill
                              className="object-cover"
                              unoptimized={coverPreview.startsWith("blob:")}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <p className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Change Cover
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-center px-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5D3EBB] shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm md:text-base text-[#3A2482]">
                              Upload Cover / Cover Size 400×100
                            </span>
                          </div>
                        )}
                      </div>

                      <label htmlFor={avatarInputId} className="sr-only">
                        Upload avatar image
                      </label>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => avatarInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            avatarInputRef.current?.click();
                          }
                        }}
                        className="absolute left-6 md:left-8 bottom-[-40px] w-20 h-20 md:w-24 md:h-24 bg-[#E6E0FA] rounded-2xl border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden z-10 transition-transform hover:scale-105 group"
                      >
                        <input
                          id={avatarInputId}
                          type="file"
                          ref={avatarInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void handleAvatarSelected(file);
                            e.target.value = "";
                          }}
                        />
                        {isUploadingAvatar ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#5D3EBB]" />
                        ) : avatarPreview ? (
                          <>
                            <Image
                              src={avatarPreview}
                              alt="Community avatar preview"
                              fill
                              className="object-cover"
                              unoptimized={avatarPreview.startsWith("blob:")}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                              <Upload className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <Upload className="w-6 h-6 text-[#5D3EBB]" />
                        )}
                      </div>
                    </div>

                    <div className="h-10 md:h-12 w-full" />

                    <CreateCommunityIdentityFields
                      form={form}
                      touched={touched}
                      fieldErrors={fieldErrors}
                      onBlur={handleBlur}
                      onHandleReadyChange={handleHandleReadyChange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between pl-1">
                          <label
                            htmlFor="community-description"
                            className="text-xs text-neutral-700 tracking-wider"
                          >
                            Community Description
                          </label>
                          <span className="text-xs text-neutral-400 tabular-nums">
                            {formValues.description.length}/
                            {COMMUNITY_DESCRIPTION_MAX_LENGTH}
                          </span>
                        </div>
                        <Textarea
                          id="community-description"
                          value={formValues.description}
                          maxLength={COMMUNITY_DESCRIPTION_MAX_LENGTH}
                          onChange={(e) =>
                            form.setFieldValue(
                              "description",
                              e.target.value.slice(
                                0,
                                COMMUNITY_DESCRIPTION_MAX_LENGTH,
                              ),
                            )
                          }
                          onBlur={() => handleBlur("description")}
                          placeholder="Tell Us about the community"
                          aria-invalid={
                            touched.description && !!fieldErrors.description
                          }
                          className="border-neutral-400 min-h-[140px] resize-none rounded-3xl p-4"
                        />
                        {touched.description && fieldErrors.description ? (
                          <p className="text-sm text-red-600">
                            {fieldErrors.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-5 justify-between">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="community-website"
                            className="text-xs text-neutral-700 tracking-wider pl-1"
                          >
                            Community Website
                          </label>
                          <Input
                            id="community-website"
                            type="url"
                            value={formValues.website}
                            onChange={(e) =>
                              form.setFieldValue("website", e.target.value)
                            }
                            onBlur={() => handleBlur("website")}
                            placeholder="Place Holder Text"
                            aria-invalid={
                              touched.website && !!fieldErrors.website
                            }
                            className="border-neutral-400 rounded-full h-12 px-5 text-base shadow-2xs"
                          />
                          {touched.website && fieldErrors.website ? (
                            <p className="text-sm text-red-600">
                              {fieldErrors.website}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="community-industry"
                            className="text-xs text-neutral-700 tracking-wider pl-1"
                          >
                            Community Industry
                          </label>
                          <Select
                            value={industryValue}
                            onValueChange={(value) => {
                              form.setFieldValue(
                                "industry",
                                value as CommunityIndustryValue,
                              );
                              setTouched((prev) => ({
                                ...prev,
                                industry: true,
                              }));
                              validateField("industry", {
                                ...formValues,
                                industry: value as CommunityIndustryValue,
                              });
                            }}
                          >
                            <SelectTrigger
                              id="community-industry"
                              aria-label="Community industry"
                              className="border-neutral-400 rounded-full h-12 px-5 text-base text-neutral-700 shadow-2xs"
                            >
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {COMMUNITY_INDUSTRY_VALUES.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {COMMUNITY_INDUSTRY_LABELS[value]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {touched.industry && fieldErrors.industry ? (
                            <p className="text-sm text-red-600">
                              {fieldErrors.industry}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 mt-2">
                      <Checkbox
                        id="community-consent"
                        checked={consentChecked}
                        onCheckedChange={(checked) => {
                          form.setFieldValue("consent", checked === true);
                          if (checked === true) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.consent;
                              return next;
                            });
                          }
                        }}
                        onBlur={() => handleBlur("consent")}
                        aria-invalid={touched.consent && !!fieldErrors.consent}
                      />
                      <label
                        htmlFor="community-consent"
                        className="text-sm text-neutral-700 cursor-pointer select-none leading-relaxed"
                      >
                        I verify that I am an authorized representative of this
                        community and have the right to act on its behalf in the
                        creation of this page.
                      </label>
                    </div>
                    {touched.consent && fieldErrors.consent ? (
                      <p className="text-sm text-red-600 -mt-4">
                        {fieldErrors.consent}
                      </p>
                    ) : null}

                    <div className="flex justify-end w-full pt-2">
                      <Button
                        type="submit"
                        disabled={!consentChecked || isSubmitting || !handleReady}
                        className="bg-[#2E1E66] hover:bg-[#1E1146] text-white font-bold px-8 py-3 rounded-full text-base h-auto"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Listing…
                          </>
                        ) : (
                          "List Community"
                        )}
                      </Button>
                    </div>

                    <div className="h-px w-full bg-neutral-200/80 my-2" />

                    <div className="flex flex-col gap-6 w-full pt-1">
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-800">
                        Trusted By Communities From Top Colleges
                      </h3>
                      <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 bg-neutral-50/50 p-4 rounded-3xl border border-neutral-100">
                        {topColleges.map((logo) => (
                          <div
                            key={logo.name}
                            className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden rounded-full border p-3 md:p-4 bg-white hover:bg-neutral-50 transition-all duration-300 border-neutral-200/50 hover:border-primary/20 hover:scale-105 shadow-2xs"
                            title={logo.name}
                          >
                            <Image
                              src={`/logos/${logo.img}`}
                              alt={logo.name}
                              width={60}
                              height={60}
                              className="object-contain w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              }}
            />
          </form>
        </div>

        <div className="w-full lg:w-[38%] order-1 lg:order-2 lg:sticky lg:top-8">
          <RegistrationSidebar />
        </div>
      </div>
      <ImageCropDialog
        isOpen={isCropOpen}
        onClose={() => {
          setIsCropOpen(false);
          setCropImage(null);
          setCropType(null);
        }}
        imageSrc={cropImage}
        aspectRatio={cropAspect}
        onCropComplete={handleCropComplete}
        title={cropTitle}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Globe, Loader2, X } from "lucide-react";
import {
  COMMUNITY_HANDLE_MAX_LENGTH,
  COMMUNITY_HANDLE_MIN_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
} from "@oppskills/types/constants";
import { cn } from "@/lib/utils";
import {
  deriveCommunityHandleFromName,
  formatHandleForDisplay,
  normalizeCommunityHandle,
} from "@/lib/community/handleUtils";
import { useCommunityHandleField } from "@/hooks/useCommunityHandleField";

type FieldName = "name" | "handle";

interface CreateCommunityIdentityFieldsProps {
  form: {
    Subscribe: React.ComponentType<{
      selector: (state: { values: Record<string, unknown> }) => {
        name: string;
        handle: string;
      };
      children: (values: { name: string; handle: string }) => React.ReactNode;
    }>;
    setFieldValue: (field: "name" | "handle", value: string) => void;
  };
  touched: Partial<Record<FieldName, boolean>>;
  fieldErrors: Partial<Record<FieldName, string>>;
  onBlur: (field: FieldName) => void;
  onHandleReadyChange: (ready: boolean) => void;
}

function IdentityFieldsBody({
  form,
  name,
  handle,
  touched,
  fieldErrors,
  onBlur,
  onHandleReadyChange,
}: Omit<CreateCommunityIdentityFieldsProps, "form"> & {
  form: CreateCommunityIdentityFieldsProps["form"];
  name: string;
  handle: string;
}) {
  const nameIsComposingRef = useRef(false);
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);

  const {
    normalizedHandle,
    status,
    suggestions,
    applySuggestion,
    canSubmitHandle,
    isChecking,
  } = useCommunityHandleField({
    name,
    handle,
    handleManuallyEdited,
    onHandleChange: (next) => form.setFieldValue("handle", next),
  });

  useEffect(() => {
    onHandleReadyChange(canSubmitHandle && !isChecking);
  }, [canSubmitHandle, isChecking, onHandleReadyChange]);

  const displayHandle = formatHandleForDisplay(handle);

  const handleStatusMessage = (() => {
    if (!normalizedHandle) return null;
    if (status === "checking") return "Checking availability…";
    if (status === "available")
      return `@${normalizedHandle} is available`;
    if (status === "taken") return `@${normalizedHandle} is already taken`;
    if (status === "invalid")
      return `Use ${COMMUNITY_HANDLE_MIN_LENGTH}–${COMMUNITY_HANDLE_MAX_LENGTH} characters: lowercase letters, numbers, _ or -`;
    return null;
  })();

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="community-name" className="sr-only">
        Community Name
      </label>
      <input
        id="community-name"
        type="text"
        maxLength={COMMUNITY_NAME_MAX_LENGTH}
        value={name}
        onCompositionStart={() => {
          nameIsComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          nameIsComposingRef.current = false;
          if (!handleManuallyEdited) {
            form.setFieldValue(
              "handle",
              deriveCommunityHandleFromName(e.currentTarget.value),
            );
          }
        }}
        onChange={(e) => {
          const nextName = e.target.value.slice(0, COMMUNITY_NAME_MAX_LENGTH);
          form.setFieldValue("name", nextName);
          if (nameIsComposingRef.current) return;
          if (!handleManuallyEdited) {
            form.setFieldValue(
              "handle",
              deriveCommunityHandleFromName(nextName),
            );
          }
        }}
        onBlur={() => onBlur("name")}
        placeholder="Community Name"
        aria-invalid={touched.name && !!fieldErrors.name}
        className="text-3xl md:text-4xl font-extrabold text-neutral-800 placeholder-neutral-300 outline-none w-full bg-transparent border-b border-transparent focus:border-neutral-200 pb-1 transition-colors"
      />
      <div className="flex items-center justify-between gap-2">
        {touched.name && fieldErrors.name ? (
          <p className="text-sm text-red-600">{fieldErrors.name}</p>
        ) : (
          <span />
        )}
        <span className="text-xs text-neutral-400 tabular-nums">
          {name.length}/{COMMUNITY_NAME_MAX_LENGTH}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 pt-1">
        <div className="flex flex-col gap-1.5 max-w-fit">
          <label htmlFor="community-handle" className="sr-only">
            Community handle
          </label>
          <div
            className={cn(
              "flex items-center gap-1 bg-neutral-50 px-3 py-1.5 rounded-full border",
              status === "available" && "border-emerald-200 bg-emerald-50/40",
              status === "taken" && "border-red-200 bg-red-50/40",
              status === "invalid" && "border-amber-200 bg-amber-50/40",
              status !== "available" &&
                status !== "taken" &&
                status !== "invalid" &&
                "border-neutral-100",
            )}
          >
            <span className="text-neutral-400 font-semibold text-sm">@</span>
            <input
              id="community-handle"
              type="text"
              value={handle}
              onChange={(e) => {
                setHandleManuallyEdited(true);
                form.setFieldValue(
                  "handle",
                  normalizeCommunityHandle(e.target.value).replace(
                    /[^a-z0-9_-]/g,
                    "",
                  ),
                );
              }}
              onBlur={() => onBlur("handle")}
              placeholder="community-handle"
              aria-invalid={touched.handle && !!fieldErrors.handle}
              className="bg-transparent outline-none text-neutral-700 text-sm font-semibold placeholder-neutral-400 w-44 sm:w-52"
            />
            {status === "checking" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
            ) : status === "available" ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : status === "taken" || status === "invalid" ? (
              <X className="w-3.5 h-3.5 text-red-500" />
            ) : null}
          </div>
          {handleStatusMessage ? (
            <p
              className={cn(
                "text-xs pl-1 font-medium",
                status === "available" && "text-emerald-700",
                (status === "taken" || status === "invalid") && "text-red-600",
                status === "checking" && "text-neutral-500",
              )}
            >
              {handleStatusMessage}
            </p>
          ) : null}
          {touched.handle && fieldErrors.handle ? (
            <p className="text-sm text-red-600 pl-1">{fieldErrors.handle}</p>
          ) : null}
          {suggestions.length > 0 &&
          (status === "taken" || status === "invalid") ? (
            <div className="flex flex-wrap items-center gap-1.5 pl-1 pt-0.5">
              <span className="text-xs text-neutral-500">Try:</span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setHandleManuallyEdited(true);
                    applySuggestion(suggestion);
                  }}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E6E0FA]/70 text-[#5D3EBB] hover:bg-[#E6E0FA] transition-colors"
                >
                  @{suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-indigo-600/80 font-medium italic text-sm sm:pt-1.5">
          <Globe className="w-4 h-4 shrink-0" aria-hidden />
          <span className="break-all select-all" aria-label="Community URL">
            https://oppskills.com/c/
            <span className="font-bold underline decoration-dotted">
              {displayHandle}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CreateCommunityIdentityFields({
  form,
  touched,
  fieldErrors,
  onBlur,
  onHandleReadyChange,
}: CreateCommunityIdentityFieldsProps) {
  return (
    <form.Subscribe
      selector={(state) => ({
        name: state.values.name as string,
        handle: state.values.handle as string,
      })}
      children={(values) => (
        <IdentityFieldsBody
          form={form}
          name={values.name}
          handle={values.handle}
          touched={touched}
          fieldErrors={fieldErrors}
          onBlur={onBlur}
          onHandleReadyChange={onHandleReadyChange}
        />
      )}
    />
  );
}

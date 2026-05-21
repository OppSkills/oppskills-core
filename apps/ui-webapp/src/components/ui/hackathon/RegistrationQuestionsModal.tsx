"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reorder } from "framer-motion";

export type QuestionType =
  | "Text"
  | "Phone No."
  | "Email"
  | "Attachments"
  | "Number"
  | "Options";

export interface RegistrationQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  fixed: boolean;
  isStatic?: boolean;
  options?: string[];
}

interface RegistrationQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestions?: RegistrationQuestion[];
  onSave: (questions: RegistrationQuestion[]) => void;
  questions?: RegistrationQuestion[];
}

export default function RegistrationQuestionsModal({
  open,
  onOpenChange,
  initialQuestions,
  onSave,
  questions: questionsInput,
}: RegistrationQuestionsModalProps) {
  const defaultFixedQuestions: RegistrationQuestion[] = useMemo(
    () => [
      {
        id: "fixed-1",
        label: "Name",
        type: "Text",
        required: true,
        fixed: true,
      },
      {
        id: "fixed-3",
        label: "Email",
        type: "Email",
        required: true,
        fixed: true,
      },
      {
        id: "fixed-2",
        label: "Mobile Number",
        type: "Phone No.",
        required: true,
        fixed: true,
      },
      {
        id: "fixed-4",
        label: "Gender",
        type: "Options",
        required: true,
        fixed: true,
        options: ["Male", "Female", "Other", "Prefer not to say"],
      },
      {
        id: "fixed-5",
        label: "Current College / Organization",
        type: "Text",
        required: true,
        fixed: true,
      },
      {
        id: "fixed-6",
        label: "User Type",
        type: "Options",
        required: true,
        fixed: true,
        options: ["Student", "Professional"],
      },
    ],
    [],
  );

  const getCustomQuestions = (
    input: RegistrationQuestion[] | undefined,
  ): RegistrationQuestion[] => {
    const list = Array.isArray(input) ? input : [];

    // Create a set of lowercased labels from fixed questions to identify backend-populated static fields
    const defaultLabels = new Set(
      defaultFixedQuestions.map((q) => q.label.toLowerCase()),
    );

    return list.filter((q) => {
      // Ignore if explicitly marked fixed
      if (q.fixed) return false;
      // Also ignore if the label matches one of the default fixed questions (prevents duplication)
      if (defaultLabels.has(q.label.toLowerCase())) return false;

      return true;
    });
  };

  const buildVisibleQuestions = (
    custom: RegistrationQuestion[],
  ): RegistrationQuestion[] => {
    return [...defaultFixedQuestions, ...custom];
  };

  const getInitialCustom = (): RegistrationQuestion[] => {
    if (Array.isArray(questionsInput) && questionsInput.length > 0) {
      return getCustomQuestions(questionsInput);
    }
    if (Array.isArray(initialQuestions) && initialQuestions.length > 0) {
      return getCustomQuestions(initialQuestions);
    }
    return [];
  };

  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);

  useEffect(() => {
    if (open) {
      setQuestions(buildVisibleQuestions(getInitialCustom()));
      setOptionDraftByQuestionId({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuestions, questionsInput, defaultFixedQuestions]);

  const initialNewQuestionType: QuestionType = "Text";
  const [newQuestionLabel, setNewQuestionLabel] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>(
    initialNewQuestionType,
  );
  const [newQuestionRequired, setNewQuestionRequired] =
    useState<boolean>(false);

  /** Pending text in the "add option" box per question (committed on Enter, Add, or Done). */
  const [optionDraftByQuestionId, setOptionDraftByQuestionId] = useState<
    Record<string, string>
  >({});

  // Derived lists helpers
  const fixedQuestions = questions.filter((q) => q.fixed);
  const customQuestions = questions.filter((q) => !q.fixed);

  const handleReorder = (newOrder: RegistrationQuestion[]) => {
    setQuestions([...fixedQuestions, ...newOrder]);
  };

  const handleAddQuestion = () => {
    if (!newQuestionLabel.trim()) return;

    const newQuestion: RegistrationQuestion = {
      id: `custom-${Date.now()}`,
      label: newQuestionLabel,
      type: newQuestionType,
      required: newQuestionRequired,
      fixed: false,
      options: newQuestionType === "Options" ? [] : undefined,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setNewQuestionLabel("");
    setNewQuestionType(initialNewQuestionType);
    setNewQuestionRequired(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setOptionDraftByQuestionId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleUpdateCustomQuestion = (
    id: string,
    updates: Partial<RegistrationQuestion>,
  ) => {
    if (updates.type !== undefined && updates.type !== "Options") {
      setOptionDraftByQuestionId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const next: RegistrationQuestion = { ...q, ...updates };
        if (next.type !== "Options") {
          next.options = undefined;
        } else if (!Array.isArray(next.options)) {
          next.options = [];
        }
        return next;
      }),
    );
  };

  const handleAddOption = (questionId: string, option: string) => {
    const trimmed = option.trim();
    if (trimmed.length === 0) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const existing = Array.isArray(q.options) ? q.options : [];
        if (existing.includes(trimmed)) return q;
        return { ...q, options: [...existing, trimmed] };
      }),
    );
    setOptionDraftByQuestionId((prev) => ({ ...prev, [questionId]: "" }));
  };

  const handleRemoveOption = (questionId: string, option: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const existing = Array.isArray(q.options) ? q.options : [];
        return { ...q, options: existing.filter((o) => o !== option) };
      }),
    );
  };

  const mergePendingOptionDrafts = (
    list: RegistrationQuestion[],
    drafts: Record<string, string>,
  ): RegistrationQuestion[] => {
    return list.map((q) => {
      if (q.type !== "Options") return q;
      const draft = (drafts[q.id] ?? "").trim();
      if (draft.length === 0) return q;
      const existing = Array.isArray(q.options) ? q.options : [];
      if (existing.includes(draft)) return q;
      return { ...q, options: [...existing, draft] };
    });
  };

  const handleSave = () => {
    // Only save CUSTOM questions to the backend.
    // Fixed/default questions are UI-only and will be lazy-created by the backend
    // at registration time. This prevents persisting broken defaults (e.g., Gender with no options).
    const withDraftOptions = mergePendingOptionDrafts(
      questions,
      optionDraftByQuestionId,
    );
    setOptionDraftByQuestionId({});
    const customOnly = withDraftOptions.filter((q) => !q.fixed);
    onSave(customOnly);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl bg-[#F3F3F3] border-none p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 md:p-6 pb-2 shrink-0">
          <DialogTitle className="text-lg md:text-xl font-bold">
            Registration Questions
          </DialogTitle>
        </DialogHeader>

        <div className="p-2 md:p-4 space-y-3 overflow-y-auto flex-1">
          {/* Fixed Questions List */}
          {fixedQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-background rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-2 shadow-sm border border-transparent"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GripVertical className="text-gray-300 w-5 h-5 cursor-not-allowed opacity-50 shrink-0" />
                <div className="font-medium text-[15px] truncate">
                  {question.label}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-8 md:pl-0">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-normal px-3 py-1 h-8 flex items-center whitespace-nowrap"
                >
                  Required
                </Badge>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-background" />
                </div>
              </div>
            </div>
          ))}

          {/* Draggable Custom Questions */}
          <Reorder.Group
            axis="y"
            values={customQuestions}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {customQuestions.map((question) => (
              <Reorder.Item
                key={question.id}
                value={question}
                className="bg-background rounded-lg p-3 flex flex-col gap-3 shadow-sm border border-transparent hover:border-gray-200 transition-colors relative"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  {/* Drag Handle & Label Input */}
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="text-gray-400 w-5 h-5 cursor-move shrink-0 hover:text-gray-600" />
                    <Input
                      value={question.label}
                      onChange={(e) =>
                        handleUpdateCustomQuestion(question.id, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Question label"
                      className="h-9 flex-1 min-w-0"
                    />
                  </div>

                  {/* Actions Row (Type, Required, Delete) */}
                  <div className="flex items-center gap-2 pl-8 md:pl-0 flex-wrap justify-end">
                    <Select
                      value={question.type}
                      onValueChange={(value) =>
                        handleUpdateCustomQuestion(question.id, {
                          type: value as QuestionType,
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Number">Number</SelectItem>
                        <SelectItem value="Phone No.">Phone No.</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Attachments">Attachments</SelectItem>
                        <SelectItem value="Options">Options</SelectItem>
                      </SelectContent>
                    </Select>

                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={() =>
                          handleUpdateCustomQuestion(question.id, {
                            required: !question.required,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary"
                      />
                      <span className="hidden md:inline">Required</span>
                      <span className="md:hidden">Req</span>
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Options Editor */}
                {question.type === "Options" && (
                  <div className="pl-8 md:pl-8 mt-1 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Add each choice below, then press Enter or click Add. You
                      can add as many options as you need.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={optionDraftByQuestionId[question.id] ?? ""}
                        onChange={(e) =>
                          setOptionDraftByQuestionId((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Type a choice, then Enter or Add"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          handleAddOption(
                            question.id,
                            (e.currentTarget as HTMLInputElement).value,
                          );
                        }}
                        className="h-9 flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 shrink-0"
                        onClick={() =>
                          handleAddOption(
                            question.id,
                            optionDraftByQuestionId[question.id] ?? "",
                          )
                        }
                      >
                        Add
                      </Button>
                    </div>
                    {Array.isArray(question.options) &&
                      question.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() =>
                                handleRemoveOption(question.id, opt)
                              }
                              className="text-xs px-3 py-1 rounded-full border bg-gray-50 hover:bg-gray-100 flex items-center gap-1 transition-colors"
                            >
                              {opt}{" "}
                              <span className="text-gray-400 hover:text-red-500">
                                ×
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add New Question Row */}
          <div className="bg-background rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-sm border border-transparent mt-4">
            <Input
              value={newQuestionLabel}
              onChange={(e) => setNewQuestionLabel(e.target.value)}
              placeholder="Type new question..."
              className="flex-1 shadow-none border-gray-200 focus-visible:ring-1 h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddQuestion();
              }}
            />

            <div className="flex items-center gap-2 justify-between md:justify-end">
              <Select
                value={newQuestionType}
                onValueChange={(value) =>
                  setNewQuestionType(value as QuestionType)
                }
              >
                <SelectTrigger className="w-[120px] h-9 border-gray-200 bg-gray-50/50">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="Text">Text</SelectItem>
                  <SelectItem value="Number">Number</SelectItem>
                  <SelectItem value="Phone No.">Phone No.</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Attachments">Attachments</SelectItem>
                  <SelectItem value="Options">Options</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newQuestionRequired}
                    onChange={() => setNewQuestionRequired((v) => !v)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary"
                  />
                  Required
                </label>

                <Button
                  onClick={handleAddQuestion}
                  size="icon"
                  className="rounded-full h-8 w-8 bg-primary-500 text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F3F3F3] shrink-0 border-t border-gray-100">
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-[#A020F0] hover:bg-[#8e1cd6] text-background rounded-full px-8 py-2 h-10 font-medium shadow-lg shadow-purple-900/10 w-full md:w-auto"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

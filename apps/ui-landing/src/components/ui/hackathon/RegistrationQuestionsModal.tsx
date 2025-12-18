"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Check, Menu, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    options?: string[]; // For 'Options' type, though not explicitly shown in simple UI
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
    const defaultFixedQuestions: RegistrationQuestion[] = [
        {
            id: "fixed-1",
            label: "Name",
            type: "Text",
            required: true,
            fixed: true,
        },
        {
            id: "fixed-2",
            label: "Phone No.",
            type: "Phone No.",
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
            id: "fixed-4",
            label: "Gender",
            type: "Options",
            required: true,
            fixed: true,
        },
        {
            id: "fixed-5",
            label: "College Name",
            type: "Text",
            required: true,
            fixed: true,
        },
    ];

    /**
     * We intentionally treat `initialQuestions` / `questions` as *custom* questions only.
     * Fixed (base) questions are always shown in UI but are NOT persisted to DB to avoid redundancy.
     */
    const getCustomQuestions = (
        input: RegistrationQuestion[] | undefined
    ): RegistrationQuestion[] => {
        const list = Array.isArray(input) ? input : [];
        return list.filter((q) => q.fixed !== true);
    };

    const buildVisibleQuestions = (
        custom: RegistrationQuestion[]
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

    const [questions, setQuestions] = useState<RegistrationQuestion[]>(
        buildVisibleQuestions(getInitialCustom())
    );

    /**
     * Default state for the "new question" form.
     * Keep this centralized so resets always use the same initial values.
     */
    const initialNewQuestionType: QuestionType = "Text";

    const [newQuestionLabel, setNewQuestionLabel] = useState("");
    const [newQuestionType, setNewQuestionType] = useState<QuestionType>(
        initialNewQuestionType
    );
    const [newQuestionRequired, setNewQuestionRequired] = useState<boolean>(false);

    const customQuestions = useMemo(
        () => questions.filter((q) => q.fixed !== true),
        [questions]
    );

    useEffect(() => {
        if (open) {
            setQuestions(buildVisibleQuestions(getInitialCustom()));
            // Reset the add-question form each time the modal opens.
            setNewQuestionLabel("");
            setNewQuestionType(initialNewQuestionType);
            setNewQuestionRequired(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialQuestions, questionsInput]);

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

        setQuestions([...questions, newQuestion]);
        setNewQuestionLabel("");
        setNewQuestionType(initialNewQuestionType);
        setNewQuestionRequired(false);
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions((prev) => {
            const target = prev.find((q) => q.id === id);
            // Fixed questions must never be deleted, even if callers/UI change.
            if (target?.fixed === true) return prev;
            return prev.filter((q) => q.id !== id);
        });
    };

    const handleUpdateCustomQuestion = (
        id: string,
        updates: Partial<RegistrationQuestion>
    ) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== id) return q;
                if (q.fixed) return q;
                const next: RegistrationQuestion = { ...q, ...updates };
                if (next.type !== "Options") {
                    next.options = undefined;
                } else if (!Array.isArray(next.options)) {
                    next.options = [];
                }
                return next;
            })
        );
    };

    const handleMoveCustomQuestion = (id: string, direction: "up" | "down") => {
        setQuestions((prev) => {
            const fixed = prev.filter((q) => q.fixed === true);
            const custom = prev.filter((q) => q.fixed !== true);
            const idx = custom.findIndex((q) => q.id === id);
            if (idx < 0) return prev;
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= custom.length) return prev;
            const nextCustom = [...custom];
            const tmp = nextCustom[idx];
            nextCustom[idx] = nextCustom[swapWith];
            nextCustom[swapWith] = tmp;
            return [...fixed, ...nextCustom];
        });
    };

    const handleAddOption = (questionId: string, option: string) => {
        const trimmed = option.trim();
        if (trimmed.length === 0) return;
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                if (q.fixed || q.type !== "Options") return q;
                const existing = Array.isArray(q.options) ? q.options : [];
                if (existing.includes(trimmed)) return q;
                return { ...q, options: [...existing, trimmed] };
            })
        );
    };

    const handleRemoveOption = (questionId: string, option: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q;
                if (q.fixed || q.type !== "Options") return q;
                const existing = Array.isArray(q.options) ? q.options : [];
                return { ...q, options: existing.filter((o) => o !== option) };
            })
        );
    };

    const handleSave = () => {
        const customOnly = questions.filter((q) => q.fixed !== true);
        onSave(customOnly);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#F3F3F3] border-none p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold">
                        Registration Questions
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {questions.map((question) => {
                        const customIdx = customQuestions.findIndex(
                            (q) => q.id === question.id
                        );
                        const isCustom = question.fixed !== true;
                        const canMoveUp = isCustom && customIdx > 0;
                        const canMoveDown =
                            isCustom &&
                            customIdx >= 0 &&
                            customIdx < customQuestions.length - 1;

                        return (
                            <div
                                key={question.id}
                                className="bg-white rounded-lg p-3 flex flex-col gap-2 shadow-sm border border-transparent hover:border-gray-200 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Menu className="text-gray-400 w-5 h-5 cursor-default" />
                                    <div className="flex-1">
                                        {question.fixed ? (
                                            <div className="font-medium text-[15px]">
                                                {question.label}
                                            </div>
                                        ) : (
                                            <Input
                                                value={question.label}
                                                onChange={(e) =>
                                                    handleUpdateCustomQuestion(question.id, {
                                                        label: e.target.value,
                                                    })
                                                }
                                                placeholder="Question label"
                                                className="h-9"
                                            />
                                        )}
                                    </div>

                                    {question.fixed ? (
                                        <>
                                            <Badge
                                                variant="secondary"
                                                className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-normal px-3 py-1 h-8 flex items-center"
                                            >
                                                Required
                                            </Badge>
                                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={!canMoveUp}
                                                onClick={() =>
                                                    handleMoveCustomQuestion(question.id, "up")
                                                }
                                                className="h-8 w-8"
                                                aria-label="Move question up"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={!canMoveDown}
                                                onClick={() =>
                                                    handleMoveCustomQuestion(question.id, "down")
                                                }
                                                className="h-8 w-8"
                                                aria-label="Move question down"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                                aria-label="Delete question"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {!question.fixed && (
                                    <div className="flex flex-col gap-2 pl-8">
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={question.type}
                                                onValueChange={(value) =>
                                                    handleUpdateCustomQuestion(question.id, {
                                                        type: value as QuestionType,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-[160px] h-9">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent align="start" className="w-[200px]">
                                                    <SelectItem value="Text">Text</SelectItem>
                                                    <SelectItem value="Number">Number</SelectItem>
                                                    <SelectItem value="Phone No.">
                                                        Phone No.
                                                    </SelectItem>
                                                    <SelectItem value="Email">Email</SelectItem>
                                                    <SelectItem value="Attachments">
                                                        Attachments
                                                    </SelectItem>
                                                    <SelectItem value="Options">Options</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={question.required}
                                                    onChange={() =>
                                                        handleUpdateCustomQuestion(question.id, {
                                                            required: !question.required,
                                                        })
                                                    }
                                                />
                                                Required
                                            </label>
                                        </div>

                                        {question.type === "Options" && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        defaultValue=""
                                                        placeholder="Add option and press Enter"
                                                        onKeyDown={(e) => {
                                                            if (e.key !== "Enter") return;
                                                            const target = e.target;
                                                            if (!(target instanceof HTMLInputElement)) return;
                                                            handleAddOption(question.id, target.value);
                                                            target.value = "";
                                                        }}
                                                        className="h-9"
                                                    />
                                                </div>
                                                {Array.isArray(question.options) &&
                                                    question.options.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {question.options.map((opt) => (
                                                                <button
                                                                    type="button"
                                                                    key={opt}
                                                                    onClick={() =>
                                                                        handleRemoveOption(
                                                                            question.id,
                                                                            opt
                                                                        )
                                                                    }
                                                                    className="text-xs px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                                                                >
                                                                    {opt} ×
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add New Question Row */}
                    <div className="bg-white rounded-lg p-2 flex items-center gap-2 shadow-sm">
                        <Input
                            value={newQuestionLabel}
                            onChange={(e) => setNewQuestionLabel(e.target.value)}
                            placeholder="Click to type"
                            className="border-none shadow-none focus-visible:ring-0 text-[15px] bg-transparent flex-1 h-10 px-3"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddQuestion();
                            }}
                        />

                        <Select
                            value={newQuestionType}
                            onValueChange={(value) => setNewQuestionType(value as QuestionType)}
                        >
                            <SelectTrigger className="w-[110px] h-9 border-none bg-transparent hover:bg-gray-50 focus:ring-0 font-medium text-gray-700">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[180px]">
                                <SelectItem value="Text">Text</SelectItem>
                                <SelectItem value="Number">Number</SelectItem>
                                <SelectItem value="Phone No.">Phone No.</SelectItem>
                                <SelectItem value="Email">Email</SelectItem>
                                <SelectItem value="Attachments">Attachments</SelectItem>
                                <SelectItem value="Options">Options</SelectItem>
                            </SelectContent>
                        </Select>

                        <label className="flex items-center gap-2 text-xs text-gray-600 px-2">
                            <input
                                type="checkbox"
                                checked={newQuestionRequired}
                                onChange={() => setNewQuestionRequired((v) => !v)}
                            />
                            Required
                        </label>

                        <Button
                            onClick={handleAddQuestion}
                            size="icon"
                            className="rounded-full h-8 w-8 shrink-0 bg-transparent border border-gray-400 text-gray-500 hover:bg-gray-100 shadow-none"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-[#F3F3F3]">
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            className="bg-[#A020F0] hover:bg-[#8e1cd6] text-white rounded-full px-8 py-2 h-10 font-medium shadow-lg shadow-purple-900/10"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

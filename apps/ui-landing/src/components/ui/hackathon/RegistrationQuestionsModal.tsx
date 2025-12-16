"use client";

import { useState, useEffect } from "react";
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
import { Check, GripVertical, Menu, Plus, Trash2, X } from "lucide-react";
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
    options?: string[]; // For 'Options' type, though not explicitly shown in simple UI
}

interface RegistrationQuestionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialQuestions?: RegistrationQuestion[];
    onSave: (questions: RegistrationQuestion[]) => void;
    questions: RegistrationQuestion[];
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

    const [questions, setQuestions] = useState<RegistrationQuestion[]>(
        initialQuestions && initialQuestions.length > 0
            ? initialQuestions
            : defaultFixedQuestions
    );

    const [newQuestionLabel, setNewQuestionLabel] = useState("");
    const [newQuestionType, setNewQuestionType] = useState<QuestionType>("Text");

    useEffect(() => {
        if (open) {
            setQuestions(
                initialQuestions && initialQuestions.length > 0
                    ? initialQuestions
                    : defaultFixedQuestions
            );
        }
    }, [open, initialQuestions]);

    const handleAddQuestion = () => {
        if (!newQuestionLabel.trim()) return;

        const newQuestion: RegistrationQuestion = {
            id: `custom-${Date.now()}`,
            label: newQuestionLabel,
            type: newQuestionType,
            required: false, // Default to false for custom questions as per UI implication
            fixed: false,
        };

        setQuestions([...questions, newQuestion]);
        setNewQuestionLabel("");
        setNewQuestionType("Text");
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const handleSave = () => {
        onSave(questions);
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
                    {questions.map((question) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm border border-transparent hover:border-gray-200 transition-colors"
                        >
                            <Menu className="text-gray-400 w-5 h-5 cursor-grab" />
                            <div className="flex-1 font-medium text-[15px]">
                                {question.label}
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
                                <>
                                    <div className="text-sm text-gray-500 px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
                                        {question.type}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}

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

"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Target,
  Trophy,
  Users,
  Compass,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface CommunityGoal {
  id: string;
  title: string;
  description: string;
  category: "growth" | "engagement" | "events" | "other";
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline: string;
  completed: boolean;
}

const initialGoals: CommunityGoal[] = [
  {
    id: "g1",
    title: "Expand Student Network",
    description: "Onboard student ambassadors across technical institutes to drive registrations.",
    category: "growth",
    currentValue: 12300,
    targetValue: 15000,
    unit: "members",
    deadline: "30 June 2026",
    completed: false,
  },
  {
    id: "g2",
    title: "Weekly Developer Meets",
    description: "Organize consistent knowledge-sharing sessions with domain experts.",
    category: "events",
    currentValue: 8,
    targetValue: 12,
    unit: "meets",
    deadline: "15 July 2026",
    completed: false,
  },
  {
    id: "g3",
    title: "Discussion Board Activity",
    description: "Achieve a high engagement index in community Q&A channels.",
    category: "engagement",
    currentValue: 85,
    targetValue: 100,
    unit: "% index",
    deadline: "20 June 2026",
    completed: false,
  },
  {
    id: "g4",
    title: "Launch Annual Hackathon",
    description: "Secure sponsorships, finalize partners, and publish register portals.",
    category: "events",
    currentValue: 1,
    targetValue: 1,
    unit: "launch",
    deadline: "05 June 2026",
    completed: true,
  },
];

export default function CommunityGoalsPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId || "";

  const [goals, setGoals] = useState<CommunityGoal[]>(initialGoals);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"growth" | "engagement" | "events" | "other">("growth");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue || !unit.trim() || !deadline.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const newGoal: CommunityGoal = {
      id: `g-${Date.now()}`,
      title,
      description,
      category,
      currentValue: 0,
      targetValue: Number(targetValue),
      unit,
      deadline: new Date(deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      completed: false,
    };

    setGoals((prev) => [newGoal, ...prev]);
    toast.success(`Successfully created goal: "${title}"`);
    
    // Reset Form
    setTitle("");
    setDescription("");
    setCategory("growth");
    setTargetValue("");
    setUnit("");
    setDeadline("");
  };

  const handleToggleComplete = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextCompleted = !g.completed;
          const nextValue = nextCompleted ? g.targetValue : Math.round(g.targetValue / 2);
          toast.success(
            nextCompleted ? `Goal completed: "${g.title}"!` : `Goal status reverted.`
          );
          return { ...g, completed: nextCompleted, currentValue: nextValue };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (goalId: string, goalTitle: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    toast.success(`Deleted goal: "${goalTitle}"`);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "growth":
        return <Users className="w-5 h-5 text-indigo-500" />;
      case "engagement":
        return <Compass className="w-5 h-5 text-emerald-500" />;
      case "events":
        return <Trophy className="w-5 h-5 text-amber-500" />;
      default:
        return <Target className="w-5 h-5 text-slate-500" />;
    }
  };

  // Stats calculation
  const totalCount = goals.length;
  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex justify-center w-full min-h-screen bg-[#FAFAFA] pb-12">
      <div className="w-full p-4 lg:p-6 flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full pb-2 border-b border-neutral-100">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl tracking-tight text-neutral-900 font-bold">
              Community Goals & Milestones
            </h1>
            <p className="text-neutral-700 text-base">
              Define, organize, and monitor targets to drive student community success.
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              ID: {id}
            </p>
          </div>
        </div>

        {/* Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card className="bg-[#FAF8FF] border-primary-200/40 shadow-xs">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary-100 text-primary-700">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Active Goals</p>
                <p className="text-2xl font-bold text-neutral-900">{totalCount - completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FAF8FF] border-primary-200/40 shadow-xs">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Completed Goals</p>
                <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FAF8FF] border-primary-200/40 shadow-xs">
            <CardContent className="pt-6 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500">Success Ratio</span>
                <span className="text-sm font-bold text-primary-700">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-neutral-200" />
            </CardContent>
          </Card>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Active Goals Listing (Left/Main - 7 cols) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-700" />
              Active Goals Track
            </h2>

            <div className="flex flex-col gap-4">
              {goals.map((goal) => {
                const percent = Math.min(
                  Math.round((goal.currentValue / goal.targetValue) * 100),
                  100
                );
                return (
                  <Card
                    key={goal.id}
                    className={`transition-all duration-300 ${
                      goal.completed
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-neutral-200 hover:border-primary-300"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-white border border-neutral-100 shadow-xs shrink-0">
                            {getCategoryIcon(goal.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-semibold text-base ${goal.completed ? "line-through text-neutral-500" : "text-neutral-900"}`}>
                                {goal.title}
                              </h3>
                              <Badge variant={goal.completed ? "secondary" : "default"} className="capitalize">
                                {goal.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-600 mt-1 max-w-xl">
                              {goal.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full ${goal.completed ? "text-emerald-700 hover:text-emerald-800" : "text-neutral-400 hover:text-neutral-600"}`}
                            onClick={() => handleToggleComplete(goal.id)}
                            title={goal.completed ? "Mark Incomplete" : "Mark Complete"}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-red-600 rounded-full"
                            onClick={() => handleDeleteGoal(goal.id, goal.title)}
                            title="Delete Goal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-6 flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-semibold text-neutral-500">
                          <span>Progress: {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}</span>
                          <span>{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-2 bg-neutral-100" />
                      </div>

                      <div className="mt-4 flex justify-between items-center pt-3 border-t border-neutral-100/50">
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Target: {goal.deadline}
                        </span>
                        {goal.completed && (
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Achieved
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Create Goal Form (Right/Secondary - 4 cols) */}
          <div className="xl:col-span-4">
            <Card className="border-neutral-200 shadow-sm sticky top-6">
              <CardHeader className="border-b border-neutral-100">
                <CardTitle className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-700" />
                  Define New Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                      Goal Title *
                    </label>
                    <Input
                      placeholder="e.g. Reach 20,000 members"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                      Description
                    </label>
                    <Textarea
                      placeholder="e.g. Engage student chapters and organize hackathon outreach events to boost user counts."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="bg-transparent border border-neutral-200 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary-700 focus:outline-none"
                      >
                        <option value="growth">Growth</option>
                        <option value="engagement">Engagement</option>
                        <option value="events">Events</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        Target Value *
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 15000"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        Value Unit *
                      </label>
                      <Input
                        placeholder="e.g. members, sessions"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        Target Date *
                      </label>
                      <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary-700 hover:bg-primary-800 text-white mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Publish Community Goal
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import RoleCard from "./_components/RoleCard";
import AddEditRoleModal, { RoleData } from "./_components/AddEditRoleModal";
import EmptyState from "./_components/EmptyState";
import { cn } from "@/lib/utils";

// Mock Data for Owner
const MOCK_OWNER = {
  id: "owner-1",
  name: "Vijay Krishna",
  email: "vijay.krishna@opportunity.com",
  phone: "+91 98765 43210",
};

// Initial Mock Data for Managers
const INITIAL_MANAGERS: RoleData[] = [
  {
    id: "manager-1",
    name: "Sarah Jenkins",
    email: "sarah.j@opportunity.com",
    phone: "+91 98989 89898",
  },
  {
    id: "manager-2",
    name: "David Ross",
    email: "david.ross@opportunity.com",
    phone: "+91 97777 66666",
  }
];

// Initial Mock Data for Evaluators
const INITIAL_EVALUATORS: RoleData[] = [
  {
    id: "eval-1",
    name: "Dr. Emily Chen",
    email: "emily.chen@university.edu",
    phone: "+91 91234 56789",
  },
  {
    id: "eval-2",
    name: "Michael Chang",
    email: "michael.chang@techcorp.com",
    phone: "+91 90000 11111",
  },
  {
    id: "eval-3",
    name: "Priya Patel",
    email: "priya.p@consulting.com",
    phone: "+91 99887 76655",
  }
];

export default function ManageRolesPage() {
  const [activeTab, setActiveTab] = useState<"Manager" | "Evaluator">("Manager");

  // State for roles initialized with mock data
  const [managers, setManagers] = useState<RoleData[]>(INITIAL_MANAGERS);
  const [evaluators, setEvaluators] = useState<RoleData[]>(INITIAL_EVALUATORS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);

  const handleAddClick = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (role: RoleData) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      if (activeTab === "Manager") {
        setManagers(managers.filter(m => m.id !== id));
      } else {
        setEvaluators(evaluators.filter(e => e.id !== id));
      }
    }
  };

  const handleSaveRole = (data: RoleData) => {
    const list = activeTab === "Manager" ? managers : evaluators;
    const setList = activeTab === "Manager" ? setManagers : setEvaluators;

    if (editingRole) {
      // Update
      setList(list.map(item => item.id === editingRole.id ? { ...data, id: editingRole.id } : item));
    } else {
      // Add
      const newRole = { ...data, id: crypto.randomUUID() };
      setList([...list, newRole]);
    }
  };

  const currentList = activeTab === "Manager" ? managers : evaluators;

  return (
    <div className="flex w-full justify-center bg-surface min-h-[calc(100vh-100px)]">
      <div className="w-full max-w-[1200px] p-6 md:p-10 rounded-[20px] bg-background flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-muted-foreground text-base font-normal">
            Manage user roles, set permissions, and control access for a secure system.
          </h1>
        </div>

        {/* Owner Section */}
        <div>
          <RoleCard
            name={MOCK_OWNER.name}
            email={MOCK_OWNER.email}
            phone={MOCK_OWNER.phone}
            type="Owner"
          />
        </div>

        <div className="h-[1px] w-full bg-border" />

        {/* Tabs */}
        <div className="flex items-center gap-4">
          {["Manager", "Evaluator"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "Manager" | "Evaluator")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-[#A020F0] text-white shadow-md shadow-purple-900/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Interactive Role List */}
        <div className="flex flex-col gap-4 min-h-[400px]">
          {currentList.length > 0 ? (
            <>
              {currentList.map((role) => (
                <RoleCard
                  key={role.id}
                  name={role.name}
                  email={role.email}
                  phone={role.phone}
                  type={activeTab}
                  onEdit={() => handleEditClick(role)}
                  onDelete={() => role.id && handleDeleteClick(role.id)}
                />
              ))}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-6 py-2 rounded-full border border-border text-[#A020F0] font-medium hover:bg-[#F3E8FF] transition-colors"
                >
                  <span className="text-xl leading-none mb-0.5">+</span> Add {activeTab}
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              roleName={activeTab}
              onAdd={handleAddClick}
            />
          )}
        </div>

        <AddEditRoleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingRole}
          roleType={activeTab}
          onSave={handleSaveRole}
        />
      </div>
    </div>
  );
}

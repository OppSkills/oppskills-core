"use client";

import React from 'react'
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, ChevronDown, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { ProfileStats } from './_components/profile-stats';

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className='flex flex-col lg:flex-row gap-4 flex-1'>
      <div className='p-4 lg:p-8 bg-neutral-100 rounded-3xl flex-1 overflow-y-auto custom-scrollbar space-y-8'>
        {/* Personal Info Section */}
        <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative group self-center lg:self-start">
              <Avatar className="h-32 w-32 lg:h-40 lg:w-40 shadow-xl rounded-[40px] border-4 border-neutral-50">
                <AvatarImage src={user.imageUrl} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-primary-100 text-primary-600 uppercase">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-lg border border-neutral-100 hover:bg-neutral-50 transition-colors">
                <Camera className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <div className="flex-1 w-full space-y-5">
              <FloatingLabelInput label="Full Name" defaultValue={user.fullName || ""} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingLabelInput 
                  label="Phone Number" 
                  defaultValue={user.primaryPhoneNumber?.phoneNumber || ""} 
                  icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                />
                <FloatingLabelInput 
                  label="Email Address" 
                  defaultValue={user.primaryEmailAddress?.emailAddress || ""} 
                  icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingLabelInput 
                  label="Gender" 
                  defaultValue="Male" 
                  icon={<ChevronDown className="w-5 h-5 text-neutral-400" />}
                />
                <FloatingLabelInput 
                  label="Status" 
                  defaultValue="College Student" 
                  icon={<ChevronDown className="w-5 h-5 text-neutral-400" />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-sm space-y-6">
          <p className="text-xl font-bold text-neutral-800">Education Details</p>
          <div className="space-y-5">
            <FloatingLabelInput label="University / College" defaultValue="Indian Institute of Technology" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingLabelInput 
                label="Course" 
                defaultValue="B.Tech Computer Science" 
                icon={<ChevronDown className="w-5 h-5 text-neutral-400" />}
              />
              <FloatingLabelInput 
                label="Passing Year" 
                defaultValue="2026" 
                icon={<ChevronDown className="w-5 h-5 text-neutral-400" />}
              />
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold text-neutral-800">Skills</p>
          </div>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {["Problem Solving", "Growth Mindset", "Communication", "Teamwork"].map((skill) => (
                <div key={skill} className="px-5 py-2.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100 transition-all hover:bg-primary-100 cursor-default">
                  {skill}
                </div>
              ))}
            </div>
            
            <div className="space-y-4 pt-2">
              <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {["Leadership", "Product Management", "Data Analysis", "Public Speaking"].map((skill) => (
                  <div key={skill} className="px-5 py-2.5 bg-white border border-dashed border-neutral-300 text-neutral-500 rounded-full text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                    + {skill}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <FloatingLabelInput label="Add Skill" defaultValue="" placeholder="Start Typing..." />
            </div>
          </div>
        </div>
      </div>
      <ProfileStats />
    </div>
  );
}

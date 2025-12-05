"use client";

import React, { useState } from "react";
import { useHackathons } from "@/hooks/useHackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export default function CreateHackathon() {
  const { create } = useHackathons();

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    mode: "ONLINE",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target as HTMLInputElement;
    setForm({ ...form, [name]: value });
  }

  function handleSubmit() {
    create.mutate(form);
  }

  return (
    <div className="p-6 border rounded-md max-w-lg space-y-4">
      <Input name="title" placeholder="Title" onChange={handleChange} />
      <Textarea name="description" placeholder="Description" onChange={handleChange} />
      <Input name="startDate" type="date" onChange={handleChange} />
      <Input name="endDate" type="date" onChange={handleChange} />

      <select name="mode" className="border p-2 rounded w-full" onChange={handleChange}>
        <option value="ONLINE">Online</option>
        <option value="OFFLINE">Offline</option>
        <option value="HYBRID">Hybrid</option>
      </select>

      <Button onClick={handleSubmit}>Create Hackathon</Button>
    </div>
  );
}
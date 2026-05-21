"use client";

import { PaymentsTable } from "@/components/features/payments-table";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PaymentsTable />
    </div>
  );
}

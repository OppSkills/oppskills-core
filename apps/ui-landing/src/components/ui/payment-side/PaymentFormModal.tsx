"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { motion, AnimatePresence } from "framer-motion";

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentFormModal({ isOpen, onClose }: PaymentFormModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          
          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[1000px] max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
          >
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between px-6 py-5 bg-muted border-b border-border/10">
              <h5 className="font-poppins text-foreground text-2xl font-semibold leading-[125%] capitalize">
                Payment Form
              </h5>
              <div 
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 cursor-pointer rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
              </div>
            </div>

            {/* --- BODY (SCROLLABLE) --- */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-background">
              
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput label="Account Holder Name *" placeholder="Enter Name" />
                <CustomInput label="Email *" placeholder="Enter Email" type="email" />
                <CustomInput label="Phone Number *" placeholder="Enter Phone" type="tel" />
              </div>

              {/* Row 2 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput label="Bank Name *" placeholder="Enter Bank Name" />
                <CustomInput label="Account Number *" placeholder="Enter Account Number" />
                <CustomInput label="Confirm Account Number *" placeholder="Re-enter Account Number" />
              </div>

              {/* Row 3 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput label="Pan Number *" placeholder="Enter PAN" />
                <CustomInput label="IFSC Code *" placeholder="Enter IFSC" />
                <CustomInput label="GST TIN *" placeholder="Enter GST TIN" />
              </div>

              {/* Row 4 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput label="Pincode *" placeholder="Enter Pincode" />
                <CustomInput label="State *" placeholder="Enter State" />
                <CustomInput label="City *" placeholder="Enter City" />
              </div>

              {/* Row 5 */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <CustomInput label="Address 1 *" placeholder="Enter Address Line 1" />
                <CustomInput label="Address 2 *" placeholder="Enter Address Line 2" />
              </div>

            </div>

            {/* --- FOOTER --- */}
            <div className="flex items-center justify-end px-5 py-4 bg-muted gap-2">
              <Button 
                onClick={onClose}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter text-base font-medium leading-[150%] px-6 py-2.5 h-auto"
              >
                Save Account Details
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- HELPER COMPONENT FOR INPUTS ---
const CustomInput = ({ label, placeholder, type = "text" }: { label: string, placeholder: string, type?: string }) => (
  <div className="flex flex-col items-start gap-1 flex-1 w-full">
    <Label className="font-inter text-muted-foreground text-xs font-normal leading-[150%]">
      {label}
    </Label>
    <Input 
      type={type}
      placeholder={placeholder}
      className="flex h-12 px-4 items-center self-stretch rounded-[24px] border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
    />
  </div>
);
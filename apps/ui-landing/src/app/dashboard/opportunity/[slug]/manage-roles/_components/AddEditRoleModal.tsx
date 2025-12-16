import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export interface RoleData {
    id?: string;
    name: string;
    email: string;
    phone: string;
}

interface AddEditRoleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RoleData | null;
    roleType: "Manager" | "Evaluator";
    onSave: (data: RoleData) => void;
}

export default function AddEditRoleModal({
    open,
    onOpenChange,
    initialData,
    roleType,
    onSave,
}: AddEditRoleModalProps) {
    const [formData, setFormData] = useState<RoleData>({
        name: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (open) {
            setFormData(initialData || { name: "", email: "", phone: "" });
        }
    }, [open, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit" : "Add"} {roleType}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" className="text-right text-left">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={`Enter ${roleType}'s Name`}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email" className="text-right text-left">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={`Enter ${roleType}'s Email`}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="phone" className="text-right text-left">
                            Phone Number
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 99999 99999"
                            className="col-span-3"
                            required
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="submit" className="bg-[#A020F0] hover:bg-[#8e1cd6] w-full">
                            {initialData ? "Save Changes" : "Add " + roleType}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

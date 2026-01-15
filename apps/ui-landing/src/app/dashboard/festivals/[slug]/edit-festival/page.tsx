import { Button } from "@/components/ui/button";

export default function EditFestivalPage() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-bold">Edit Festival</h1>
            <p className="text-muted-foreground mt-2">
                This feature is currently under development.
            </p>
            <div className="mt-8">
                <Button disabled>Save Changes (Mock)</Button>
            </div>
        </div>
    );
}

import { Button } from "@/components/ui/button";

export default function FestivalSettingsPage() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-bold">Festival Settings</h1>
            <p className="text-muted-foreground mt-2">
                Configuration options will appear here.
            </p>
            <div className="mt-8">
                <Button variant="destructive">Delete Festival (Mock)</Button>
            </div>
        </div>
    );
}

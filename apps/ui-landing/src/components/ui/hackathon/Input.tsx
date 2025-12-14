export default function HackathonInput({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <p className={`bg-surface px-2 py-1 text-xs flex gap-2 items-center font-semibold rounded-sm text-foreground/70 ${className}`}>{children}</p>
    )
}

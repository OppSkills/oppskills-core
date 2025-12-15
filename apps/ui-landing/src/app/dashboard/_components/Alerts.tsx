interface AlertItem {
    title: string;
    subtitle: string;
    status: string;
    value: string;
}

const alertsData: AlertItem[] = [
    {
        title: "Hackathon Name",
        subtitle: "Guru Jambheshwar University Science and Technology, Hisar",
        status: "Evaluation",
        value: "Round 1",
    },
    {
        title: "Hackathon Name",
        subtitle: "Guru Jambheshwar University Science and Technology, Hisar",
        status: "Evaluation",
        value: "Round 1",
    },
    {
        title: "Hackathon Name",
        subtitle: "Guru Jambheshwar University Science and Technology, Hisar",
        status: "Evaluation",
        value: "Round 1",
    },
];

export default function Alerts() {
    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border flex flex-col">
            <h2 className="text-xl font-bold mb-4">Alerts</h2>
            <div className="flex flex-col gap-4">
                {alertsData.map((alert, index) => (
                    <div key={index} className="flex justify-between items-center p-4 rounded-[12px] border border-border/60 bg-white hover:border-primary/30 transition-colors">
                        <div className="flex flex-col gap-1 max-w-[70%]">
                            <h3 className="font-semibold text-foreground text-sm">{alert.title}</h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                                {alert.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {/* Evaluation Badge - Purple */}
                            <div className="bg-purple-100 text-purple-700 text-[10px] font-medium px-3 py-1 rounded w-fit text-center min-w-[70px]">
                                Evaluation
                            </div>
                            {/* Round Badge - White with Border */}
                            <div className="bg-white border text-zinc-600 text-[10px] font-medium px-3 py-1 rounded-full w-fit text-center min-w-[70px]">
                                Round 1
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

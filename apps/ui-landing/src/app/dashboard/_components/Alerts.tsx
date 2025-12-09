interface AlertItem {
    title: string;
    subtitle: string;
    status: string;
    value: string;
}

const alertsData: AlertItem[] = [
    {
        title: "R1 Synopsis Submission",
        subtitle: "Last Date: 3 Jan 2025",
        status: "Participated",
        value: "150/232",
    },
    {
        title: "R2 Presentations",
        subtitle: "Guru Jambheshwar University Science and Technology, Hisar",
        status: "Participated",
        value: "60/150",
    },
    {
        title: "R3 Last Round",
        subtitle: "Guru Jambheshwar University Science and Technology, Hisar",
        status: "Participated",
        value: "30/60",
    },
];

export default function Alerts() {
    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border flex flex-col">
            <h2 className="text-xl font-bold mb-4">Alerts</h2>
            <div className="flex flex-col gap-4">
                {alertsData.map((alert, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-[12px] border border-border/60 bg-white hover:border-primary/30 transition-colors">
                        <div className="flex flex-col gap-1 max-w-[70%]">
                            <h3 className="font-semibold text-foreground text-sm">{alert.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {alert.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="bg-primary/20 text-primary text-[10px] font-medium px-3 py-1 rounded-t-lg w-full text-center min-w-[80px]">
                                {alert.status}
                            </div>
                            <div className="bg-white border border-t-0 border-primary/20 text-foreground text-sm font-bold px-3 py-1 rounded-b-lg w-full text-center shadow-sm min-w-[80px]">
                                {alert.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

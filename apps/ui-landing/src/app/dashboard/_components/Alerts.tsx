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
          <div
            key={index}
            className="flex justify-between items-center p-4 rounded-[12px] border border-border/60 bg-background hover:border-primary/30 transition-colors gap-2"
          >
            <div className="flex flex-col gap-1 max-w-[70%]">
              <p className="font-semibold text-foreground text-md">
                {alert.title}
              </p>
              <p className="text-xs text-neutral-600 line-clamp-2 leading-tight">
                {alert.subtitle}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border overflow-hidden text-xs border-primary-300">
              <div className="bg-primary-200 text-primary-600 w-full text-center py-1 border-b border-primary-300 whitespace-nowrap">
                <p>Evaluation</p>
              </div>
              <div className="py-1 px-4 flex justify-center w-full text-primary-900 text-sm whitespace-nowrap">
                <p>Stage 1</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

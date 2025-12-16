import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button';

export default function Stages({ selectedStage, onSelectStage }: { selectedStage: string, onSelectStage: (stage: string) => void }) {
    const stagesData = [
        {
            name: "All registrations",
            description: "Submission through Oppskills",
        },
        {
            name: "R1 - Synopsis Submissions",
            description: "Submission through Oppskills",
        },
        {
            name: "R2 - Online Presentation",
            description: "Submission through Oppskills",
        },
        {
            name: "R3 - Finale Offline",
            description: "Submission through Oppskills",
        }
    ];

    const Card = ({ title, description, isActive, onClick }: { title: string; description: string; isActive: boolean; onClick: () => void }) => {
        return (
            <div
                onClick={onClick}
                className={cn(
                    'h-62px flex border-foreground/50 border rounded-[12px] p-[8px] gap-2 cursor-pointer transition-colors',
                    isActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                )}
            >
                <div className='flex w-6 h-6 justify-center items-center'>
                    <Image src={isActive ? "/icons/check_active.svg" : "/icons/check.svg"} alt="check" height={24} width={24} />
                </div>
                <div className='flex flex-col gap-2'>
                    <h2 className={cn('text-[16px] text-foreground/80', isActive && 'text-primary')}>{title}</h2>
                    <p className='text-xs text-muted-foreground'>{description}</p>
                </div>
            </div>
        )
    }

    return (
        <div className='flex items-center pb-2 no-scrollbar'>
            {stagesData.map((stage, i) => (
                <div key={i} className='flex items-center shrink-0'>
                    {i > 0 && <div className="px-2"><Image src="/icons/arrow-right.svg" alt="arrow" height={24} width={20} /></div>}
                    <Card
                        title={stage.name}
                        description={stage.description}
                        isActive={selectedStage === stage.name}
                        onClick={() => onSelectStage(stage.name)}
                    />
                </div>
            ))}
            <div className='flex items-center justify-center ml-4 cursor-pointer hover:scale-110 transition-all shrink-0'>
                <Image alt='add-steps' src="/icons/plus.svg" height={32} width={32} />
            </div>
        </div>
    )
}

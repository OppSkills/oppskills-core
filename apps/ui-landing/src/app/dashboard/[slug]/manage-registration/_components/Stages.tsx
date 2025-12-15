import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button';

export default function Stages() {
    const stagesData = [
        {
            name: "All registrations",
            description: "Submission through Oppskills",
            isPrimary: true
        },
        {
            name: "R1 - Synopsis Submissions",
            description: "Submission through Oppskills",
            isPrimary: false
        },
        {
            name: "R2 - Online Presentation",
            description: "Submission through Oppskills",
            isPrimary: false
        },
        {
            name: "R3 - Finale Offline",
            description: "Submission through Oppskills",
            isPrimary: false
        }
    ];
    const Card = ({ title, description, isPrimary }: { title: string; description: string; isPrimary: boolean }) => {
        return (
            <div className={cn('h-62px flex border-foreground/50 border rounded-[12px] p-[8px] gap-2', isPrimary && 'bg-primary/10 border-primary')}>
                <div className='flex w-6 h-6 justify-center items-center'>
                    <Image src={isPrimary ? "/icons/check_active.svg" : "/icons/check.svg"} alt="check" height={24} width={24} />
                </div>
                <div className='flex flex-col gap-2'>
                    <h2 className={cn('text-[16px] text-foreground/80', isPrimary && 'text-primary')}>{title}</h2>
                    <p className='text-xs text-muted-foreground'>{description}</p>
                </div>
            </div>
        )
    }
    return (
        <div className='flex items-center'>
            {stagesData.map((stage, i) => (
                <div key={i} className='flex items-center'>
                    {i > 0 && <Image src="/icons/arrow-right.svg" alt="arrow" height={24} width={20} />}
                    <Card title={stage.name} description={stage.description} isPrimary={stage.isPrimary} />
                </div>
            ))}
            <div className='flex items-center justify-center ml-4 cursor-pointer hover:scale-120 transition-all'>
                <Image alt='add-steps' src="/icons/plus.svg" height={32} width={32} />
            </div>
        </div>
    )
}

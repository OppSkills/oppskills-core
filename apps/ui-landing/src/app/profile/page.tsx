import { Calendar, ChartLine, Trophy } from 'lucide-react'
import React from 'react'

export default function page() {
  return (
    <div className='flex gap-4 flex-1'>
      <div className='p-4 bg-neutral-100 rounded-3xl flex-1'>
        {
          // USER CONTENT GOES HERE
        }
      </div>
      <div className='p-4 bg-neutral-100 rounded-3xl w-full md:w-[300px]'>
        <div className='bg-linear-to-br from-primary-700 from-10% to-primary-900 to-90% p-4 text-neutral-100 flex flex-col gap-4 rounded-2xl w-full'>
          <p className='font-medium text-xl'>Your Stats</p>
          <div className='flex flex-col gap-4'>
            {
              [
                {
                  title: "Events",
                  value: 12,
                  icon: Calendar
                },
                {
                  title: "Badges",
                  value: 8,
                  icon: Trophy
                },
                {
                  title: "Rank",
                  value: 8,
                  icon: ChartLine
                }
              ].map((e, i) =>
                <div key={i} className='flex w-full justify-between'>
                  <div className='flex flex-1 gap-2'>
                    <e.icon />
                    <p>{e.title}</p>
                  </div>
                  <div>{e.value}</div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>)
}

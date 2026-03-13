import Image from 'next/image'
import React from 'react'

export default function TrustedBy() {
    return (
        <div className='pb-20 flex flex-col gap-6'>
            <h2 className='text-4xl'>Trusted By</h2>
            <p className='text-neutral-600 text-xl'>Top colleges already choose oppskills to conduct their events & competitions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
                {["iith.png", "iitd.png", "sharda.png", "iilm.png", "krrc.png", "rishihood.png", "gla.png"].map((e, i) => (
                    <div key={i} className="flex justify-center w-full">
                        <Image
                            src={`/logos/${e}`}
                            alt={e}
                            width={120}
                            height={100}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

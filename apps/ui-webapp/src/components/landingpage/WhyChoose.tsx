import Image from 'next/image'
import React from 'react'

export default function WhyChoose() {
    return (
        <div className='pb-20 flex flex-col gap-4'>
            <h3 className='text-4xl text-neutral-900'>Why Hustlers Choose Oppskills</h3>
            <p className='text-neutral-600 text-xl'>Discover more. Miss less. Participate smarter.</p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {
                    ["all-in-one.png", "transparent-details.png", "quick-participation.png", "same-day-approval.png", "quick-secure-payout.png", "campus-life.png"].map((e, i) => {
                        return (
                            <div key={i}>
                                <img src={`/illustrations/hustlers/${e}`} alt={e} width={"100%"} />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

import Image from 'next/image'

export default function HeroSection() {

  return (
    <div className='py-8 flex flex-col gap-8'>
      <div className='flex sm:flex-row flex-col gap-4 justify-between'>
        <div className='flex flex-col gap-2'>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-medium'>Discover Opportunities</h2>
          <h2 className='text-3xl sm:text-4xl md:text-5xl italic text-primary-500 font-medium'>That Move You Forward</h2>
        </div>
        <div className=''>
          <div className='rounded-full bg-linear-to-r from-primary-600 to-primary-200 p-px overflow-hidden'>
            <div className='bg-primary-100 px-3 py-1 rounded-full flex gap-2 items-center'>
              <Image
                src="/illustrations/user-3d.svg"
                alt="Hero Card"
                width={40}
                height={40}
              />
              <p className='text-sm sm:text-base text-neutral-800'>Grow your skills with 10,000 other hustlers</p>
            </div>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8'>
        {
          [
            { image: "/illustrations/desk_laptop.svg", title: "Hackathons", link: "/hackathons" },
            { image: "/illustrations/rewards.svg", title: "Competitions", link: "/profile/registrations" },
            { image: "/illustrations/desk_coffee.svg", title: "Events", link: "/events" },
            { image: "/illustrations/communities.svg", title: "Communities", link: "/communities" },
          ].map((item, index) => {
            return (
              <div className='bg-primary-200 rounded-xl p-4 relative h-40 overflow-hidden' key={index}>
                <h4 className='text-neutral-900 text-lg font-normal'>{item.title}</h4>
                <div className='rounded-full bg-primary-300 w-40 h-40 absolute -bottom-10 -right-10'>
                </div>
                <Image
                  src={item.image}
                  alt="Hero Card"
                  width={120}
                  className='absolute bottom-0 right-0'
                  height={120}
                />
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

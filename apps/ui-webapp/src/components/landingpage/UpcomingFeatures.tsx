import UpcomingFeaturesCard from './_components/UpcomingFeaturesCard'

export default function UpcomingFeatures() {
    return (
        <div className='flex flex-col gap-4 pb-16'>
            <h2 className='text-4xl text-neutral-900 font-semibold'>Upcoming on oppSkills</h2>
            <p className='text-lg text-neutral-600 pb-4'>Oh, this platform is going somewhere</p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {
                    [
                        { title: "Skill-Based Learning Tracks", description: "Curated paths combining competitions, events, and communities around one skill.", image: "track.svg" },
                        { title: "Mentor-Led Sessions", description: "Live sessions and AMAs with industry professionals and experienced creators.", image: "mentor.svg" },
                        { title: "National-Level Challenges", description: "Large-scale competitions hosted with brands, startups, and institutions.", image: "challenges.svg" },
                        { title: "Creator & Organizer Tools", description: "Better dashboards, analytics, and tools for event and community hosts.", image: "tools.svg" },
                    ].map((item, index) => (
                        <UpcomingFeaturesCard key={index} title={item.title} description={item.description} image={item.image} />
                    ))
                }
            </div>
        </div>
    )
}

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/')
    }

    const user = await currentUser()

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
                    <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
                        <p><span className="font-medium">Email:</span> {user?.emailAddresses[0]?.emailAddress}</p>
                        <p><span className="font-medium">User ID:</span> {userId}</p>
                        <p><span className="font-medium">Last Sign In:</span> {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-2">Hackathons</h3>
                        <p className="text-gray-600 dark:text-gray-300">Discover and participate in exciting hackathons</p>
                        <div className="mt-4 text-2xl font-bold text-blue-600">0</div>
                        <p className="text-sm text-gray-500">Registered events</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-2">Communities</h3>
                        <p className="text-gray-600 dark:text-gray-300">Connect with like-minded developers</p>
                        <div className="mt-4 text-2xl font-bold text-green-600">0</div>
                        <p className="text-sm text-gray-500">Joined communities</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-2">Skills</h3>
                        <p className="text-gray-600 dark:text-gray-300">Track your learning progress</p>
                        <div className="mt-4 text-2xl font-bold text-purple-600">0</div>
                        <p className="text-sm text-gray-500">Skills acquired</p>
                    </div>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <p className="text-gray-600 dark:text-gray-300">No recent activity to display.</p>
                </div>
            </div>
        </div>
    )
}
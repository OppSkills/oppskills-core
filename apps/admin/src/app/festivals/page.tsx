import { mockFestivals } from "@/lib/mock-data";

export default function FestivalsPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Festivals</h1>
                    <p className="text-gray-500 mt-1">Manage festivals and large gatherings.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Create Festival
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Title</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Location</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Attendees</th>
                                <th className="px-6 py-4 font-medium text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockFestivals.map((festival) => (
                                <tr key={festival.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{festival.title}</td>
                                    <td className="px-6 py-4 text-gray-600">{festival.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{festival.location}</td>
                                    <td className="px-6 py-4 text-gray-600">{festival.attendees}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-blue-600 font-medium text-sm transition-colors">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

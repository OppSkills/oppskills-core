import { mockHackathons } from "@/lib/mock-data";

export default function HackathonsPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hackathons</h1>
                    <p className="text-gray-500 mt-1">Manage hackathons and competitions.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Create Hackathon
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">Title</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Participants</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Prize Pool</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockHackathons.map((hackathon) => (
                                <tr key={hackathon.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{hackathon.title}</td>
                                    <td className="px-6 py-4 text-gray-600">{hackathon.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{hackathon.participants}</td>
                                    <td className="px-6 py-4 text-gray-600">{hackathon.prizePool}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hackathon.status === "Open"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {hackathon.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-blue-600 font-medium text-sm transition-colors">
                                            Details
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

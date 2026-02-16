import { mockPayments } from "@/lib/mock-data";

export default function PaymentsPage() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-500 mt-1">View transaction history and status.</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-50">
                    Export History
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-900">User</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Amount</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-900">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{payment.user}</td>
                                    <td className="px-6 py-4 text-gray-600">{payment.amount}</td>
                                    <td className="px-6 py-4 text-gray-600">{payment.date}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === "Completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-blue-600 font-medium text-sm transition-colors">
                                            Invoice
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

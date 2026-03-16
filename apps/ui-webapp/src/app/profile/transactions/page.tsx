"use client";

import React from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'


const TRANSACTIONS = [
    { desc: "Registration Fee - AI Hackathon", date: "Mar 10, 2024", amount: -499, status: "Success" },
    { desc: "Prize Money - Design Challenge", date: "Feb 25, 2024", amount: 2000, status: "Success" },
    { desc: "Workshop Fee - Next.js Mastery", date: "Jan 15, 2024", amount: -299, status: "Success" },
    { desc: "Refund - Cancelled Event", date: "Dec 30, 2023", amount: 199, status: "Pending" },
]

export default function TransactionsPage() {
    return (
        <div className='flex flex-col lg:flex-row gap-4 flex-1 h-full'>
            <div className='p-4 lg:p-8 bg-neutral-100 rounded-3xl flex-1 overflow-hidden h-fit'>
                <div className='bg-white rounded-2xl shadow-sm overflow-x-auto'>
                    <table className='w-full text-left min-w-[600px]'>
                        <thead className='bg-neutral-50'>
                            <tr>
                                <th className='px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider'>Description</th>
                                <th className='px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider'>Date</th>
                                <th className='px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider'>Amount</th>
                                <th className='px-6 py-4 font-bold text-neutral-500 uppercase text-xs tracking-wider'>Status</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-neutral-100'>
                            {TRANSACTIONS.map((t, i) => (
                                <tr key={i} className='hover:bg-neutral-50 transition-colors'>
                                    <td className='px-6 py-5'>
                                        <div className='flex items-center gap-3'>
                                            <div className={`p-2 rounded-lg ${t.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {t.amount > 0 ? <ArrowDownLeft className='w-4 h-4' /> : <ArrowUpRight className='w-4 h-4' />}
                                            </div>
                                            <span className='font-medium text-neutral-800'>{t.desc}</span>
                                        </div>
                                    </td>
                                    <td className='px-6 py-5 text-neutral-500'>{t.date}</td>
                                    <td className={`px-6 py-5 font-bold ${t.amount > 0 ? 'text-green-600' : 'text-neutral-800'}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount}
                                    </td>
                                    <td className='px-6 py-5'>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

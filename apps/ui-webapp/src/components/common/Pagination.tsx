import React, { useState, useEffect } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Pagination({ setPerPage, perPage = 10, curPage, totalPages, onPageChange }: {
    setPerPage: (value: number) => void
    perPage: number
    curPage: number
    totalPages: number
    onPageChange: (value: number) => void
}) {
    const [inputValue, setInputValue] = useState(curPage.toString())

    useEffect(() => {
        setInputValue(curPage.toString())
    }, [curPage])

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page)
        }
    }

    const getPages = () => {
        const pages: (number | string)[] = []
        const showMax = 1 // number of neighbors to show around current page

        // Always include 1
        pages.push(1)

        if (curPage > showMax + 2) {
            pages.push('ellipsis-1')
        }

        // Add pages around current page
        for (let i = Math.max(2, curPage - showMax); i <= Math.min(totalPages - 1, curPage + showMax); i++) {
            pages.push(i)
        }

        if (curPage < totalPages - (showMax + 1)) {
            pages.push('ellipsis-2')
        }

        // Always include totalPages if > 1
        if (totalPages > 1) {
            pages.push(totalPages)
        }

        // Filter out duplicates (can happen if totalPages is small)
        return Array.from(new Set(pages))
    }

    return (
        <div className='flex flex-wrap items-center justify-between gap-6 w-full py-4 text-[#2D2D2D]'>
            {/* Left side: Showing per page */}
            <div className='flex items-center gap-3 text-sm'>
                <span className="font-medium text-base">Showing per page</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="min-w-15 rounded-sm border-neutral-500 px-4 flex justify-between items-center font-semibold text-neutral-700 shadow-sm hover:bg-neutral-100 hover:text-primary-600">
                            {perPage}
                            <ChevronDown className="h-4 w-4 ml-1 text-[#6D28D9]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[75px] rounded-xl p-1">
                        {[10, 20, 30, 40].map((item) => (
                            <DropdownMenuItem key={item} onClick={() => setPerPage(item)} className="cursor-pointer justify-center py-2 font-semibold text-neutral-700 rounded-lg">
                                {item}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Middle: Go to page */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-sm border-primary-400 bg-primary-100 text-neutral-800 hover:bg-primary-500 hover:text-neutral-200 disabled:opacity-30 shadow-sm transition-all"
                    onClick={() => handlePageChange(curPage - 1)}
                    disabled={curPage === 1}
                >
                    <ChevronLeft className="h-5 w-5 stroke-[2.5px]" />
                </Button>

                <div className="flex items-center gap-2">
                    {getPages().map((page, index) => (
                        <React.Fragment key={index}>
                            {typeof page === 'string' && page.startsWith('ellipsis') ? (
                                <span className="px-1 text-neutral-800 text-xs select-none">...</span>
                            ) : (
                                <Button
                                    variant={curPage === page ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 w-8 p-0 rounded-sm font-bold text-sm transition-all ${curPage === page
                                        ? 'bg-primary-600 text-neutral-100 shadow-md'
                                        : 'border-primary-400 bg-primary-100 text-neutral-800 hover:bg-primary-500 hover:text-neutral-200 shadow-sm'
                                        }`}
                                    onClick={() => handlePageChange(page as number)}
                                >
                                    {page}
                                </Button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-sm border-primary-400 bg-primary-100 text-neutral-800 hover:bg-primary-500 hover:text-neutral-200 disabled:opacity-30 shadow-sm transition-all"
                    onClick={() => handlePageChange(curPage + 1)}
                    disabled={curPage === totalPages}
                >
                    <ChevronRight className="h-5 w-5 stroke-[2.5px]" />
                </Button>
            </div>

            {/* Right: Pagination Buttons */}
            <div className='flex items-center gap-3 text-sm'>
                <span className="font-medium opacity-80">Go to page</span>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={cn(
                            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                            "w-12 px-2 py-0 text-center rounded-full text-sm"
                        )}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePageChange(Number(inputValue))
                            }
                        }}
                    />
                    <button
                        className="flex items-center gap-1 text-[#6D28D9] font-bold hover:opacity-70 transition-opacity uppercase text-xs tracking-wider"
                        onClick={() => handlePageChange(Number(inputValue))}
                    >
                        Go
                        <ChevronRight className="h-4 w-4 stroke-[3px]" />
                    </button>
                </div>
            </div>


        </div>
    )
}

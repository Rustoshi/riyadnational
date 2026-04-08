'use client';

export function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Mobile Layout Skeleton */}
            <div className="lg:hidden">
                {/* Mobile Header Skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-700" />
                        <div>
                            <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
                            <div className="h-5 w-32 bg-gray-700 rounded" />
                        </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gray-700" />
                </div>

                {/* Balance Card Skeleton */}
                <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                    <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
                    <div className="h-10 w-48 bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-700 rounded" />
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="h-14 w-14 rounded-full bg-gray-700 mb-2" />
                            <div className="h-3 w-12 bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>

                {/* Transactions Skeleton */}
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                    <div className="h-5 w-40 bg-gray-700 rounded mb-4" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-700 last:border-0">
                            <div className="h-10 w-10 rounded-full bg-gray-700" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
                                <div className="h-3 w-24 bg-gray-700 rounded" />
                            </div>
                            <div className="h-4 w-20 bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop Layout Skeleton */}
            <div className="hidden lg:block">
                {/* Stats Bar Skeleton */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl p-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gray-700" />
                                <div className="flex-1">
                                    <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
                                    <div className="h-6 w-28 bg-gray-700 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid Skeleton */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        {/* Quick Actions Skeleton */}
                        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                            <div className="h-6 w-32 bg-gray-700 rounded mb-6" />
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex flex-col items-center p-4 rounded-xl" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                                        <div className="h-12 w-12 rounded-full bg-gray-600 mb-3" />
                                        <div className="h-4 w-16 bg-gray-600 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transactions Skeleton */}
                        <div className="rounded-xl" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                            <div className="px-6 py-4 border-b border-gray-700">
                                <div className="h-5 w-40 bg-gray-700 rounded" />
                            </div>
                            <div className="p-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-700 last:border-0">
                                        <div className="h-10 w-10 rounded-full bg-gray-700" />
                                        <div className="flex-1 grid grid-cols-5 gap-4">
                                            <div className="h-4 w-24 bg-gray-700 rounded" />
                                            <div className="h-4 w-16 bg-gray-700 rounded" />
                                            <div className="h-4 w-20 bg-gray-700 rounded" />
                                            <div className="h-4 w-28 bg-gray-700 rounded" />
                                            <div className="h-4 w-24 bg-gray-700 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="space-y-6">
                        {/* Stats Card Skeleton */}
                        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                            <div className="h-5 w-32 bg-gray-700 rounded mb-6" />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 mb-4 last:mb-0">
                                    <div className="h-10 w-10 rounded-full bg-gray-700" />
                                    <div className="flex-1">
                                        <div className="h-3 w-24 bg-gray-700 rounded mb-2" />
                                        <div className="h-5 w-32 bg-gray-700 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Transfer Skeleton */}
                        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgb(31 41 55)' }}>
                            <div className="h-5 w-28 bg-gray-700 rounded mb-6" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-lg mb-4 last:mb-0" style={{ backgroundColor: 'rgb(55 65 81)' }}>
                                    <div className="h-10 w-10 rounded-full bg-gray-600" />
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-gray-600 rounded mb-2" />
                                        <div className="h-3 w-32 bg-gray-600 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

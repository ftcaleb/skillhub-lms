'use client'

export function TrackSkeleton() {
    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 flex flex-col gap-6">
            {/* Hero skeleton */}
            <div className="flex flex-col gap-4 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Back button */}
                <div className="skeleton h-6 w-28 rounded-lg" />

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex flex-col gap-3 flex-1">
                        {/* Title */}
                        <div className="skeleton h-10 w-3/4 rounded-lg" />
                        {/* Code badge */}
                        <div className="skeleton h-6 w-24 rounded-full" />
                        {/* Description */}
                        <div className="skeleton h-4 w-full max-w-xl rounded" />
                        <div className="skeleton h-4 w-2/3 max-w-xl rounded" />
                    </div>
                </div>
            </div>

            {/* Progress bar skeleton */}
            <div className="track-skeleton-card">
                <div className="flex items-center justify-between mb-3">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-4 w-20 rounded" />
                </div>
                <div className="skeleton h-2.5 rounded-full" />
            </div>

            {/* Tab row placeholder */}
            <div className="flex gap-1">
                <div className="skeleton h-9 w-20 rounded-lg" />
                <div className="skeleton h-9 w-20 rounded-lg opacity-50" />
                <div className="skeleton h-9 w-24 rounded-lg opacity-50" />
            </div>

            {/* Level card skeletons */}
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="track-skeleton-card">
                    <div className="flex items-center gap-4">
                        <div className="skeleton h-8 w-8 rounded-lg" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-2/5 rounded mb-2" />
                            <div className="skeleton h-3 w-1/4 rounded" />
                        </div>
                        <div className="skeleton h-9 w-9 rounded-full" />
                        <div className="skeleton h-4 w-4 rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}

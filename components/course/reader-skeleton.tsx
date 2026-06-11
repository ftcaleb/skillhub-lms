'use client'

export function ReaderSkeleton() {
    return (
        <div className="mx-auto w-full max-w-[1280px] px-8 sm:px-12 md:px-16 py-8 flex flex-col gap-6 min-h-[calc(100vh-6rem)] pb-12">
            {/* Nav bar skeleton */}
            <div className="flex items-center justify-between py-4">
                <div className="skeleton h-8 w-20 rounded-lg" />
                <div className="skeleton h-8 w-40 rounded-lg" />
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start w-full">
                
                {/* Main Content Area Skeleton */}
                <div
                    className="w-full flex flex-col"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--surface-radius, 16px)',
                        padding: 'var(--card-padding, clamp(16px, 5vw, 48px))',
                        boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                    }}
                >
                    {/* Header */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="skeleton h-3 w-32 rounded" />
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-2">
                            <div className="skeleton h-8 w-2/3 rounded-lg" />
                            <div className="skeleton h-8 w-28 rounded-lg shrink-0" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div
                        className="w-full mb-6"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                    />

                    {/* Content Body */}
                    <div className="flex flex-col gap-4 mt-2 max-w-[72ch]">
                        <div className="skeleton h-4 w-full rounded" />
                        <div className="skeleton h-4 w-5/6 rounded" />
                        <div className="skeleton h-4 w-4/5 rounded" />
                        <div className="skeleton h-4 w-full rounded" />
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-32 w-full rounded-xl mt-2" />
                        <div className="skeleton h-4 w-full rounded mt-2" />
                        <div className="skeleton h-4 w-4/5 rounded" />
                        <div className="skeleton h-4 w-2/3 rounded" />
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div
                    className="w-full lg:w-[320px] shrink-0 rounded-[var(--surface-radius,16px)]"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                        padding: '20px',
                    }}
                >
                    {/* Progress placeholder */}
                    <div className="pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="skeleton h-3 w-24 rounded mb-4" />
                        <div className="skeleton h-3 w-16 rounded mb-2" />
                        <div className="skeleton h-2 w-full rounded-full" />
                    </div>

                    {/* Roadmap placeholder */}
                    <div className="pt-5">
                        <div className="skeleton h-3 w-16 rounded mb-3" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-2.5 py-2">
                                <div className="skeleton h-3.5 w-3.5 rounded-full shrink-0" />
                                <div className="skeleton h-3 flex-1 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

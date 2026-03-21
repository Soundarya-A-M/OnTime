// Reusable skeleton loading components
// Usage: replace raw "Loading..." text with these for polished UX

/**
 * Single skeleton line
 */
export const SkeletonLine = ({ width = 'w-full', height = 'h-4', className = '' }) => (
    <div className={`${width} ${height} bg-white/10 rounded-lg animate-pulse ${className}`} />
);

/**
 * Skeleton card — used in route/bus grid lists
 */
export const SkeletonCard = () => (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
                <SkeletonLine width="w-3/4" height="h-6" />
                <SkeletonLine width="w-1/3" height="h-4" />
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse ml-4 flex-shrink-0" />
        </div>
        <div className="space-y-2">
            <SkeletonLine width="w-full" height="h-3" />
            <SkeletonLine width="w-2/3" height="h-3" />
        </div>
    </div>
);

/**
 * Skeleton table row
 */
export const SkeletonTableRow = ({ cols = 4 }) => (
    <tr className="border-b border-white/5">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="py-3 px-4">
                <div className={`h-4 bg-white/10 rounded animate-pulse ${i === 0 ? 'w-28' : i === cols - 1 ? 'w-16' : 'w-36'}`} />
            </td>
        ))}
    </tr>
);

/**
 * Full-page loading spinner — used for auth-protected page transitions
 */
export const PageLoader = ({ message = 'Loading...' }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-medium">{message}</p>
        </div>
    </div>
);

/**
 * Inline spinner — small, inline with text
 */
export const Spinner = ({ size = 'w-5 h-5', color = 'border-purple-500' }) => (
    <div className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin`} />
);

/**
 * Empty state component — reusable across pages
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="text-center py-16 px-4">
        {Icon && (
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-500" />
            </div>
        )}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        {description && <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">{description}</p>}
        {action}
    </div>
);

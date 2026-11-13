/**
 * EmptyState
 *
 * Friendly placeholder shown when a list or table has no rows.
 * Renders the shared illustration (/images/empty-state.svg), a title,
 * an optional description and an optional call-to-action.
 *
 * Usage:
 *   <EmptyState title="No leads yet" description="Create your first lead." action={<button>…</button>} />
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

export default function EmptyState({ title = 'Nothing here yet', description, action, compact = false }) {
    return (
        <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-8' : 'py-14'}`}>
            <img
                src="/images/empty-state.svg"
                alt=""
                aria-hidden="true"
                className={`${compact ? 'w-28' : 'w-40'} h-auto mb-4 select-none dark:opacity-80`}
                draggable="false"
            />
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

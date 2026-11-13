/**
 * PageHeader
 *
 * Consistent page title block used at the top of every CRM page:
 * coloured icon tile + title + subtitle on the left, action buttons on the
 * right. Stacks vertically on small screens.
 *
 * Usage:
 *   <PageHeader icon={Target} title="Leads" subtitle="Track prospects" actions={<Button/>} />
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

export default function PageHeader({ icon: Icon, title, subtitle, actions, tint = 'bg-primary/10 text-primary' }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                        <Icon className="w-5 h-5" />
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

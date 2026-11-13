/**
 * Sidebar
 *
 * Collapsible sidebar navigation for the Mini CRM admin layout.
 * Nav items are grouped into sections (Overview, Sales, Workspace, Admin)
 * and filtered by the authenticated user's role. Uses lucide-react icons.
 * On mobile, renders inside a slide-in drawer (see AppLayout) and shows a
 * close button instead of the collapse toggle.
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Users, Target, FileInput, Building2, KanbanSquare,
    ListChecks, Activity, BarChart3, UserCog, ShieldCheck, Settings,
    Code2, Trash2, ChevronsLeft, ChevronsRight, X, Sparkles,
} from 'lucide-react';

const ALL   = ['admin', 'manager', 'sales_user'];
const MGMT  = ['admin', 'manager'];
const ADMIN = ['admin'];

const sections = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard, roles: ALL },
            { label: 'Activities', href: '/activities', icon: Activity,        roles: MGMT },
            { label: 'Reports',    href: '/reports',    icon: BarChart3,       roles: MGMT },
        ],
    },
    {
        title: 'Sales',
        items: [
            { label: 'Leads',     href: '/leads',      icon: Target,       roles: ALL },
            { label: 'Deals',     href: '/deals',      icon: KanbanSquare, roles: ALL },
            { label: 'Contacts',  href: '/contacts',   icon: Users,        roles: ALL },
            { label: 'Companies', href: '/companies',  icon: Building2,    roles: ALL },
            { label: 'Web Forms', href: '/lead-forms', icon: FileInput,    roles: MGMT },
        ],
    },
    {
        title: 'Workspace',
        items: [
            { label: 'Tasks',    href: '/tasks',    icon: ListChecks, roles: ALL },
            { label: 'API Docs', href: '/api-docs', icon: Code2,      roles: ALL },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Users',    href: '/users',    icon: UserCog,     roles: ADMIN },
            { label: 'Roles',    href: '/roles',    icon: ShieldCheck, roles: ADMIN },
            { label: 'Settings', href: '/settings', icon: Settings,    roles: ADMIN },
            { label: 'Trash',    href: '/trash',    icon: Trash2,      roles: ADMIN },
        ],
    },
];

export default function Sidebar({ collapsed, onCollapse, userRoles = [], mobile = false }) {
    const { url, props } = usePage();
    const { auth, settings } = props;
    const appTitle = settings?.app_title || 'Mini CRM';

    const visibleSections = sections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.roles.some((r) => userRoles.includes(r))) }))
        .filter((s) => s.items.length);

    const isActive = (href) => url === href || url.startsWith(href + '/') || url.startsWith(href + '?');

    const initials = (auth?.user?.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const role = (userRoles[0] || '').replace('_', ' ');

    return (
        <aside
            className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-[width] duration-200
                ${collapsed ? 'w-16' : 'w-64'}`}
        >
            {/* Brand + collapse toggle */}
            <div className={`flex items-center h-16 px-3 border-b border-sidebar-border shrink-0 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                        {settings?.logo ? (
                            <img src={`/storage/${settings.logo}`} alt={appTitle} className="h-8 w-auto max-w-[140px] object-contain" />
                        ) : (
                            <>
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <span className="font-semibold text-foreground truncate">{appTitle}</span>
                            </>
                        )}
                    </Link>
                )}
                <button
                    onClick={() => onCollapse(!collapsed)}
                    className={`${collapsed ? '' : 'ml-auto'} p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition`}
                    aria-label={mobile ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {mobile ? <X className="w-4 h-4" /> : collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
                {visibleSections.map((section) => (
                    <div key={section.title}>
                        {!collapsed && (
                            <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                {section.title}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(({ label, href, icon: Icon }) => {
                                const active = isActive(href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        title={collapsed ? label : undefined}
                                        className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition
                                            ${collapsed ? 'justify-center' : ''}
                                            ${active
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'}`}
                                    >
                                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary" />}
                                        <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                        {!collapsed && <span className="truncate">{label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User card */}
            <div className="border-t border-sidebar-border p-3 shrink-0">
                <Link
                    href="/profile"
                    className={`flex items-center gap-3 rounded-lg p-1.5 hover:bg-sidebar-accent transition ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? auth?.user?.name : undefined}
                >
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {initials}
                    </span>
                    {!collapsed && (
                        <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{auth?.user?.name}</span>
                            <span className="block text-xs text-muted-foreground capitalize truncate">{role}</span>
                        </span>
                    )}
                </Link>
            </div>
        </aside>
    );
}

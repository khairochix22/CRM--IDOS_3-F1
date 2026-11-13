/**
 * Dashboard
 *
 * Home page for every role. Shows:
 *   • Welcome banner with illustration and quick actions
 *   • Six KPI stat cards (contacts, leads, deals, tasks, follow-ups, closing soon)
 *   • Pipeline snapshot by stage (count + value bars)
 *   • The current user's upcoming tasks
 *   • Recent activity across the CRM
 * Data is passed as props from DashboardController.
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

import { Head, Link, usePage } from '@inertiajs/react';
import {
    Users, Target, KanbanSquare, ListChecks, CalendarClock, Clock, Plus,
    ArrowUpRight, BarChart3, Activity as ActivityIcon, CheckCircle2, Circle, CircleDot,
} from 'lucide-react';
import AppLayout from '../Components/Layout/AppLayout';
import EmptyState from '../Components/UI/EmptyState';

const money = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function StatCard({ label, value, icon: Icon, tint, href, hint }) {
    return (
        <Link
            href={href}
            className="group bg-card border border-border rounded-xl p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all"
        >
            <div className="flex items-start justify-between">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
                    <Icon className="w-5 h-5" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{value ?? 0}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
            {hint && <div className="mt-2 text-xs text-muted-foreground/80">{hint}</div>}
        </Link>
    );
}

function Card({ title, icon: Icon, action, children, className = '' }) {
    return (
        <section className={`bg-card border border-border rounded-xl ${className}`}>
            <header className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {Icon && <Icon className="w-4 h-4 text-primary" />}
                    {title}
                </h2>
                {action}
            </header>
            {children}
        </section>
    );
}

export default function Dashboard({ stats, pipeline = [], recentActivity = [], myTasks = [] }) {
    const { auth } = usePage().props;
    const firstName = (auth?.user?.name || '').split(' ')[0];
    const maxCount = Math.max(1, ...pipeline.map((p) => p.count));

    const cards = [
        { label: 'Total contacts',    value: stats.contacts,          icon: Users,         href: '/contacts',          tint: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
        { label: 'Active leads',      value: stats.leads,             icon: Target,        href: '/leads',             tint: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
        { label: 'Open deals',        value: stats.deals,             icon: KanbanSquare,  href: '/deals',             tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
        { label: 'Open tasks',        value: stats.tasks,             icon: ListChecks,    href: '/tasks',             tint: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
        { label: 'Follow-ups due',    value: stats.follow_up_due,     icon: CalendarClock, href: '/leads?sort=follow_up_date&dir=asc', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
        { label: 'Closing this week', value: stats.closing_this_week, icon: Clock,         href: '/deals',             tint: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6">
                {/* Welcome banner */}
                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white px-5 py-6 sm:px-8 sm:py-7">
                    <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center justify-between gap-6">
                        <div className="min-w-0">
                            <p className="text-indigo-200 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{greeting()}, {firstName || 'there'} 👋</h1>
                            <p className="mt-1.5 text-sm text-indigo-100 max-w-md">
                                You have <strong className="text-white">{stats.tasks}</strong> open tasks and <strong className="text-white">{stats.follow_up_due}</strong> follow-ups due. Here’s your overview.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link href="/leads" className="inline-flex items-center gap-1.5 rounded-lg bg-white text-indigo-700 px-3.5 py-2 text-sm font-medium shadow-sm hover:bg-indigo-50 transition">
                                    <Plus className="w-4 h-4" /> New lead
                                </Link>
                                <Link href="/deals" className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 ring-1 ring-white/25 px-3.5 py-2 text-sm font-medium hover:bg-white/25 transition">
                                    <KanbanSquare className="w-4 h-4" /> Open pipeline
                                </Link>
                            </div>
                        </div>
                        <img src="/images/welcome.svg" alt="" aria-hidden="true" className="hidden md:block w-56 lg:w-64 shrink-0 select-none" draggable="false" />
                    </div>
                </section>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
                    {cards.map((card) => <StatCard key={card.label} {...card} />)}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Pipeline snapshot */}
                    <Card
                        title="Pipeline by stage"
                        icon={BarChart3}
                        className="lg:col-span-2"
                        action={<Link href="/reports" className="text-xs font-medium text-primary hover:underline">View reports</Link>}
                    >
                        <div className="p-5 space-y-4">
                            {pipeline.map((p) => (
                                <div key={p.stage}>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="flex items-center gap-2 text-foreground font-medium">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                            {p.label}
                                        </span>
                                        <span className="text-muted-foreground tabular-nums">
                                            {p.count} deal{p.count === 1 ? '' : 's'} · <span className="text-foreground font-medium">{money(p.total)}</span>
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(p.count / maxCount) * 100}%`, backgroundColor: p.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* My tasks */}
                    <Card
                        title="My upcoming tasks"
                        icon={ListChecks}
                        action={<Link href="/tasks" className="text-xs font-medium text-primary hover:underline">All tasks</Link>}
                    >
                        {myTasks.length === 0 ? (
                            <EmptyState compact title="You’re all caught up" description="No open tasks assigned to you." />
                        ) : (
                            <ul className="divide-y divide-border">
                                {myTasks.map((t) => (
                                    <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                                        {t.status === 'in_progress'
                                            ? <CircleDot className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                            : <Circle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-foreground truncate">{t.title}</p>
                                            {t.due_date && (
                                                <p className={`text-xs mt-0.5 ${t.overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                                    {t.overdue ? 'Overdue · ' : 'Due '}{new Date(t.due_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Recent activity */}
                <Card
                    title="Recent activity"
                    icon={ActivityIcon}
                    action={<Link href="/activities" className="text-xs font-medium text-primary hover:underline">View all</Link>}
                >
                    {recentActivity.length === 0 ? (
                        <EmptyState compact title="No activity yet" description="Actions like creating leads or moving deals will show up here." />
                    ) : (
                        <ul className="divide-y divide-border">
                            {recentActivity.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </span>
                                    <p className="text-sm text-foreground min-w-0 flex-1">
                                        <span className="font-medium">{a.user}</span>
                                        <span className="text-muted-foreground"> · {a.label.toLowerCase()} {a.entity_type.toLowerCase()} </span>
                                        {a.url
                                            ? <Link href={a.url} className="font-medium text-primary hover:underline break-words">{a.entity}</Link>
                                            : <span className="font-medium">{a.entity}</span>}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{a.time}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </>
    );
}

// Attach persistent layout so the sidebar/header don't re-mount on navigation
Dashboard.layout = (page) => <AppLayout>{page}</AppLayout>;

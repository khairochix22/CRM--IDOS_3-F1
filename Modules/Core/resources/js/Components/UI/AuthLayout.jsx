/**
 * AuthLayout
 *
 * Split-screen shell for guest pages (login, register, password reset, 2FA).
 * Left: indigo brand panel with the hero illustration (/images/auth-hero.svg)
 * and feature highlights — hidden on small screens.
 * Right: the page's form card, with an icon, title and subtitle.
 *
 * Usage:
 *   <AuthLayout title="Welcome back" subtitle="Sign in to continue" icon={LogIn}>…form…</AuthLayout>
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

import { usePage } from '@inertiajs/react';
import { Sparkles, Target, KanbanSquare, BellRing } from 'lucide-react';

const highlights = [
    { icon: Target,       text: 'Capture and qualify leads in one place' },
    { icon: KanbanSquare, text: 'Drag-and-drop deal pipeline' },
    { icon: BellRing,     text: 'Task reminders and team notifications' },
];

export default function AuthLayout({ title, subtitle, icon: Icon, children, footer }) {
    const { settings } = usePage().props;
    const appTitle = settings?.app_title || 'Mini CRM';

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Brand panel */}
            <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 xl:p-14 text-white">
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-violet-400/20 blur-3xl" />

                <div className="relative flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </span>
                    <span className="text-lg font-semibold">{appTitle}</span>
                </div>

                <div className="relative">
                    <img src="/images/auth-hero.svg" alt="" aria-hidden="true" className="w-full max-w-md mx-auto drop-shadow-2xl select-none" draggable="false" />
                    <h2 className="mt-8 text-3xl font-semibold leading-tight">Close more deals,<br />keep every customer happy.</h2>
                    <ul className="mt-6 space-y-3">
                        {highlights.map(({ icon: HIcon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-indigo-100">
                                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <HIcon className="w-4 h-4" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} {appTitle} · Open source by Xgenious</p>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className="w-full max-w-sm animate-fade-in">
                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <span className="text-lg font-semibold text-foreground">{appTitle}</span>
                    </div>

                    <div className="mb-6">
                        {Icon && (
                            <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5" />
                            </span>
                        )}
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>

                    {children}

                    {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
                </div>
            </div>
        </div>
    );
}

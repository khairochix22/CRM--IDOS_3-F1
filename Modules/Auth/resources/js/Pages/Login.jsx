/**
 * Login
 *
 * Single unified login page for Mini CRM.
 * Used by all roles (admin, manager, sales_user) — role-based redirect
 * happens server-side in LoginController after successful authentication.
 * Rendered inside the split-screen AuthLayout (hero illustration + form).
 *
 * On xgenious.com demo environments and on localhost a "Demo accounts" panel is
 * shown below the Sign in button so visitors can log in with one click.
 *
 * Module : Auth
 * Author : Xgenious (https://xgenious.com)
 */

import { useForm, Head, Link } from '@inertiajs/react';
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck, Briefcase, User } from 'lucide-react';
import AuthLayout from '@modules/Core/resources/js/Components/UI/AuthLayout';
import IconInput from '@modules/Core/resources/js/Components/UI/IconInput';

const DEMO_ACCOUNTS = [
    { role: 'Admin',   email: 'admin@minicrm.test',   password: 'password', icon: ShieldCheck },
    { role: 'Manager', email: 'manager@minicrm.test', password: 'password', icon: Briefcase },
    { role: 'Sales',   email: 'mike@minicrm.test',    password: 'password', icon: User },
    { role: 'Sales',   email: 'emma@minicrm.test',    password: 'password', icon: User },
];

/** Show demo accounts on the xgenious.com demo and on local development hosts. */
function showDemoAccounts() {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h.endsWith('xgenious.com') || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.test');
}

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Sign In" />
            <AuthLayout
                icon={LogIn}
                title="Welcome back"
                subtitle="Sign in to your account to continue."
                footer={<>Don’t have an account? <Link href="/register" className="font-medium text-primary hover:underline">Create one</Link></>}
            >
                <form onSubmit={submit} className="space-y-4">
                    <IconInput
                        id="email" label="Email address" icon={Mail} type="email" autoComplete="email"
                        value={data.email} onChange={(e) => setData('email', e.target.value)}
                        placeholder="you@example.com" error={errors.email} autoFocus
                    />

                    <IconInput
                        id="password" label="Password" icon={Lock} type="password" autoComplete="current-password"
                        value={data.password} onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••" error={errors.password}
                        labelAction={<Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}
                    />

                    <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-input accent-indigo-600"
                        />
                        Remember me
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="group w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Signing in…' : 'Sign in'}
                        {!processing && <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />}
                    </button>
                </form>

                {showDemoAccounts() && (
                    <div className="mt-6 rounded-xl border border-dashed border-border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Demo accounts — click to fill</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_ACCOUNTS.map(({ role, email, password, icon: Icon }) => (
                                <button
                                    key={email}
                                    type="button"
                                    onClick={() => { setData((d) => ({ ...d, email, password })); }}
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs border transition
                                        ${data.email === email ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                                >
                                    <Icon className="w-4 h-4 text-primary shrink-0" />
                                    <span className="min-w-0">
                                        <span className="block font-medium text-foreground">{role}</span>
                                        <span className="block text-muted-foreground truncate">{email.split('@')[0]}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </AuthLayout>
        </>
    );
}

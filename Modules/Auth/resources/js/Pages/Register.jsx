/**
 * Register
 *
 * Self-service registration page for Mini CRM.
 * Collects name, email and password (with confirmation) and posts to /register.
 * Rendered inside the split-screen AuthLayout.
 *
 * Module : Auth
 * Author : Xgenious (https://xgenious.com)
 */

import { useForm, Head, Link } from '@inertiajs/react';
import { UserPlus, User, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '@modules/Core/resources/js/Components/UI/AuthLayout';
import IconInput from '@modules/Core/resources/js/Components/UI/IconInput';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/register');
    }

    return (
        <>
            <Head title="Create Account" />
            <AuthLayout
                icon={UserPlus}
                title="Create your account"
                subtitle="Get started with your CRM — it’s free."
                footer={<>Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
            >
                <form onSubmit={submit} className="space-y-4">
                    <IconInput id="name" label="Full name" icon={User} autoComplete="name" placeholder="Juan Dela Cruz"
                        value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} autoFocus />
                    <IconInput id="email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com"
                        value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                    <IconInput id="password" label="Password" icon={Lock} type="password" autoComplete="new-password" placeholder="At least 8 characters"
                        value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} />
                    <IconInput id="password_confirmation" label="Confirm password" icon={Lock} type="password" autoComplete="new-password" placeholder="Repeat your password"
                        value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} error={errors.password_confirmation} />

                    <button
                        type="submit"
                        disabled={processing}
                        className="group w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        {processing ? 'Creating account…' : 'Create account'}
                        {!processing && <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />}
                    </button>
                </form>
            </AuthLayout>
        </>
    );
}

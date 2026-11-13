/**
 * ResetPassword
 *
 * "Set new password" page reached from the emailed reset link.
 * Submits token + email + new password to POST /reset-password.
 * Rendered inside the split-screen AuthLayout.
 *
 * Module : Auth
 * Author : Xgenious (https://xgenious.com)
 */

import { useForm, Head, Link } from '@inertiajs/react';
import { LockKeyhole, Mail, Lock } from 'lucide-react';
import AuthLayout from '@modules/Core/resources/js/Components/UI/AuthLayout';
import IconInput from '@modules/Core/resources/js/Components/UI/IconInput';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Set New Password" />
            <AuthLayout
                icon={LockKeyhole}
                title="Set a new password"
                subtitle="Choose a strong password for your account."
                footer={<Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}
            >
                <form onSubmit={submit} className="space-y-4">
                    <IconInput id="email" label="Email" icon={Mail} type="email" autoComplete="username"
                        value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                    <IconInput id="password" label="New password" icon={Lock} type="password" autoComplete="new-password" placeholder="At least 8 characters"
                        value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} autoFocus />
                    <IconInput id="password_confirmation" label="Confirm new password" icon={Lock} type="password" autoComplete="new-password" placeholder="Repeat your password"
                        value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} error={errors.password_confirmation} />

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow-sm shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {processing ? 'Resetting…' : 'Reset password'}
                    </button>
                </form>
            </AuthLayout>
        </>
    );
}

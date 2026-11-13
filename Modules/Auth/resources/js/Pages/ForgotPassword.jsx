/**
 * ForgotPassword
 *
 * Password reset request page. The user enters their email and receives a
 * reset link (POST /forgot-password). Shows the status message on success.
 * Rendered inside the split-screen AuthLayout.
 *
 * Module : Auth
 * Author : Xgenious (https://xgenious.com)
 */

import { useForm, Head, Link } from '@inertiajs/react';
import { KeyRound, Mail, Send, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@modules/Core/resources/js/Components/UI/AuthLayout';
import IconInput from '@modules/Core/resources/js/Components/UI/IconInput';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e) {
        e.preventDefault();
        post('/forgot-password');
    }

    return (
        <>
            <Head title="Forgot Password" />
            <AuthLayout
                icon={KeyRound}
                title="Forgot your password?"
                subtitle="Enter your email and we’ll send you a reset link."
                footer={<>Remember your password? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
            >
                {status && (
                    <div className="mb-4 flex items-start gap-2 px-3 py-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <IconInput id="email" label="Email address" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com"
                        value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} autoFocus />

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {processing ? 'Sending…' : 'Send reset link'}
                    </button>
                </form>
            </AuthLayout>
        </>
    );
}

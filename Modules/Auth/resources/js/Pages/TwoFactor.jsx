/**
 * TwoFactor
 *
 * 2FA challenge page shown after a correct password when the user has
 * two-factor authentication enabled. Accepts a 6-digit TOTP code or a
 * recovery code (toggle), posting to /two-factor/challenge.
 * Rendered inside the split-screen AuthLayout.
 *
 * Module : Auth
 * Author : Xgenious (https://xgenious.com)
 */

import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, LifeBuoy, Smartphone, ArrowLeft } from 'lucide-react';
import AuthLayout from '@modules/Core/resources/js/Components/UI/AuthLayout';

export default function TwoFactor() {
    const [useRecovery, setUseRecovery] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/two-factor/challenge');
    };

    return (
        <>
            <Head title="Two-Factor Authentication" />
            <AuthLayout
                icon={ShieldCheck}
                title="Two-factor authentication"
                subtitle={useRecovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}
                footer={<Link href="/login" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" /> Back to login</Link>}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">
                            {useRecovery ? 'Recovery code' : 'Authentication code'}
                        </label>
                        <input
                            id="code"
                            type="text"
                            inputMode={useRecovery ? 'text' : 'numeric'}
                            maxLength={useRecovery ? undefined : 6}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder={useRecovery ? 'XXXXXXXXXX' : '000000'}
                            autoFocus
                            autoComplete="one-time-code"
                            className="w-full px-3 py-3 bg-card border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition text-center tracking-[0.5em] text-xl font-mono"
                        />
                        {errors.code && <p className="mt-1 text-xs text-destructive">{errors.code}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.code}
                        className="w-full py-2.5 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        {processing ? 'Verifying…' : 'Verify'}
                    </button>
                </form>

                <button
                    onClick={() => { setUseRecovery(!useRecovery); setData('code', ''); }}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                    {useRecovery
                        ? <><Smartphone className="w-4 h-4" /> Use authenticator app instead</>
                        : <><LifeBuoy className="w-4 h-4" /> Lost access? Use a recovery code</>}
                </button>
            </AuthLayout>
        </>
    );
}

/**
 * PublicLeadForm
 *
 * Public (no login) Web-to-Lead form rendered at /f/{token}.
 * Website visitors enter their details; on submit the server creates a lead
 * in the CRM and this page switches to the thank-you state.
 * Contains a hidden "website" honeypot field to catch spam bots.
 *
 * Module : Lead
 * Author : Xgenious (https://xgenious.com)
 * License: MIT
 */

import { Head, useForm } from '@inertiajs/react';

export default function PublicLeadForm({ form, submitted = false, message }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        website: '', // honeypot — must stay empty
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/f/${form.token}`);
    };

    return (
        <>
            <Head title={form.title} />
            <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-sm">
                    {submitted ? (
                        <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 text-xl mb-4">✓</div>
                            <h1 className="text-lg font-semibold text-foreground">{message}</h1>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-foreground">{form.title}</h1>
                            {form.description && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{form.description}</p>
                            )}

                            <form onSubmit={submit} className="space-y-4 mt-6">
                                <Field label="Full name *" error={errors.name}>
                                    <input required value={data.name} onChange={(e) => setData('name', e.target.value)} className={inp()} autoComplete="name" />
                                </Field>
                                <Field label="Email *" error={errors.email}>
                                    <input required type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inp()} autoComplete="email" />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Phone" error={errors.phone}>
                                        <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className={inp()} autoComplete="tel" />
                                    </Field>
                                    <Field label="Company" error={errors.company}>
                                        <input value={data.company} onChange={(e) => setData('company', e.target.value)} className={inp()} autoComplete="organization" />
                                    </Field>
                                </div>
                                <Field label="Message" error={errors.message}>
                                    <textarea rows={4} value={data.message} onChange={(e) => setData('message', e.target.value)} className={inp()} />
                                </Field>

                                {/* Honeypot: hidden from humans, bots tend to fill it */}
                                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}>
                                    <label>Website<input tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => setData('website', e.target.value)} /></label>
                                </div>

                                <button type="submit" disabled={processing}
                                        className="w-full py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition">
                                    {processing ? 'Sending…' : 'Submit'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

function inp() {
    return 'w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
}

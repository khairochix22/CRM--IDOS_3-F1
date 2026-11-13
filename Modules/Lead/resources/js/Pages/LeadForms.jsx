/**
 * LeadForms
 *
 * Management page for Web-to-Lead forms (admin + manager).
 * Lists every form with its public link, submission count and status,
 * and lets the user create / edit / activate / delete forms.
 * Each form can be shared as a direct link or embedded via <iframe>.
 *
 * Module : Lead
 * Author : Xgenious (https://xgenious.com)
 * License: MIT
 */

import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@modules/Core/resources/js/Components/Layout/AppLayout';
import PageHeader from '@modules/Core/resources/js/Components/UI/PageHeader';
import EmptyState from '@modules/Core/resources/js/Components/UI/EmptyState';
import { FileInput, Plus } from 'lucide-react';

export default function LeadForms({ forms, sources, assignmentModes, users }) {
    const [editing, setEditing]   = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [embedFor, setEmbedFor] = useState(null);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit   = (f) => { setEditing(f);   setShowModal(true); };

    const toggleActive = (f) => {
        router.patch(`/lead-forms/${f.id}`, {
            ...pickEditable(f),
            is_active: !f.is_active,
        }, { preserveScroll: true });
    };

    const destroy = (f) => {
        if (!confirm(`Delete "${f.name}"? Leads it already captured will be kept.`)) return;
        router.delete(`/lead-forms/${f.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Web Forms" />

            <div className="space-y-4">
                <PageHeader
                    icon={FileInput}
                    title="Web Forms"
                    subtitle="Public forms that turn website visitors into leads automatically."
                    actions={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition"><Plus className="w-4 h-4" /> New Form</button>}
                />

                <div className="rounded-lg border border-border overflow-x-auto bg-card">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Form</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Source</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Assignment</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Submissions</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {forms.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            title="No web forms yet"
                                            description="Create a form, share the link or embed it on your website, and every submission becomes a lead."
                                            action={<button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition"><Plus className="w-4 h-4" /> Create your first form</button>}
                                        />
                                    </td>
                                </tr>
                            ) : forms.map((f) => (
                                <tr key={f.id} className="hover:bg-sidebar-accent/30 transition">
                                    <td className="px-4 py-2.5">
                                        <div className="font-medium text-foreground">{f.name}</div>
                                        <a href={f.public_url} target="_blank" rel="noreferrer"
                                           className="text-xs text-primary hover:underline break-all">
                                            {f.public_url}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{f.source}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell text-xs">
                                        {f.assignment_mode === 'user'
                                            ? `→ ${f.assigned_user?.name ?? '—'}`
                                            : assignmentModes[f.assignment_mode]}
                                    </td>
                                    <td className="px-4 py-2.5 text-foreground">
                                        <a href={`/leads?form=${f.id}`} className="hover:underline" title="Leads captured by this form">
                                            {f.submissions_count}
                                            <span className="text-xs text-muted-foreground"> ({f.leads_count} leads)</span>
                                        </a>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            onClick={() => toggleActive(f)}
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                f.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                                            }`}
                                            title="Click to toggle"
                                        >
                                            {f.is_active ? 'Active' : 'Paused'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-3 justify-end text-xs whitespace-nowrap">
                                            <button onClick={() => setEmbedFor(f)} className="text-primary hover:underline">Share</button>
                                            <button onClick={() => openEdit(f)} className="text-foreground hover:underline">Edit</button>
                                            <button onClick={() => destroy(f)} className="text-destructive hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <FormModal
                    form={editing}
                    sources={sources}
                    assignmentModes={assignmentModes}
                    users={users}
                    onClose={() => setShowModal(false)}
                />
            )}

            {embedFor && <ShareModal form={embedFor} onClose={() => setEmbedFor(null)} />}
        </>
    );
}

LeadForms.layout = (page) => <AppLayout>{page}</AppLayout>;

/** Fields the PATCH endpoint expects (used for quick toggle). */
function pickEditable(f) {
    return {
        name: f.name,
        title: f.title,
        description: f.description ?? '',
        source: f.source,
        assignment_mode: f.assignment_mode,
        assigned_user_id: f.assigned_user_id ?? '',
        success_message: f.success_message ?? '',
        redirect_url: f.redirect_url ?? '',
        is_active: f.is_active,
    };
}

/* ── Create / Edit modal ── */
function FormModal({ form, sources, assignmentModes, users, onClose }) {
    const isEdit = !!form;
    const { data, setData, post, patch, processing, errors } = useForm(
        form ? pickEditable(form) : {
            name: '',
            title: 'Get in touch',
            description: '',
            source: 'Website',
            assignment_mode: 'none',
            assigned_user_id: '',
            success_message: '',
            redirect_url: '',
            is_active: true,
        }
    );

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        isEdit ? patch(`/lead-forms/${form.id}`, opts) : post('/lead-forms', opts);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">{isEdit ? 'Edit Web Form' : 'New Web Form'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <Field label="Internal name" error={errors.name} hint="Only your team sees this.">
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                               placeholder="e.g. Homepage contact form" className={inp()} />
                    </Field>

                    <Field label="Form heading (public)" error={errors.title}>
                        <input value={data.title} onChange={(e) => setData('title', e.target.value)} className={inp()} />
                    </Field>

                    <Field label="Description (public)" error={errors.description}>
                        <textarea rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} className={inp()} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Lead source" error={errors.source}>
                            <select value={data.source} onChange={(e) => setData('source', e.target.value)} className={inp()}>
                                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Assignment" error={errors.assignment_mode}>
                            <select value={data.assignment_mode} onChange={(e) => setData('assignment_mode', e.target.value)} className={inp()}>
                                {Object.entries(assignmentModes).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Field>
                    </div>

                    {data.assignment_mode !== 'none' && (
                        <Field
                            label={data.assignment_mode === 'user' ? 'Assign to' : 'Fallback user (if no sales users exist)'}
                            error={errors.assigned_user_id}
                        >
                            <select value={data.assigned_user_id} onChange={(e) => setData('assigned_user_id', e.target.value)} className={inp()}>
                                <option value="">— Select user —</option>
                                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </Field>
                    )}

                    <Field label="Thank-you message" error={errors.success_message}>
                        <input value={data.success_message} onChange={(e) => setData('success_message', e.target.value)}
                               placeholder="Thank you! We will get back to you shortly." className={inp()} />
                    </Field>

                    <Field label="Redirect URL after submit (optional)" error={errors.redirect_url}
                           hint="If set, visitors go here instead of the thank-you page.">
                        <input value={data.redirect_url} onChange={(e) => setData('redirect_url', e.target.value)}
                               placeholder="https://yourwebsite.com/thank-you" className={inp()} />
                    </Field>

                    <label className="flex items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        Active (accepting submissions)
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-sidebar-accent transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition">
                            {isEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Share / embed modal ── */
function ShareModal({ form, onClose }) {
    const [copied, setCopied] = useState('');
    const embed = `<iframe src="${form.public_url}" width="100%" height="640" style="border:0" title="${form.title}"></iframe>`;

    const copy = (text, key) => {
        navigator.clipboard?.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Share “{form.name}”</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <CopyBox label="Direct link" value={form.public_url} copied={copied === 'link'} onCopy={() => copy(form.public_url, 'link')} />
                    <CopyBox label="Embed code (paste into your website HTML)" value={embed} copied={copied === 'embed'} onCopy={() => copy(embed, 'embed')} multiline />
                    {!form.is_active && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                            This form is paused — visitors will see “Not Found” until you activate it.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CopyBox({ label, value, copied, onCopy, multiline }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <button onClick={onCopy} className="text-xs text-primary hover:underline">{copied ? 'Copied ✓' : 'Copy'}</button>
            </div>
            {multiline
                ? <textarea readOnly rows={3} value={value} className={inp() + ' font-mono text-xs'} />
                : <input readOnly value={value} className={inp() + ' font-mono text-xs'} />}
        </div>
    );
}

/* ── helpers ── */
function Field({ label, error, hint, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            {children}
            {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

function inp() {
    return 'w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition';
}

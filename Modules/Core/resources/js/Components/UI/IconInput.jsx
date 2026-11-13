/**
 * IconInput
 *
 * Labelled text input with a leading lucide icon and inline error message.
 * Password inputs get a show/hide toggle automatically.
 * Used by the guest (auth) pages and any form that wants the richer style.
 *
 * Usage:
 *   <IconInput id="email" label="Email" icon={Mail} type="email" value={…} onChange={…} error={errors.email} />
 *
 * Module : Core
 * Author : Xgenious (https://xgenious.com)
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function IconInput({ id, label, icon: Icon, type = 'text', error, hint, labelAction, ...props }) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <div>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
                    {labelAction}
                </div>
            )}
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />}
                <input
                    id={id}
                    type={isPassword && show ? 'text' : type}
                    className={`w-full ${Icon ? 'pl-9' : 'pl-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2.5 text-sm bg-card border rounded-lg outline-none transition
                        focus:ring-2 focus:ring-ring/40 focus:border-primary
                        ${error ? 'border-destructive' : 'border-input'}`}
                    aria-invalid={!!error}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                        aria-label={show ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                    >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

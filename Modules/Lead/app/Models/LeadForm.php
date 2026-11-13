<?php

/**
 * LeadForm Model
 *
 * A public, shareable web form that converts visitor submissions into Leads
 * (Web-to-Lead). Each form has a random token used in its public URL /f/{token}.
 *
 * Table     : lead_forms
 * Relations : leads (HasMany Lead), assignedUser (BelongsTo User),
 *             lastAssignedUser (BelongsTo User), createdBy (BelongsTo User)
 * Fillable  : name, title, description, source, assignment_mode, assigned_user_id,
 *             success_message, redirect_url, is_active, created_by
 * Assignment: none | user (always the same user) | round_robin (rotate sales users)
 * Module    : Lead
 * Author    : Xgenious (https://xgenious.com)
 * License   : MIT
 */

namespace Modules\Lead\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class LeadForm extends Model
{
    protected $fillable = [
        'name',
        'title',
        'description',
        'source',
        'assignment_mode',
        'assigned_user_id',
        'success_message',
        'redirect_url',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'submissions_count' => 'integer',
    ];

    /** Allowed assignment modes. */
    public static array $assignmentModes = [
        'none'        => 'Leave unassigned',
        'user'        => 'Always assign to one user',
        'round_robin' => 'Round-robin across sales users',
    ];

    /** Generate a unique public token when a form is created. */
    protected static function booted(): void
    {
        static::creating(function (LeadForm $form) {
            $form->token ??= Str::lower(Str::random(24));
        });
    }

    /** Leads captured by this form. */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /** Fixed assignee (used when assignment_mode = user). */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /** Most recent round-robin assignee (cursor for the rotation). */
    public function lastAssignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_assigned_user_id');
    }

    /** The user who created the form. */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Full public URL for sharing. */
    public function publicUrl(): string
    {
        return url("/f/{$this->token}");
    }
}

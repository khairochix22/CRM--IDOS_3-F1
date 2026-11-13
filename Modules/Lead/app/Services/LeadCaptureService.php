<?php

/**
 * LeadCaptureService
 *
 * Turns a public web-form submission into a CRM Lead (Web-to-Lead).
 *
 * Flow:
 *   1. If an active lead with the same email already exists → do NOT create a
 *      duplicate; append the new message to that lead's notes and log a
 *      "form_submitted" activity instead.
 *   2. Otherwise create a new lead (status "new", source from the form).
 *   3. Pick an assignee based on the form's assignment_mode
 *      (none | user | round_robin) and notify them (bell + email).
 *   4. Increment the form's submissions counter.
 *
 * Module  : Lead
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

namespace Modules\Lead\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Modules\Activity\Services\ActivityService;
use Modules\Lead\Models\Lead;
use Modules\Lead\Models\LeadForm;
use Modules\Notification\Notifications\LeadAssigned;

class LeadCaptureService
{
    /**
     * Capture a submission. Returns the created or updated Lead.
     *
     * @param  array{name:string,email:string,phone?:?string,company?:?string,message?:?string}  $data
     */
    public static function capture(LeadForm $form, array $data): Lead
    {
        $notes = self::buildNotes($form, $data);

        $existing = Lead::where('email', $data['email'])
            ->whereNotIn('status', ['converted', 'lost'])
            ->first();

        if ($existing) {
            $existing->update([
                'notes' => trim(($existing->notes ? $existing->notes . "\n\n" : '') . $notes),
            ]);

            ActivityService::log('form_submitted', 'Lead', $existing->id, $existing->name,
                "Submitted \"{$form->name}\" again");

            $form->increment('submissions_count');

            return $existing;
        }

        $lead = DB::transaction(function () use ($form, $data, $notes) {
            $assigneeId = self::pickAssignee($form);

            $lead = Lead::create([
                'name'             => $data['name'],
                'email'            => $data['email'],
                'phone'            => $data['phone'] ?? null,
                'source'           => $form->source,
                'lead_form_id'     => $form->id,
                'assigned_user_id' => $assigneeId,
                'status'           => 'new',
                'notes'            => $notes,
                'created_by'       => null, // created by a website visitor, not a CRM user
            ]);

            $form->increment('submissions_count');

            return $lead;
        });

        ActivityService::log('created', 'Lead', $lead->id, $lead->name, "Captured via web form \"{$form->name}\"");

        if ($lead->assigned_user_id) {
            $lead->load('assignedUser');
            $lead->assignedUser?->notify(new LeadAssigned($lead));
        }

        return $lead;
    }

    /**
     * Resolve the user to assign a new lead to, according to the form settings.
     * Round-robin rotates through active sales users ordered by id, and
     * remembers the last pick on the form (last_assigned_user_id).
     */
    public static function pickAssignee(LeadForm $form): ?int
    {
        if ($form->assignment_mode === 'user') {
            return $form->assigned_user_id;
        }

        if ($form->assignment_mode !== 'round_robin') {
            return null;
        }

        $ids = User::role('sales_user')
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('id');

        if ($ids->isEmpty()) {
            return $form->assigned_user_id; // fallback when no sales users exist
        }

        $next = $ids->first(fn ($id) => $id > (int) $form->last_assigned_user_id) ?? $ids->first();

        $form->forceFill(['last_assigned_user_id' => $next])->save();

        return $next;
    }

    /** Build the note text stored on the lead from the optional fields. */
    private static function buildNotes(LeadForm $form, array $data): string
    {
        $lines = ['[Web form: ' . $form->name . ' — ' . now()->format('Y-m-d H:i') . ']'];

        if (!empty($data['company'])) {
            $lines[] = 'Company: ' . $data['company'];
        }
        if (!empty($data['message'])) {
            $lines[] = 'Message: ' . $data['message'];
        }

        return implode("\n", $lines);
    }
}

<?php

/**
 * LeadFormController
 *
 * Admin/manager management of Web-to-Lead forms.
 * A lead form produces a public URL (/f/{token}) and an <iframe> embed code
 * that can be placed on any website. Submissions become leads automatically
 * (see PublicLeadFormController + LeadCaptureService).
 *
 * Module  : Lead
 * Package : Modules\Lead\Http\Controllers
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

namespace Modules\Lead\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Lead\Models\Lead;
use Modules\Lead\Models\LeadForm;

class LeadFormController extends Controller
{
    /**
     * List all web forms with their public URL, submission count and settings.
     */
    public function index(): Response
    {
        $forms = LeadForm::with('assignedUser:id,name')
            ->withCount('leads')
            ->latest()
            ->get()
            ->map(fn (LeadForm $f) => array_merge($f->toArray(), [
                'public_url' => $f->publicUrl(),
            ]));

        return Inertia::render('Lead/LeadForms', [
            'forms'           => $forms,
            'sources'         => Lead::$sources,
            'assignmentModes' => LeadForm::$assignmentModes,
            'users'           => User::role(['admin', 'manager', 'sales_user'])
                ->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Create a new web form. A unique public token is generated automatically.
     */
    public function store(Request $request): RedirectResponse
    {
        LeadForm::create(array_merge($this->validated($request), ['created_by' => Auth::id()]));

        return back()->with('success', 'Web form created.');
    }

    /**
     * Update an existing form's settings (the public token never changes).
     */
    public function update(Request $request, LeadForm $leadForm): RedirectResponse
    {
        $leadForm->update($this->validated($request));

        return back()->with('success', 'Web form updated.');
    }

    /**
     * Delete a form. Leads it already captured are kept (lead_form_id → null).
     */
    public function destroy(LeadForm $leadForm): RedirectResponse
    {
        $leadForm->delete();

        return back()->with('success', 'Web form deleted. Captured leads were kept.');
    }

    /** Shared validation for store/update. */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name'             => 'required|string|max:191',
            'title'            => 'required|string|max:191',
            'description'      => 'nullable|string|max:1000',
            'source'           => ['required', Rule::in(Lead::$sources)],
            'assignment_mode'  => ['required', Rule::in(array_keys(LeadForm::$assignmentModes))],
            'assigned_user_id' => 'nullable|required_if:assignment_mode,user|exists:users,id',
            'success_message'  => 'nullable|string|max:255',
            'redirect_url'     => 'nullable|url|max:255',
            'is_active'        => 'boolean',
        ]);

        if ($data['assignment_mode'] === 'none') {
            $data['assigned_user_id'] = null;
        }

        return $data;
    }
}

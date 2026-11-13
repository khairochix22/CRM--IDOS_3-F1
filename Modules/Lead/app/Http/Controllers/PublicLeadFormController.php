<?php

/**
 * PublicLeadFormController
 *
 * Public (no login) endpoints for Web-to-Lead forms.
 * Website visitors open /f/{token}, fill in their details, and a lead is
 * created in the CRM via LeadCaptureService.
 *
 * Spam protection:
 *   - throttle:10,1 on the submit route (10 submissions/min per IP)
 *   - hidden "website" honeypot field — bots that fill it get a fake success
 *
 * Module  : Lead
 * Package : Modules\Lead\Http\Controllers
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

namespace Modules\Lead\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Lead\Models\LeadForm;
use Modules\Lead\Services\LeadCaptureService;

class PublicLeadFormController extends Controller
{
    /**
     * Render the public form. Inactive or unknown tokens return 404.
     */
    public function show(string $token): Response
    {
        $form = $this->findActive($token);

        return Inertia::render('Lead/PublicLeadForm', [
            'form' => $form->only(['token', 'title', 'description']),
        ]);
    }

    /**
     * Accept a submission, create (or update) the lead, then redirect to the
     * thank-you page or the form's custom redirect URL.
     */
    public function submit(Request $request, string $token)
    {
        $form = $this->findActive($token);

        // Honeypot: real visitors never see or fill this field.
        if ($request->filled('website')) {
            return redirect()->route('lead-forms.public.thanks', $form->token);
        }

        $data = $request->validate([
            'name'    => 'required|string|max:191',
            'email'   => 'required|email|max:191',
            'phone'   => 'nullable|string|max:50',
            'company' => 'nullable|string|max:191',
            'message' => 'nullable|string|max:2000',
        ]);

        LeadCaptureService::capture($form, $data);

        if ($form->redirect_url) {
            return Inertia::location($form->redirect_url);
        }

        return redirect()->route('lead-forms.public.thanks', $form->token);
    }

    /**
     * Thank-you page shown after a successful submission.
     */
    public function thanks(string $token): Response
    {
        $form = $this->findActive($token);

        return Inertia::render('Lead/PublicLeadForm', [
            'form'      => $form->only(['token', 'title', 'description']),
            'submitted' => true,
            'message'   => $form->success_message ?: 'Thank you! We will get back to you shortly.',
        ]);
    }

    /** Resolve an active form by token or abort with 404. */
    private function findActive(string $token): LeadForm
    {
        return LeadForm::where('token', $token)->where('is_active', true)->firstOrFail();
    }
}

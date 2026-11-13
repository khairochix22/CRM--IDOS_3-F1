<?php

/**
 * LeadFormTest
 *
 * Feature tests for Web-to-Lead forms (Phase 20).
 * Covers: form management access, public submission → lead, duplicate
 * merge, round-robin assignment, honeypot, inactive forms.
 *
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Lead\Models\Lead;
use Modules\Lead\Models\LeadForm;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LeadFormTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'manager', 'sales_user'] as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    private function makeForm(array $attrs = []): LeadForm
    {
        return LeadForm::create(array_merge([
            'name'            => 'Homepage form',
            'title'           => 'Contact us',
            'source'          => 'Website',
            'assignment_mode' => 'none',
            'is_active'       => true,
        ], $attrs));
    }

    /** Admin can create a form and it gets a public token. */
    public function test_admin_can_create_form(): void
    {
        $this->actingAs($this->admin)->post('/lead-forms', [
            'name'            => 'Landing page',
            'title'           => 'Request a demo',
            'source'          => 'Advertisement',
            'assignment_mode' => 'none',
            'is_active'       => true,
        ])->assertRedirect();

        $form = LeadForm::firstOrFail();
        $this->assertSame('Advertisement', $form->source);
        $this->assertNotEmpty($form->token);
        $this->actingAs($this->admin)->get('/lead-forms')->assertOk();
    }

    /** Sales users cannot manage forms. */
    public function test_sales_user_cannot_manage_forms(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales_user');

        $this->actingAs($sales)->get('/lead-forms')->assertRedirect(route('dashboard'));
    }

    /** A public submission creates a lead linked to the form. */
    public function test_public_submission_creates_lead(): void
    {
        $form = $this->makeForm();

        $this->get("/f/{$form->token}")->assertOk();

        $this->post("/f/{$form->token}", [
            'name'    => 'Juan Dela Cruz',
            'email'   => 'juan@example.com',
            'company' => 'Acme PH',
            'message' => 'Need a quote',
        ])->assertRedirect("/f/{$form->token}/thanks");

        $lead = Lead::where('email', 'juan@example.com')->firstOrFail();
        $this->assertSame('new', $lead->status);
        $this->assertSame('Website', $lead->source);
        $this->assertSame($form->id, $lead->lead_form_id);
        $this->assertStringContainsString('Need a quote', $lead->notes);
        $this->assertSame(1, $form->fresh()->submissions_count);
    }

    /** Re-submitting with the same email updates the existing lead instead of duplicating. */
    public function test_duplicate_email_is_merged(): void
    {
        $form = $this->makeForm();
        $payload = ['name' => 'Ana', 'email' => 'ana@example.com', 'message' => 'First'];

        $this->post("/f/{$form->token}", $payload);
        $this->post("/f/{$form->token}", array_merge($payload, ['message' => 'Second']));

        $this->assertSame(1, Lead::where('email', 'ana@example.com')->count());
        $this->assertStringContainsString('Second', Lead::first()->notes);
        $this->assertSame(2, $form->fresh()->submissions_count);
    }

    /** Round-robin rotates between active sales users. */
    public function test_round_robin_assignment(): void
    {
        $a = User::factory()->create(); $a->assignRole('sales_user');
        $b = User::factory()->create(); $b->assignRole('sales_user');
        $form = $this->makeForm(['assignment_mode' => 'round_robin']);

        foreach (['l1', 'l2', 'l3'] as $n) {
            $this->post("/f/{$form->token}", ['name' => $n, 'email' => "{$n}@example.com"]);
        }

        $this->assertSame(
            [$a->id, $b->id, $a->id],
            Lead::orderBy('id')->pluck('assigned_user_id')->all()
        );
    }

    /** Honeypot submissions are silently discarded. */
    public function test_honeypot_blocks_bots(): void
    {
        $form = $this->makeForm();

        $this->post("/f/{$form->token}", [
            'name' => 'Bot', 'email' => 'bot@example.com', 'website' => 'http://spam.test',
        ])->assertRedirect("/f/{$form->token}/thanks");

        $this->assertSame(0, Lead::count());
    }

    /** Paused forms return 404. */
    public function test_inactive_form_is_not_found(): void
    {
        $form = $this->makeForm(['is_active' => false]);

        $this->get("/f/{$form->token}")->assertNotFound();
        $this->post("/f/{$form->token}", ['name' => 'X', 'email' => 'x@example.com'])->assertNotFound();
    }
}

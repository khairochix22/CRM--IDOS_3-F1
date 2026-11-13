<?php

/**
 * Create lead_forms table + link leads to the form that captured them.
 *
 * Part of the Web-to-Lead Forms feature (Phase 20).
 * A lead form is a public, shareable form (/f/{token}) that turns
 * website visitor submissions into CRM leads automatically.
 *
 * Module : Lead
 * Author : Xgenious (https://xgenious.com)
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_forms', function (Blueprint $table) {
            $table->id();
            $table->string('name');                                   // internal name, e.g. "Website Contact Form"
            $table->string('token', 40)->unique();                    // public URL key: /f/{token}
            $table->string('title');                                  // heading shown to visitors
            $table->text('description')->nullable();                  // sub-heading shown to visitors
            $table->string('source')->default('Website');             // Lead::$sources value applied to new leads
            $table->string('assignment_mode')->default('none');       // none | user | round_robin
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('last_assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('success_message')->nullable();
            $table->string('redirect_url')->nullable();               // optional redirect after submit
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('submissions_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('lead_form_id')->nullable()->after('source')
                ->constrained('lead_forms')->nullOnDelete();

            // Leads captured from a public form have no CRM user as creator.
            $table->unsignedBigInteger('created_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_form_id');
        });
        // Note: leads.created_by is left nullable on rollback, because web-form
        // leads with a NULL creator may exist.

        Schema::dropIfExists('lead_forms');
    }
};

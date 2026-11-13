<?php

/**
 * DashboardController
 *
 * Renders the admin/manager/sales dashboard home page.
 * Passes real summary statistics (contacts, leads, deals, tasks) to the Inertia view.
 *
 * Module  : Core
 * Package : Modules\Core\Http\Controllers
 * Author  : Xgenious (https://xgenious.com)
 * License : MIT
 */

namespace Modules\Core\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Activity\Models\Activity;
use Modules\Contact\Models\Contact;
use Modules\Deal\Models\Deal;
use Modules\Lead\Models\Lead;
use Modules\Task\Models\Task;

class DashboardController extends Controller
{
    /**
     * Render the main dashboard with live summary stat cards.
     */
    public function index(Request $request): Response
    {
        $stats = [
            'contacts'           => Contact::count(),
            'leads'              => Lead::whereNotIn('status', ['converted', 'lost'])->count(),
            'deals'              => Deal::whereNotIn('stage', ['won', 'lost'])->count(),
            'tasks'              => Task::whereIn('status', ['pending', 'in_progress'])->count(),
            'follow_up_due'      => Lead::whereNotIn('status', ['converted', 'lost'])
                                        ->whereNotNull('follow_up_date')
                                        ->whereDate('follow_up_date', '<=', now()->toDateString())
                                        ->count(),
            'closing_this_week'  => Deal::whereNotIn('stage', ['won', 'lost'])
                                        ->whereNotNull('expected_closing_date')
                                        ->whereDate('expected_closing_date', '>=', now()->toDateString())
                                        ->whereDate('expected_closing_date', '<=', now()->addDays(7)->toDateString())
                                        ->count(),
        ];

        // Pipeline snapshot: deal count + total value per stage
        $byStage = Deal::selectRaw('stage, COUNT(*) as count, COALESCE(SUM(value), 0) as total')
            ->groupBy('stage')->get()->keyBy('stage');

        $pipeline = collect(Deal::$stages)->map(fn ($meta, $key) => [
            'stage' => $key,
            'label' => $meta['label'],
            'color' => $meta['color'],
            'count' => (int) ($byStage[$key]->count ?? 0),
            'total' => (float) ($byStage[$key]->total ?? 0),
        ])->values();

        // Latest 6 activity entries for the "Recent activity" card
        $recentActivity = Activity::with('user:id,name')->latest()->limit(6)->get()
            ->map(fn (Activity $a) => [
                'id'          => $a->id,
                'action'      => $a->action,
                'label'       => $a->actionLabel(),
                'entity_type' => $a->entity_type,
                'entity'      => $a->entity_label,
                'url'         => $a->entityUrl(),
                'user'        => $a->user?->name ?? 'Web form',
                'time'        => $a->created_at->diffForHumans(),
            ]);

        // Current user's next 5 open tasks
        $myTasks = Task::where('assigned_user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderByRaw('due_date IS NULL, due_date')
            ->limit(5)
            ->get(['id', 'title', 'status', 'due_date'])
            ->map(fn (Task $t) => [
                'id'       => $t->id,
                'title'    => $t->title,
                'status'   => $t->status,
                'due_date' => $t->due_date?->toDateString(),
                'overdue'  => $t->due_date && $t->due_date->isPast() && ! $t->due_date->isToday(),
            ]);

        return Inertia::render('Core/Dashboard', [
            'stats'          => $stats,
            'pipeline'       => $pipeline,
            'recentActivity' => $recentActivity,
            'myTasks'        => $myTasks,
        ]);
    }
}

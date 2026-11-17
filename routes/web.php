<?php

use Illuminate\Support\Facades\Route;

// Redirect root to dashboard (or login if unauthenticated)
// (A redirect instead of a closure so `php artisan route:cache` works in production.)
Route::redirect('/', '/dashboard');

<?php

use App\Http\Controllers\ShareController;
use Illuminate\Support\Facades\Route;
use Spatie\Honeypot\ProtectAgainstSpam;

Route::get('/', [ShareController::class, 'index'])->name('home');
Route::post('/share', [ShareController::class, 'store'])
    ->name('share.store')
    ->middleware(ProtectAgainstSpam::class);
Route::get('/share/{share:hash}', [ShareController::class, 'show'])->name('share.show');

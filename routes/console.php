<?php

use App\Models\Share;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('info', function (): void {
    $count = Share::count();

    $this->comment("Total shares: {$count}");
});

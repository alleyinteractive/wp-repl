<?php

namespace App\Providers;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // When the VerifyCsrfToken middleware is used, modify it.
        // $this->app->resolving(VerifyCsrfToken::class, function (VerifyCsrfToken $middleware) {
        //     $middleware->addHttpCookie = false; // Disable the XSRF-TOKEN cookie.
        // });
    }
}

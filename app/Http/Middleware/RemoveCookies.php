<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RemoveCookies
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Remove all cookies from the response
        foreach ($response->headers->getCookies() as $cookie) {
            $response->headers->removeCookie($cookie->getName());
        }

        // Optionally, you can also clear the Set-Cookie header
        $response->headers->remove('Set-Cookie');

        // Send a Cache-Control header to ensure the response is cached.
        $response->headers->set('Cache-Control', 'public, max-age=604800');

        return $response;
    }
}

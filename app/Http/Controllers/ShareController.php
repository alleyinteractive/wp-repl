<?php

namespace App\Http\Controllers;

use App\Models\Share;
use Illuminate\Http\Request;
use Spatie\Honeypot\Honeypot;

class ShareController extends Controller
{
    public function index(Honeypot $honeypot)
    {
        return inertia('index', [
            'honeypot' => $honeypot,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'multisite' => 'required|boolean',
            'php_version' => 'required|numeric',
            'plugins' => 'nullable|array',
            'plugins.*' => 'string',
            'themes' => 'nullable|array',
            'themes.*' => 'string',
            'wordpress_version' => 'required|string|max:20',
        ]);

        $share = new Share($validated);
        $share->save();

        return redirect()->route('share.show', ['share' => $share]);
    }

    public function show(Share $share, Honeypot $honeypot)
    {
        return inertia('index', [
            'honeypot' => $honeypot,
            'share' => $share,
            'url' => route('share.show', ['share' => $share]),
        ]);
    }
}

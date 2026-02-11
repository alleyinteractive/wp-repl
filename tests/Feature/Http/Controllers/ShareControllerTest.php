<?php

test('create a share', function () {
    $this->post('/share', [
        'code' => 'test-code',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('shares', [
        'code' => 'test-code',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ]);
});

test('create a multisite share', function () {
    $this->post('/share', [
        'code' => 'test-code',
        'multisite' => true,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('shares', [
        'code' => 'test-code',
        'multisite' => true,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ]);
});

test('validates a share', function ($request) {
    $this->post('/share', $request)
        ->assertRedirect('/');
})->with([
    'empty' => [
        [],
    ],
    'missing_code' => [
        ['wordpress_version' => 'latest', 'php_version' => '8.4'],
    ],
    'missing_wordpress_version' => [
        ['code' => 'test-code', 'php_version' => '8.4'],
    ],
    'missing_php_version' => [
        ['code' => 'test-code', 'wordpress_version' => 'latest'],
    ],
]);

test('create a share with plugins', function () {
    $this->post('/share', [
        'code' => 'test-code-with-plugins',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
        'plugins' => ['hello-dolly', 'akismet'],
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('shares', [
        'code' => 'test-code-with-plugins',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ]);

    // Verify plugins are stored as JSON
    $share = \App\Models\Share::where('code', 'test-code-with-plugins')->first();
    expect($share->plugins)->toBe(['hello-dolly', 'akismet']);
});

test('create a share with themes', function () {
    $this->post('/share', [
        'code' => 'test-code-with-themes',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
        'themes' => ['twentytwentyfour'],
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('shares', [
        'code' => 'test-code-with-themes',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ]);

    // Verify themes are stored as JSON
    $share = \App\Models\Share::where('code', 'test-code-with-themes')->first();
    expect($share->themes)->toBe(['twentytwentyfour']);
});

test('create a share with both plugins and themes', function () {
    $this->post('/share', [
        'code' => 'test-code-with-both',
        'multisite' => false,
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
        'plugins' => ['hello-dolly'],
        'themes' => ['twentytwentyfour'],
    ])
        ->assertRedirect();

    $share = \App\Models\Share::where('code', 'test-code-with-both')->first();
    expect($share->plugins)->toBe(['hello-dolly']);
    expect($share->themes)->toBe(['twentytwentyfour']);
});

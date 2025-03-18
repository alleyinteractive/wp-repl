<?php

test('create a share', function () {
    $this->post('/share', [
        'code' => 'test-code',
        'wordpress_version' => 'latest',
        'php_version' => '8.4',
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('shares', [
        'code' => 'test-code',
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

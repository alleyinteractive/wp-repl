<?php

use App\Models\Share;

test('it creates a share with a hash', function () {
    $share = Share::factory()->create();

    expect($share)
        ->toBeInstanceOf(Share::class)
        ->and($share->hash)->not()->toBeEmpty()
        ->and($share->code)->not()->toBeEmpty()
        ->and($share->php_version)->toBe('8.3')
        ->and($share->wordpress_version)->toBe('latest');
});

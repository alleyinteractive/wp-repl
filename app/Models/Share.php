<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @property string $hash
 * @property string $code
 * @property string $php_version
 * @property bool $multisite
 * @property string $wordpress_version
 * @property array|null $options
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @method static \Database\Factories\ShareFactory factory($count = null, $state = [])
 */
class Share extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = ['id'];

    /**
     * Bootstrap any application services.
     */
    public static function boot(): void
    {
        parent::boot();

        // Automatically generate a unique hash when creating a new share
        static::creating(function (Share $share) {
            if (! empty($share->hash)) {
                return;
            }

            while (true) {
                $hash = Str::random(10);
                if (! self::where('hash', $hash)->exists()) {
                    $share->hash = $hash;
                    break;
                }
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'hash';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => AsArrayObject::class,
        ];
    }
}

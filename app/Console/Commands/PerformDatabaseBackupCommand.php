<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

final class PerformDatabaseBackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'perform:database-backup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a database backup.';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $filename = 'backup-'.now()->timestamp.'.sql';

        File::copy(database_path('database.sqlite'), storage_path('backups/'.$filename));

        $glob = File::glob(storage_path('storage/backups/*.sql'));

        collect($glob)->sort()->reverse()->slice(5)->filter(
            fn (mixed $backup): bool => is_string($backup),
        )
            ->each(
                fn (string $backup): bool => File::delete($backup),
            );
    }
}

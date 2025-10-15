<?php

use App\Models\Objective;
use App\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$dryRun = in_array('--dry-run', $argv, true);

echo "\nBackfilling objectives.user_id (" . ($dryRun ? 'DRY RUN' : 'APPLY') . ")\n";
echo str_repeat('=', 60) . "\n";

$nullCount = Objective::whereNull('user_id')->count();
echo "Objectives with NULL user_id: $nullCount\n";
if ($nullCount === 0) {
    echo "Nothing to update.\n";
    exit(0);
}

$updated = 0; $skipped = 0;

DB::beginTransaction();
try {
    Objective::whereNull('user_id')->orderBy('objective_id')->chunk(100, function ($chunk) use (&$updated, &$skipped, $dryRun) {
        foreach ($chunk as $objective) {
            // Strategy:
            // 1) If objective has department_id → pick a manager in that department; if none, any user in that department; if none, fallback to first admin; if none, skip
            // 2) If no department_id → fallback to first admin; if none, skip
            $candidateUser = null;

            if (!empty($objective->department_id)) {
                $candidateUser = User::where('department_id', $objective->department_id)
                    ->whereHas('role', function ($q) { $q->whereRaw('LOWER(role_name) = ?', ['manager']); })
                    ->orderBy('user_id')
                    ->first();

                if (!$candidateUser) {
                    $candidateUser = User::where('department_id', $objective->department_id)
                        ->orderBy('user_id')
                        ->first();
                }
            }

            if (!$candidateUser) {
                $candidateUser = User::whereHas('role', function ($q) { $q->whereRaw('LOWER(role_name) = ?', ['admin']); })
                    ->orderBy('user_id')
                    ->first();
            }

            if (!$candidateUser) {
                $skipped++;
                echo "SKIP objective #{$objective->objective_id}: no suitable user found\n";
                continue;
            }

            echo "SET objective #{$objective->objective_id} → user_id={$candidateUser->user_id}\n";
            if (!$dryRun) {
                $objective->user_id = $candidateUser->user_id;
                $objective->save();
            }
            $updated++;
        }
    });

    if ($dryRun) {
        DB::rollBack();
        echo "\nDry run complete. No changes were committed.\n";
    } else {
        DB::commit();
        echo "\nApplied changes successfully.\n";
    }

    echo "\nSummary: updated=$updated, skipped=$skipped\n";
} catch (Throwable $e) {
    DB::rollBack();
    echo "\nERROR: " . $e->getMessage() . "\n";
    exit(1);
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Locomotive;
use App\Models\LocomotiveType;
use App\Models\ServiceLocation;
use Illuminate\Support\Facades\Storage;

class LocomotiveImportSeeder extends Seeder
{
    public function run()
    {
        $filePath = storage_path('app/mozdony.csv');

        if (!file_exists($filePath)) {
            $this->command->error("Hiba: Nem található a fájl: {$filePath}");
            return;
        }
        $file = fopen($filePath, 'r');

        $delimiter = ';';

        $header = fgetcsv($file, 1000, $delimiter);

        $count = 0;

        while (($row = fgetcsv($file, 1000, $delimiter)) !== false) {


            if (empty(array_filter($row))) {
                continue;
            }

            $uic = preg_replace('/[^0-9]/', '', $row[0] ?? '');
            $tipusSzam     = trim($row[1] ?? '');
            $becenev       = trim($row[2] ?? '');
            $vmax          = trim($row[3] ?? '');
            $honallomasNev = trim($row[4] ?? '');
            $aktivStr      = mb_strtolower(trim($row[5] ?? ''));
            $komment       = trim($row[6] ?? '');

            $locationId = null;
            if (!empty($honallomasNev)) {
                $location = ServiceLocation::firstOrCreate(
                    ['name' => $honallomasNev]
                );
                $locationId = $location->id;
            }

            $typeId = null;
            if (!empty($tipusSzam)) {
                $type = LocomotiveType::updateOrCreate(
                    ['type_number' => $tipusSzam],
                    [
                        'name' => $becenev,
                        'vmax' => $vmax
                    ]
                );
                $typeId = $type->id;
            }


            $isActive = in_array($aktivStr, ['igen', '1', 'true', 'igaz', 'aktív']);

            if (!empty($uic) && $typeId) {

                Locomotive::updateOrCreate(
                    ['uic' => $uic],
                    [
                        'locomotive_type_id'  => $typeId,
                        'service_location_id' => $locationId,
                        'is_active'           => $isActive,
                        'comment'             => empty($komment) ? null : $komment,
                    ]
                );
                $count++;
            }
        }

        fclose($file);
        $this->command->info("{$count} db mozdony sikeresen importálva a rendszerbe!");
    }
}

<?php

namespace Database\Seeders;

use App\Models\MultipleUnit;
use App\Models\MultipleUnitType;
use App\Models\ServiceLocation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MultipleUnitImportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $filePath = storage_path('app/motorvonat.csv');

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
            $tipusSzam           = trim($row[1] ?? '');
            $becenev             = trim($row[2] ?? '');
            $honallomasNev       = trim($row[3] ?? '');
            $kthAllomasNev       = trim($row[4] ?? '');
            $krev                = trim($row[5] ?? '');
            $aktivStr            = mb_strtolower(trim($row[6] ?? ''));
            $ulesekSzama         = (int) trim($row[7] ?? '0');
            $komment             = trim($row[8] ?? '');

            if (empty($becenev)) {
                $becenev = $tipusSzam;
            }

            $homeDepotId = null;
            if (!empty($honallomasNev)) {

                $homeDepot = ServiceLocation::firstOrCreate(
                    ['name' => $honallomasNev]
                );
                $homeDepotId = $homeDepot->id;
            }

            $serviceLocationId = null;
            if (!empty($kthAllomasNev)) {
                $serviceLocation = ServiceLocation::firstOrCreate(
                    ['name' => $kthAllomasNev]
                );
                $serviceLocationId = $serviceLocation->id;
            }

            $typeId = null;
            if (!empty($tipusSzam)) {
                $type = MultipleUnitType::firstOrCreate(
                    ['name' => $becenev],
                    ['type_number' => $tipusSzam]
                );
                $typeId = $type->id;
            }
            $isActive = in_array($aktivStr, ['igen', '1', 'true', 'igaz', 'aktív']);

            if (!empty($uic) && $typeId) {

                MultipleUnit::updateOrCreate(
                    ['uic' => $uic],
                    [
                        'multiple_unit_type_id' => $typeId,
                        'home_depot_id'         => $homeDepotId,
                        'service_location_id'   => $serviceLocationId,
                        'next_rev_date'         => empty($krev) ? null : $krev,
                        'is_active'             => $isActive,
                        'number_of_seats'       => $ulesekSzama,
                        'comment'               => empty($komment) ? null : $komment,
                    ]
                );
                $count++;
            }
        }

        fclose($file);
        $this->command->info("{$count} db motorvonat sikeresen importálva a rendszerbe!");
    }
}

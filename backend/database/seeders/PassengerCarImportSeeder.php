<?php

namespace Database\Seeders;

use App\Models\PassengerCar;
use App\Models\ServiceLocation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Rules\UicNumber;
use App\Models\CarCategory;
use App\Models\PassengerCarType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;

class PassengerCarImportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $filePath = storage_path('app/szemelykocsik.csv');

        if (!file_exists($filePath)) {
            $this->command->error("Hiba: Nem található a fájl: {$filePath}");
            return;
        }

        $file = fopen($filePath, 'r');
        $delimiter = ';';

        $count = 0;
        $failed = 0;

        while (($row = fgetcsv($file, 1000, $delimiter)) !== false) {

            if (empty(array_filter($row))) {
                continue;
            }
            if (mb_strtolower(trim($row[0] ?? '')) === 'uic') {
                continue;
            }
            $uic = preg_replace('/[^0-9]/', '', $row[0] ?? '');
            $tipusSzam           = trim($row[1] ?? '');
            $kocsitipus          = trim($row[2] ?? '');
            $honallomasNev       = trim($row[3] ?? '');
            $kthAllomasNev       = trim($row[4] ?? '');
            $krev                = str_replace('.', '-', trim($row[5] ?? ''));
            $aktivStr            = mb_strtolower(trim($row[6] ?? ''));
            $ulesekSzama         = trim($row[7] ?? '');
            $vmax                = trim($row[8] ?? '');
            $komment             = trim($row[9] ?? '');

            $validator = Validator::make(
                [
                    'uic' => $uic,
                ],
                [
                    'uic' => ['required', new UicNumber],
                ]
            );
            if ($validator->fails()) {
                $this->command->error("Hiba a sorban: " . implode(', ', $row) . " - " . implode(', ', $validator->errors()->all()));
                $failed++;
                continue;
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
            $categoryId = null;
            if (!empty($kocsitipus)) {
                $category = CarCategory::firstOrCreate(
                    ['name' => $kocsitipus]
                );
                $categoryId = $category->id;
            }
            $typeId = null;
            if (!empty($tipusSzam && $categoryId)) {
                $type = PassengerCarType::updateOrCreate(
                    ['type_number' => $tipusSzam],
                    [
                        'car_category_id' => $categoryId,
                        'number_of_seats' => empty($ulesekSzama) ? null : $ulesekSzama,
                        'vmax'            => empty($vmax) ? null : (int)$vmax,
                    ]
                );
                $typeId = $type->id;
            }

            $isActive = in_array($aktivStr, ['igen', '1', 'true', 'igaz', 'aktív']);

            if ($typeId) {

                PassengerCar::updateOrCreate(
                    ['uic' => $uic],
                    [
                        'passenger_car_type_id' => $typeId,
                        'home_depot_id'         => $homeDepotId,
                        'service_location_id'   => $serviceLocationId,
                        'next_rev_date'         => empty($krev) ? null : $krev,
                        'is_active'             => $isActive,
                        'comment'               => empty($komment) ? null : $komment,
                    ]
                );
                $count++;
            }
        }

        fclose($file);
        $this->command->info("{$count} db személykocsi sikeresen importálva a rendszerbe!");
        if ($failed > 0) {
            $this->command->warn("{$failed} db sor nem lett importálva a hibák miatt.");
        }
    }
}

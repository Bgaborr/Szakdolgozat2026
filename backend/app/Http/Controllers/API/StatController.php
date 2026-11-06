<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Locomotive;
use App\Models\PassengerCar;
use App\Models\MultipleUnit;
use Illuminate\Http\Request;

class StatController extends Controller
{

    public function getLocomotiveStats()
    {
        $locomotives = Locomotive::with(['type', 'serviceLocation'])->get();
        $total = $locomotives->count();

        $types = $locomotives->groupBy(function ($loco) {
            return  $loco->type ? $loco->type->name : 'Ismeretlen';
        })->map->count();

        $activeLocCount = $locomotives->where('is_active', true)->count();
        $inactiveLocCount = $total - $activeLocCount;

        $traction = [
            'Villany' => 0,
            'Dízel' => 0,
            'Egyéb' => 0,
        ];

        foreach ($locomotives as $loco) {
            $uicString = $loco->uic ?? '';
            $uicPrefix = substr(trim($uicString), 0, 2);
            if (in_array($uicPrefix, ['91', '93'])) {
                $traction['Villany']++;
            } elseif (in_array($uicPrefix, ['92', '94', '95', '98', '97'])) {
                $traction['Dízel']++;
            } else {
                $traction['Egyéb']++;
            }
        }

        $locations = $locomotives->groupBy(function ($loco) {
            return $loco->serviceLocation ? $loco->serviceLocation->name : 'Ismeretlen';
        })->map->count();

        return response()->json([
            'total' => $total,
            'types' => $types,
            'status' => [
                'Aktív' => $activeLocCount,
                'Selejt' => $inactiveLocCount
            ],
            'traction' => $traction,
            'locations' => $locations
        ]);
    }

    public function getPassengerCarStats()
    {
        $cars = PassengerCar::with(['type.category', 'serviceLocation', 'homeDepot'])->get();
        $total = $cars->count();

        $activeCarCount = $cars->where('is_active', true)->count();

        $categories = $cars->groupBy(function ($car) {
            return $car->type && $car->type->category ? $car->type->category->name : 'Ismeretlen';
        })->map->count();

        $carsVmax = $cars->groupBy(function ($car) {
            return empty($car->vmax) ? 'Nincs adat' : $car->vmax . ' km/h';
        })->map->count();

        $homeDepots = $cars->groupBy(function ($car) {
            return $car->homeDepot ? $car->homeDepot->name : 'Ismeretlen';
        })->map->count();

        return response()->json([
            'total' => $total,
            'status' => [
                'Aktív' => $activeCarCount,
                'Selejt / Fővizsgára vár' => $total - $activeCarCount
            ],
            'categories' => $categories,
            'vmax' => $carsVmax,
            'home_depots' => $homeDepots,
        ]);
    }

    public function getMultipleUnitStats()
    {
        $mus = MultipleUnit::with(['type', 'serviceLocation', 'homeDepot'])->get();
        $total = $mus->count();


        $types = $mus->groupBy(function ($mu) {
            return $mu->type ? $mu->type->name : 'Ismeretlen';
        })->map->count();

        $activeMuCount = $mus->where('is_active', true)->count();

        $locations = $mus->groupBy(function ($mu) {
            return $mu->serviceLocation ? $mu->serviceLocation->name : 'Ismeretlen';
        })->map->count();


        $traction = [
            'Villamos' => 0,
            'Dízel' => 0,
            'Egyéb' => 0,
        ];

        foreach ($mus as $mu) {
            $uicString = $mu->uic ?? '';
            $uicPrefix = substr(trim($uicString), 0, 2);

            if (in_array($uicPrefix, ['93', '94'])) {
                $traction['Villamos']++;
            } elseif ($uicPrefix === '95') {
                $traction['Dízel']++;
            } else {
                $traction['Egyéb']++;
            }
        }

        return response()->json([
            'total' => $total,
            'types' => $types,
            'status' => [
                'Aktív' => $activeMuCount,
                'Javításra vár' => $total - $activeMuCount
            ],
            'traction' => $traction,
            'locations' => $locations
        ]);
    }
}

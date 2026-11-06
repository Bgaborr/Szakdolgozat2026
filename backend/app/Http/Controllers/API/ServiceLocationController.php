<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MultipleUnit;
use App\Models\PassengerCar;
use App\Models\ServiceLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceLocationController extends Controller
{
    public function index(): JsonResponse
    {
        $locations = ServiceLocation::withCount([
            'passengerCars',
            'locomotives',
            'multipleUnits',
        ])->orderBy('name')->get();


        $formattedLocations = $locations->map(function ($location) {
            $totalCount = ($location->passenger_cars_count ?? 0) +
                ($location->locomotives_count ?? 0) +
                ($location->multiple_units_count ?? 0);

            return [
                'id'           => $location->id,
                'name'         => $location->name,
                'vehicleCount' => $totalCount,
            ];
        });

        return response()->json($formattedLocations);
    }
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:service_locations,name'],
        ]);

        $location = ServiceLocation::create($validated);

        return response()->json($location, 201);
    }
    public function update(Request $request, $id): JsonResponse
    {
        $location = ServiceLocation::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('service_locations', 'name')->ignore($location->id),
            ],
        ]);

        $location->update($validated);

        return response()->json([
            'message' => 'Szolgálati hely neve sikeresen frissítve!',
            'data'    => $location,
        ]);
    }
    public function destroy($id): JsonResponse
    {
        $location = ServiceLocation::findOrFail($id);
        $hasVehicles = $location->passengerCars()->exists() ||
            $location->locomotives()->exists() ||
            $location->multipleUnits()->exists() ||
            PassengerCar::where('home_depot_id', $location->id)->exists() ||
            MultipleUnit::where('home_depot_id', $location->id)->exists();

        if ($hasVehicles) {
            return response()->json([
                'message' => 'Nem törölhető, mert vannak hozzá kapcsolódó járművek (mozdony, kocsi vagy motorvonat)!',
            ], 400);
        }

        $location->delete();

        return response()->json([
            'message' => 'Szolgálati hely sikeresen törölve!',
        ]);
    }
}

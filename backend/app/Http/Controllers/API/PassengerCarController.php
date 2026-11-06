<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\StoresSuggestions;
use App\Http\Controllers\Controller;
use App\Models\GalleryPost;
use App\Models\PassengerCar;
use App\Rules\UicNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PassengerCarController extends Controller
{
    use StoresSuggestions;
    private const RELATIONS = ['type.category', 'serviceLocation', 'homeDepot'];
    private const REQUIRED = ['passenger_car_type_id', 'uic', 'home_depot_id', 'service_location_id'];

    private const ZERO_DEFAULT = ['number_of_seats', 'vmax'];

    private function fieldRules(?int $ignoreId = null): array
    {
        return [
            'passenger_car_type_id' => ['exists:passenger_car_types,id'],
            'uic'                   => ['string', 'max:16', Rule::unique('passenger_cars', 'uic')->ignore($ignoreId), new UicNumber()],
            'next_rev_date'         => ['nullable', 'date'],
            'home_depot_id'         => ['exists:service_locations,id'],
            'service_location_id'   => ['exists:service_locations,id'],
            'is_active'             => ['boolean'],
            'number_of_seats'       => ['nullable', 'integer', 'min:0', 'max:1000'],
            'vmax'                  => ['nullable', 'integer', 'min:0', 'max:400'],
            'comment'               => ['nullable', 'string', 'max:255'],
        ];
    }

    private function rules(?int $ignoreId = null): array
    {
        $rules = $this->fieldRules($ignoreId);
        foreach (self::REQUIRED as $field) {
            array_unshift($rules[$field], 'required');
        }
        $rules['rev_date'] = ['nullable', 'date'];
        $rules['next_rev_date'][] = 'after_or_equal:rev_date';

        return $rules;
    }
    private function withZeroDefaults(array $validated): array
    {
        foreach (self::ZERO_DEFAULT as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] === null) {
                $validated[$field] = 0;
            }
        }

        return $validated;
    }
    public function index(): JsonResponse
    {
        return response()->json(PassengerCar::with(self::RELATIONS)->get());
    }

    public function show($id): JsonResponse
    {
        return response()->json(PassengerCar::with(self::RELATIONS)->findOrFail($id));
    }
    public function store(Request $request): JsonResponse
    {
        $validated = $this->withZeroDefaults($request->validate($this->rules()));

        $car = PassengerCar::create($validated);
        $car->load(self::RELATIONS);

        return response()->json([
            'message' => 'Személykocsi sikeresen rögzítve!',
            'data'    => $car,
        ], 201);
    }
    public function update(Request $request, $id): JsonResponse
    {
        $car = PassengerCar::findOrFail($id);

        $validated = $this->withZeroDefaults($request->validate($this->rules($car->id)));

        $car->update($validated);
        $car->load(self::RELATIONS);

        return response()->json([
            'message' => 'Személykocsi adatai frissítve!',
            'data'    => $car,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $car = PassengerCar::findOrFail($id);

        DB::transaction(function () use ($car) {
            $car->suggestions()->delete();
            GalleryPost::where('vehicle_category', 'passenger_car')
                ->where('vehicle_id', $car->id)
                ->update(['vehicle_id' => null, 'is_cover' => false]);
            $car->delete();
        });

        return response()->json([
            'message' => 'Személykocsi sikeresen törölve!',
        ]);
    }

    public function storeSuggestion(Request $request, $id): JsonResponse
    {
        $car = PassengerCar::findOrFail($id);

        return $this->storeSuggestionFor(
            $request,
            $car,
            $this->fieldRules($car->id),
            'Személykocsi javaslat beküldve!'
        );
    }
}

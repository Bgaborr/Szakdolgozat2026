<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\StoresSuggestions;
use App\Http\Controllers\Controller;
use App\Models\GalleryPost;
use App\Models\MultipleUnit;
use App\Rules\UicNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MultipleUnitController extends Controller
{
    use StoresSuggestions;

    private const RELATIONS = ['type', 'serviceLocation', 'homeDepot'];
    private const REQUIRED = ['multiple_unit_type_id', 'uic', 'home_depot_id', 'service_location_id'];

    private function fieldRules(?int $ignoreId = null): array
    {
        return [
            'multiple_unit_type_id' => ['exists:multiple_unit_types,id'],
            'uic'                   => ['string', 'max:16', Rule::unique('multiple_units', 'uic')->ignore($ignoreId), new UicNumber()],
            'home_depot_id'         => ['exists:service_locations,id'],
            'service_location_id'   => ['exists:service_locations,id'],
            'next_rev_date'         => ['nullable', 'date'],
            'number_of_seats'       => ['nullable', 'integer', 'min:0', 'max:1000'],
            'is_active'             => ['boolean'],
            'comment'               => ['nullable', 'string', 'max:255'],
        ];
    }

    private function rules(?int $ignoreId = null): array
    {
        $rules = $this->fieldRules($ignoreId);
        foreach (self::REQUIRED as $field) {
            array_unshift($rules[$field], 'required');
        }

        return $rules;
    }

    /** A number_of_seats oszlop NOT NULL: null helyett 0-t mentünk. */
    private function withZeroSeats(array $validated): array
    {
        if (array_key_exists('number_of_seats', $validated) && $validated['number_of_seats'] === null) {
            $validated['number_of_seats'] = 0;
        }

        return $validated;
    }

    //GET/api/mu
    public function index(): JsonResponse
    {
        return response()->json(MultipleUnit::with(self::RELATIONS)->get());
    }

    //GET/api/mu/{id}
    public function show($id): JsonResponse
    {
        return response()->json(MultipleUnit::with(self::RELATIONS)->findOrFail($id));
    }

    //POST/api/mu
    public function store(Request $request): JsonResponse
    {
        $validated = $this->withZeroSeats($request->validate($this->rules()));

        $mu = MultipleUnit::create($validated);
        $mu->load(self::RELATIONS);

        return response()->json([
            'message' => 'Motorvonat sikeresen rögzítve!',
            'data'    => $mu,
        ], 201);
    }

    //PUT/api/mu/{id}
    public function update(Request $request, $id): JsonResponse
    {
        $mu = MultipleUnit::findOrFail($id);

        $validated = $this->withZeroSeats($request->validate($this->rules($mu->id)));

        $mu->update($validated);
        $mu->load(self::RELATIONS);

        return response()->json([
            'message' => 'Motorvonat sikeresen frissítve!',
            'data'    => $mu,
        ]);
    }

    //DELETE/api/mu/{id}
    public function destroy($id): JsonResponse
    {
        $mu = MultipleUnit::findOrFail($id);
        DB::transaction(function () use ($mu) {
            $mu->suggestions()->delete();
            GalleryPost::where('vehicle_category', 'multiple_unit')
                ->where('vehicle_id', $mu->id)
                ->update(['vehicle_id' => null, 'is_cover' => false]);
            $mu->delete();
        });

        return response()->json([
            'message' => 'Motorvonat sikeresen törölve!',
        ]);
    }
    public function storeSuggestion(Request $request, $id): JsonResponse
    {
        $mu = MultipleUnit::findOrFail($id);

        return $this->storeSuggestionFor(
            $request,
            $mu,
            $this->fieldRules($mu->id),
            'Motorvonat javaslat beküldve!'
        );
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\StoresSuggestions;
use App\Http\Controllers\Controller;
use App\Models\GalleryPost;
use App\Models\Locomotive;
use App\Rules\UicNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LocomotiveController extends Controller
{
    use StoresSuggestions;

    private const RELATIONS = ['type', 'serviceLocation'];

    private const REQUIRED = ['locomotive_type_id', 'uic', 'service_location_id'];

    private function fieldRules(?int $ignoreId = null): array
    {
        return [
            'locomotive_type_id'  => ['exists:locomotive_types,id'],
            'uic'                 => ['string', 'max:16', Rule::unique('locomotives', 'uic')->ignore($ignoreId), new UicNumber()],
            'service_location_id' => ['exists:service_locations,id'],
            'is_active'           => ['boolean'],
            'comment'             => ['nullable', 'string', 'max:255'],

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
    public function index(): JsonResponse
    {
        return response()->json(Locomotive::with(self::RELATIONS)->get());
    }

    public function show($id): JsonResponse
    {
        return response()->json(Locomotive::with(self::RELATIONS)->findOrFail($id));
    }
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $loc = Locomotive::create($validated);
        $loc->load(self::RELATIONS);

        return response()->json([
            'message' => 'Mozdony sikeresen rögzítve!',
            'data'    => $loc,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $loc = Locomotive::findOrFail($id);

        $validated = $request->validate($this->rules($loc->id));

        $loc->update($validated);
        $loc->load(self::RELATIONS);

        return response()->json([
            'message' => 'Mozdony sikeresen frissítve!',
            'data'    => $loc,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $loc = Locomotive::findOrFail($id);

        DB::transaction(function () use ($loc) {
            $loc->suggestions()->delete();
            GalleryPost::where('vehicle_category', 'locomotive')
                ->where('vehicle_id', $loc->id)
                ->update(['vehicle_id' => null, 'is_cover' => false]);
            $loc->delete();
        });

        return response()->json([
            'message' => 'Mozdony sikeresen törölve!',
        ]);
    }
    public function storeSuggestion(Request $request, $id): JsonResponse
    {
        $loco = Locomotive::findOrFail($id);

        return $this->storeSuggestionFor(
            $request,
            $loco,
            $this->fieldRules($loco->id),
            'Mozdony javaslat beküldve!'
        );
    }
}

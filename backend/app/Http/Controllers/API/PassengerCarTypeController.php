<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PassengerCarType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PassengerCarTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PassengerCarType::with('category')->orderBy('type_number')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_number' => 'required|string|max:255',
            'vmax' => 'nullable|integer',
            'category_id' => 'nullable|exists:passenger_car_categories,id'
        ]);

        $type = PassengerCarType::create($validated);
        return response()->json($type->load('category'), 201);
    }

    public function show($id): JsonResponse
    {
        $type = PassengerCarType::with('category')->findOrFail($id);
        return response()->json($type);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $type = PassengerCarType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_number' => 'required|string|max:255',
            'vmax' => 'nullable|integer',
            'category_id' => 'nullable|exists:passenger_car_categories,id'
        ]);

        $type->update($validated);
        return response()->json($type->load('category'));
    }

    public function destroy($id): JsonResponse
    {
        $type = PassengerCarType::findOrFail($id);
        $type->delete();
        return response()->json(['message' => 'Típus sikeresen törölve!']);
    }
}

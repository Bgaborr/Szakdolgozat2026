<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MultipleUnitType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultipleUnitTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(MultipleUnitType::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_number' => 'required|string|max:255',
            'vmax' => 'nullable|integer',
        ]);

        $type = MultipleUnitType::create($validated);
        return response()->json($type, 201);
    }

    public function show($id): JsonResponse
    {
        $type = MultipleUnitType::findOrFail($id);
        return response()->json($type);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $type = MultipleUnitType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_number' => 'required|string|max:255',
            'vmax' => 'nullable|integer',
        ]);

        $type->update($validated);
        return response()->json($type);
    }

    public function destroy($id): JsonResponse
    {
        $type = MultipleUnitType::findOrFail($id);
        $type->delete();
        return response()->json(['message' => 'Típus sikeresen törölve!']);
    }
}

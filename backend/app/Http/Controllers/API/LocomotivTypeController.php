<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LocomotiveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocomotivTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(LocomotiveType::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_number' => 'required|string|max:255',
            'vmax' => 'nullable|integer',
        ]);

        $type = LocomotiveType::create($validated);
        return response()->json($type, 201);
    }

    public function show($id): JsonResponse
    {
        $type = LocomotiveType::findOrFail($id);
        return response()->json($type);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $type = LocomotiveType::findOrFail($id);

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
        $type = LocomotiveType::findOrFail($id);
        $type->delete();
        return response()->json(['message' => 'Típus sikeresen törölve!']);
    }
}

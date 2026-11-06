<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\ChecksPermissions;
use App\Http\Controllers\Controller;
use App\Models\Suggestion;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuggestionController extends Controller
{
    use ChecksPermissions;

    private const PERMISSION = 'approve-suggestions';

    public function store(Request $request, $carId): JsonResponse
    {
        return app(PassengerCarController::class)->storeSuggestion($request, $carId);
    }

    public function index(Request $request): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        $suggestions = Suggestion::with(['suggestable', 'user:id,name'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($suggestions);
    }

    public function approve(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        try {
            return DB::transaction(function () use ($id) {
                $suggestion = Suggestion::whereKey($id)->lockForUpdate()->firstOrFail();

                if ($suggestion->status !== 'pending') {
                    return response()->json(['message' => 'Ezt a javaslatot már elbírálták.'], 409);
                }

                $vehicle = $suggestion->suggestable;
                if (!$vehicle) {
                    return response()->json(['message' => 'A javaslathoz tartozó jármű már nem létezik.'], 422);
                }

                $vehicle->update($suggestion->suggested_data);
                $suggestion->update(['status' => 'approved']);

                return response()->json(['message' => 'Javaslat elfogadva, jármű sikeresen frissítve!']);
            });
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'A módosítás nem alkalmazható, mert ütközik egy meglévő adattal (pl. már létező pályaszám).',
            ], 422);
        }
    }

    public function reject(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        $suggestion = Suggestion::findOrFail($id);

        if ($suggestion->status !== 'pending') {
            return response()->json(['message' => 'Ezt a javaslatot már elbírálták.'], 409);
        }

        $suggestion->update(['status' => 'rejected']);

        return response()->json(['message' => 'Javaslat elutasítva.']);
    }
}

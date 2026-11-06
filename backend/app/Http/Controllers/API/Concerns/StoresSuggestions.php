<?php

namespace App\Http\Controllers\API\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

trait StoresSuggestions
{
    /**
     * @param array<string, array<int, mixed>> $fieldRules
     */
    protected function storeSuggestionFor(
        Request $request,
        Model $vehicle,
        array $fieldRules,
        string $successMessage
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user, 401, 'A javaslat beküldéséhez be kell jelentkezned.');

        $rules = [
            'suggested_data' => ['required', 'array', 'min:1'],
            'source'         => ['required', 'string', 'in:saját forrás,más forrás'],
            'source_link'    => ['nullable', 'string', 'max:2048'],
        ];
        foreach ($fieldRules as $field => $fieldRule) {
            $rules["suggested_data.$field"] = array_merge(['sometimes'], (array) $fieldRule);
        }
        $request->validate($rules);
        $allowed = array_keys($fieldRules);
        $suggested = Arr::only($request->input('suggested_data', []), $allowed);

        if ($suggested === []) {
            throw ValidationException::withMessages([
                'suggested_data' => ['A javaslat nem tartalmaz módosítható mezőt.'],
            ]);
        }

        $vehicle->suggestions()->create([
            'user_id'        => $user->id,
            'original_data'  => $vehicle->only($allowed),
            'suggested_data' => $suggested,
            'source'         => $request->input('source'),
            'source_link'    => $request->input('source_link'),
            'status'         => 'pending',
        ]);

        return response()->json(['message' => $successMessage], 201);
    }
}

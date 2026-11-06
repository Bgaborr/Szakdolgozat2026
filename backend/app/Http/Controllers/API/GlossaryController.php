<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\ChecksPermissions;
use App\Http\Controllers\Controller;
use App\Models\Glossary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GlossaryController extends Controller
{
    use ChecksPermissions;
    private const PERMISSION = 'glossary-edit';
    private const DEFAULT_CATEGORY = 'Egyéb';

    private function rules(?int $ignoreId = null): array
    {
        return [
            'category'   => ['nullable', 'string', 'max:100'],
            'term'       => [
                'required',
                'string',
                'max:255',
                Rule::unique(Glossary::class, 'term')->ignore($ignoreId),
            ],
            'definition' => ['required', 'string'],
        ];
    }
    private function toAttributes(array $validated): array
    {
        $category = trim((string) ($validated['category'] ?? ''));
        $validated['category'] = $category !== '' ? $category : self::DEFAULT_CATEGORY;

        return $validated;
    }
    public function index(): JsonResponse
    {
        return response()->json(Glossary::orderBy('term', 'asc')->get());
    }
    public function store(Request $request): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        $validated = $this->toAttributes($request->validate($this->rules()));
        $glossary = new Glossary();
        $glossary->forceFill($validated)->save();

        return response()->json($glossary, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        $glossary = Glossary::findOrFail($id);

        $validated = $this->toAttributes($request->validate($this->rules($glossary->id)));

        $glossary->forceFill($validated)->save();

        return response()->json($glossary);
    }
    public function delete(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, [self::PERMISSION]);

        $glossary = Glossary::findOrFail($id);
        $glossary->delete();

        return response()->json(['message' => 'Sikeresen törölve!']);
    }
}

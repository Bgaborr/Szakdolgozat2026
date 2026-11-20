<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\FormatsUsers;
use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    use FormatsUsers;
    private const SYSTEM_PERMISSIONS = [
        'manage-users',
        'view-admin-panel',
        'approve-gallery',
        'approve-suggestions',
        'edit-gallery',
        'delete-images',
        'view-permissions',
        'glossary-edit',
    ];
    private function requireTopLevel(Request $request): void
    {
        $user = $request->user();

        abort_unless(
            $user && $this->userLevel($user) === $this->topLevel(),
            403,
            'Jogosultságokat csak a legmagasabb rangú felhasználó kezelhet.'
        );
    }

    public function index(): JsonResponse
    {
        $permissions = Permission::withCount('roles')->get()->map(fn($p) => [
            'id'          => $p->id,
            'name'        => $p->name,
            'description' => $p->description,
            'role_count'  => $p->roles_count,
        ]);

        return response()->json($permissions);
    }
    public function store(Request $request): JsonResponse
    {
        $this->requireTopLevel($request);

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:100', 'unique:permissions,name'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'message'    => 'Jogosultság létrehozva.',
            'permission' => $permission,
        ], 201);
    }
    public function update(Request $request, Permission $permission): JsonResponse
    {
        $this->requireTopLevel($request);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100', Rule::unique('permissions', 'name')->ignore($permission->id)],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        if (
            in_array($permission->name, self::SYSTEM_PERMISSIONS, true)
            && isset($validated['name'])
            && $validated['name'] !== $permission->name
        ) {
            return response()->json(['message' => 'Ez a jogosultság a rendszer része, az azonosítója nem módosítható.'], 403);
        }

        $permission->update($validated);

        return response()->json([
            'message'    => 'Jogosultság frissítve.',
            'permission' => $permission,
        ]);
    }

    public function destroy(Request $request, Permission $permission): JsonResponse
    {
        $this->requireTopLevel($request);

        if (in_array($permission->name, self::SYSTEM_PERMISSIONS, true)) {
            return response()->json(['message' => 'Ez a jogosultság a rendszer része, nem törölhető.'], 403);
        }
        $permission->roles()->detach();
        $permission->delete();

        return response()->json(['message' => 'Jogosultság törölve.']);
    }
}

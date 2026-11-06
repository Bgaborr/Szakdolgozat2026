<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\FormatsUsers;
use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    use FormatsUsers;

    private function formatRole(Role $role): array
    {
        $role->loadMissing('permissions');
        $userCount = $role->users_count ?? $role->users()->count();

        return [
            'id'          => $role->id,
            'name'        => $role->name,
            'label'       => $role->label,
            'user_count'  => $userCount,
            'permissions' => $role->permissions->pluck('name')->toArray(),
        ];
    }
    private function isSystemRole(Role $role): bool
    {
        return isset(Role::HIERARCHY[$role->name]);
    }

    public function index(): JsonResponse
    {
        $roles = Role::withCount('users')->with('permissions')->get()->map(fn(Role $r) => $this->formatRole($r));

        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:50', 'alpha_dash', 'unique:roles,name'],
            'label'         => ['required', 'string', 'max:100'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        if (isset($validated['permissions']) && $this->userLevel($currentUser) !== $this->topLevel()) {
            $unauthorizedPermissions = array_diff($validated['permissions'], $this->userPermissionNames($currentUser));
            if (!empty($unauthorizedPermissions)) {
                return response()->json(['message' => 'Nincs jogod a következőkhöz: ' . implode(', ', $unauthorizedPermissions)], 403);
            }
        }

        $role = Role::create(['name' => $validated['name'], 'label' => $validated['label']]);

        if (isset($validated['permissions'])) {
            $permissionIds = Permission::whereIn('name', $validated['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        return response()->json(['message' => 'Szerepkör létrehozva.', 'role' => $this->formatRole($role)], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();

        $myLevel = $this->userLevel($currentUser);
        $targetLevel = Role::HIERARCHY[$role->name] ?? 0;
        $highestPossibleLevel = $this->topLevel();
        $isGodMode = ($myLevel === $highestPossibleLevel && $targetLevel === $highestPossibleLevel);

        if ($myLevel <= $targetLevel && !$isGodMode) {
            return response()->json(['message' => 'Nincs jogod nálad magasabb vagy azonos rangú szerepkört módosítani!'], 403);
        }

        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:50', 'alpha_dash', Rule::unique('roles', 'name')->ignore($role->id)],
            'label'         => ['sometimes', 'string', 'max:100'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        if ($this->isSystemRole($role) && isset($validated['name']) && $validated['name'] !== $role->name) {
            return response()->json(['message' => 'A rendszer alapértelmezett szerepkörének azonosítója nem módosítható.'], 403);
        }

        if (isset($validated['permissions']) && $myLevel !== $highestPossibleLevel) {
            $unauthorizedPermissions = array_diff($validated['permissions'], $this->userPermissionNames($currentUser));
            if (!empty($unauthorizedPermissions)) {
                return response()->json(['message' => 'Nincs jogod a következőkhöz: ' . implode(', ', $unauthorizedPermissions)], 403);
            }
        }

        $role->update([
            'name'  => $validated['name'] ?? $role->name,
            'label' => $validated['label'] ?? $role->label,
        ]);

        if (isset($validated['permissions'])) {
            $permissionIds = Permission::whereIn('name', $validated['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        return response()->json(['message' => 'Szerepkör frissítve.', 'role' => $this->formatRole($role)]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();
        $targetLevel = Role::HIERARCHY[$role->name] ?? 0;

        if ($this->userLevel($currentUser) <= $targetLevel) {
            return response()->json(['message' => 'Nincs jogod ezt a szerepkört törölni!'], 403);
        }

        if ($this->isSystemRole($role)) {
            return response()->json(['message' => 'A rendszer alapértelmezett szerepkörei nem törölhetők.'], 403);
        }
        $assigned = $role->users()->count();
        if ($assigned > 0) {
            return response()->json([
                'message' => "A szerepkör még $assigned felhasználóhoz van rendelve. Előbb vedd el tőlük, utána törölhető.",
            ], 409);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json(['message' => 'Szerepkör törölve.']);
    }
}

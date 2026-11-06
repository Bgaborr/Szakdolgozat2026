<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function getUserLevel(User $user): int
    {
        $maxLevel = 0;
        foreach ($user->roles as $role) {
            $level = Role::HIERARCHY[$role->name] ?? 0;
            if ($level > $maxLevel) $maxLevel = $level;
        }
        return $maxLevel;
    }

    private function formatUser(User $user): array
    {
        $user->loadMissing('roles.permissions');
        $permissions = $user->roles
            ->flatMap(fn($role) => $role->permissions->pluck('name'))
            ->unique()
            ->values();

        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'roles'       => $user->roles->map(fn($role) => [
                'name'  => $role->name,
                'label' => $role->label,
            ])->toArray(),

            'permissions' => $permissions,
        ];
    }

    public function index(): JsonResponse
    {
        $users = User::with('roles.permissions')->get()->map(fn(User $user) => $this->formatUser($user));
        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($this->formatUser($user));
    }

    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        $myLevel = $this->getUserLevel($currentUser);
        $highestPossibleLevel = max(Role::HIERARCHY);

        $validated = $request->validate([
            'name'     => 'required|string|min:3|max:50',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'roles'    => 'array',
            'roles.*'  => 'exists:roles,name',
        ]);

        if (!empty($validated['roles']) && $myLevel !== $highestPossibleLevel) {
            foreach ($validated['roles'] as $roleName) {
                if ((Role::HIERARCHY[$roleName] ?? 0) >= $myLevel) {
                    return response()->json(['message' => "Nem adhatsz ki $roleName szerepkört!"], 403);
                }
            }
        }

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if (!empty($validated['roles'])) {
            $roleIds = Role::whereIn('name', $validated['roles'])->pluck('id');
            $user->roles()->attach($roleIds);
        } else {
            $defaultRole = Role::where('name', 'user')->first();
            if ($defaultRole) $user->roles()->attach($defaultRole->id);
        }

        return response()->json(['message' => 'Felhasználó létrehozva.', 'user' => $this->formatUser($user)], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Saját magadat nem szerkesztheted itt!'], 403);
        }

        $myLevel = $this->getUserLevel($currentUser);
        $targetLevel = $this->getUserLevel($user);
        $highestPossibleLevel = max(Role::HIERARCHY);

        if ($myLevel <= $targetLevel) {
            return response()->json(['message' => 'Nincs jogod nálad magasabb vagy azonos rangú felhasználót módosítani!'], 403);
        }

        $validated = $request->validate([
            'name'     => 'sometimes|string|min:3|max:50',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:8',
            'roles'    => 'sometimes|array',
            'roles.*'  => 'exists:roles,name',
        ]);

        if (isset($validated['roles']) && $myLevel !== $highestPossibleLevel) {
            foreach ($validated['roles'] as $roleName) {
                if ((Role::HIERARCHY[$roleName] ?? 0) >= $myLevel) {
                    return response()->json(['message' => "Nem adhatsz ki $roleName szerepkört!"], 403);
                }
            }
        }

        if (empty($validated['password'])) unset($validated['password']);
        else $validated['password'] = Hash::make($validated['password']);

        $user->update(collect($validated)->except('roles')->toArray());

        if (isset($validated['roles'])) {
            $roleIds = Role::whereIn('name', $validated['roles'])->pluck('id');
            $user->roles()->sync($roleIds);
        }

        return response()->json(['message' => 'Felhasználó frissítve.', 'user' => $this->formatUser($user)]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) return response()->json(['message' => 'Saját magadat nem törölheted.'], 403);
        if ($this->getUserLevel($currentUser) <= $this->getUserLevel($user)) {
            return response()->json(['message' => 'Nincs jogod nálad magasabb vagy azonos rangú felhasználót törölni!'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'Felhasználbó törölve.']);
    }

    public function updateMe(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name'     => 'required|string|min:3|max:50',
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (!empty($validated['password'])) $user->password = Hash::make($validated['password']);
        $user->save();

        return response()->json(['message' => 'Profil frissítve!', 'user' => $this->formatUser($user)]);
    }
}

<?php

namespace App\Http\Controllers\API\Concerns;

use App\Models\Role;
use App\Models\User;

trait FormatsUsers
{
    protected function formatUser(User $user): array
    {
        $user->loadMissing('roles.permissions');

        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'roles'       => $user->roles->map(fn($role) => [
                'name'  => $role->name,
                'label' => $role->label,
            ])->toArray(),
            'permissions' => $this->userPermissionNames($user),
        ];
    }
    protected function userPermissionNames(User $user): array
    {
        $user->loadMissing('roles.permissions');

        return $user->roles
            ->flatMap(fn($role) => $role->permissions->pluck('name'))
            ->unique()
            ->values()
            ->all();
    }
    protected function userLevel(User $user): int
    {
        $user->loadMissing('roles');

        $max = 0;
        foreach ($user->roles as $role) {
            $max = max($max, Role::HIERARCHY[$role->name] ?? 0);
        }

        return $max;
    }
    protected function topLevel(): int
    {
        return max(Role::HIERARCHY);
    }
}

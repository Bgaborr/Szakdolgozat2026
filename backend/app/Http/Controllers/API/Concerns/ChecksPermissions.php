<?php

namespace App\Http\Controllers\API\Concerns;

use Illuminate\Http\Request;

trait ChecksPermissions
{
    protected function userHasAnyPermission($user, array $permissions): bool
    {
        if (!$user) {
            return false;
        }

        return $user->roles()
            ->whereHas('permissions', function ($query) use ($permissions) {
                $query->whereIn('name', $permissions);
            })
            ->exists();
    }

    protected function requirePermission(Request $request, array $permissions): void
    {
        abort_unless(
            $this->userHasAnyPermission($request->user(), $permissions),
            403,
            'Nincs jogosultságod ehhez a művelethez.'
        );
    }
}

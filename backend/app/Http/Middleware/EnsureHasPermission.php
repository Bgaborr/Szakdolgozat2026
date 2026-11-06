<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Útvonal-védelem jogosultság alapján.
 *
 * Használat az útvonalaknál (bármelyik felsorolt jogosultság elég):
 *   Route::post('/glossary', [GlossaryController::class, 'store'])->middleware('permission:glossary-edit');
 *
 * Regisztráció (Laravel 11/12, bootstrap/app.php):
 *   $middleware->alias(['permission' => \App\Http\Middleware\EnsureHasPermission::class]);
 */
class EnsureHasPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Nem vagy bejelentkezve.'], 401);
        }

        $allowed = $user->roles()
            ->whereHas('permissions', function ($query) use ($permissions) {
                $query->whereIn('name', $permissions);
            })
            ->exists();

        if (!$allowed) {
            return response()->json(['message' => 'Nincs jogosultságod ehhez a művelethez.'], 403);
        }

        return $next($request);
    }
}

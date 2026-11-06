<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\FormatsUsers;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use FormatsUsers;
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 60;

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|min:3|max:50',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $defaultRole = Role::where('name', 'user')->first();
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->id);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message'        => 'Sikeres regisztráció!',
            'user'           => $this->formatUser($user),
            'role_hierarchy' => Role::HIERARCHY,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);
        $throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'email' => ["Túl sok sikertelen próbálkozás. Próbáld újra $seconds másodperc múlva."],
            ]);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            RateLimiter::hit($throttleKey, self::LOCKOUT_SECONDS);
            throw ValidationException::withMessages(['email' => ['Hibás email vagy jelszó.']]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        /** @var \App\Models\User $user */
        $user = Auth::user();

        return response()->json([
            'message'        => 'Sikeres bejelentkezés!',
            'user'           => $this->formatUser($user),
            'role_hierarchy' => Role::HIERARCHY,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Nem vagy bejelentkezve.'], 401);
        }

        return response()->json([
            'user'           => $this->formatUser($user),
            'role_hierarchy' => Role::HIERARCHY,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sikeresen kijelentkezve.']);
    }
}

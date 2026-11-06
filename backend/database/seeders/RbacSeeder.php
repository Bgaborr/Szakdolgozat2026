<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RbacSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = collect([
            ['name' => 'view-vehicles',   'description' => 'Járművek megtekintése'],
            ['name' => 'edit-vehicles',   'description' => 'Járművek szerkesztése'],
            ['name' => 'delete-vehicles', 'description' => 'Járművek törlése'],
            ['name' => 'manage-users',    'description' => 'Felhasználók kezelése'],
            ['name' => 'view-gallery',    'description' => 'Galéria megtekintése'],
            ['name' => 'edit-gallery',    'description' => 'Galéria szerkesztése'],
            ['name' => 'approve-gallery', 'description' => 'Galéria posztok jóváhagyása'],
        ])->map(function ($p) {
            return Permission::firstOrCreate(['name' => $p['name']], $p);
        });

        $bossadmin = Role::firstOrCreate(['name' => 'bossadmin'], ['label' => 'Főadmin']);
        $admin = Role::firstOrCreate(['name' => 'admin'], ['label' => 'Admin']);
        $mod   = Role::firstOrCreate(['name' => 'moderator'], ['label' => 'Moderátor']);
        $editor = Role::firstOrCreate(['name' => 'editor'], ['label' => 'Szerkesztő']);
        $user  = Role::firstOrCreate(['name' => 'user'], ['label' => 'Felhasználó']);

        $admin->permissions()->sync($permissions->pluck('id'));
        $mod->permissions()->sync(
            $permissions->whereIn('name', [
                'view-vehicles',
                'view-gallery',
                'edit-gallery',
                'approve-gallery',
            ])->pluck('id')
        );

        $user->permissions()->sync(
            $permissions->whereIn('name', [
                'view-vehicles',
                'view-gallery',
            ])->pluck('id')
        );
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@test.hu'],
            [
                'name'     => 'Admin',
                'password' => Hash::make('password2026'),
            ]
        );
        if (!$adminUser->roles->contains($admin->id)) {
            $adminUser->roles()->attach($admin);
        }
    }
}

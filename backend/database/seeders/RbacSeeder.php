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
            ['name' => 'manage-users',         'description' => 'Felhasználók kezelése'],
            ['name' => 'edit-vehicles',        'description' => 'Járművek szerkesztése'],
            ['name' => 'delete-vehicles',      'description' => 'Járművek törlése'],
            ['name' => 'manage-roles',         'description' => 'Szerepkörök kezelése'],
            ['name' => 'view-gallery',         'description' => 'Galéria megtekintése'],
            ['name' => 'edit-gallery',         'description' => 'Galéria szerkesztése'],
            ['name' => 'approve-gallery',      'description' => 'Galéria posztok jóváhagyása'],
            ['name' => 'view-permission',      'description' => 'Jogosultságok megtekintése'],
            ['name' => 'view-admin-panel',     'description' => 'Admin menüpontok megjelenítése'],
            ['name' => 'approve-suggestions',  'description' => 'Javaslatok kezelése'],
            ['name' => 'stat-view',            'description' => 'Statisztika megtekintése'],
            ['name' => 'glossary-edit',        'description' => 'Szójegyzék kezelése'],
            ['name' => 'manage-vehicle-types', 'description' => 'Típusok műveletének hozzáférése'],
        ])->map(function ($p) {
            return Permission::firstOrCreate(['name' => $p['name']], $p);
        });

        $bossadmin = Role::firstOrCreate(['name' => 'bossadmin'], ['label' => 'Főadmin']);
        $admin = Role::firstOrCreate(['name' => 'admin'], ['label' => 'Admin']);
        $mod   = Role::firstOrCreate(['name' => 'moderator'], ['label' => 'Moderátor']);
        $editor = Role::firstOrCreate(['name' => 'editor'], ['label' => 'Szerkesztő']);
        $user  = Role::firstOrCreate(['name' => 'user'], ['label' => 'Felhasználó']);

        $bossadmin->permissions()->sync($permissions->pluck('id'));
        $admin->permissions()->sync(
            $permissions->whereIn('name', [
                'manage-users',
                'edit-vehicles',
                'delete-vehicles',
                'view-gallery',
                'edit-gallery',
                'approve-gallery',
                'view-admin-panel',
                'approve-suggestions',
                'stat-view',
                'glossary-edit',
            ])->pluck('id')
        );
        $mod->permissions()->sync(
            $permissions->whereIn('name', [
                'view-vehicles',
                'view-gallery',
                'edit-gallery',
                'approve-gallery',
            ])->pluck('id')
        );

        $editor->permissions()->sync(
            $permissions->whereIn('name', [
                'edit-vehicles',
                'delete-vehicles',
                'view-gallery',
                'edit-gallery',
                'approve-gallery',
                'view-admin-panel',
                'stat-view',
                'glossary-edit',
            ])->pluck('id')
        );

        $user->permissions()->sync(
            $permissions->whereIn('name', [
                'view-vehicles',
                'view-gallery',
            ])->pluck('id')
        );
        $bossadminUser = User::firstOrCreate(
            ['email' => 'admin@test.hu'],
            [
                'name'     => 'Admin',
                'password' => Hash::make('password2026'),
            ]
        );
        if (!$bossadminUser->roles->contains($bossadmin->id)) {
            $bossadminUser->roles()->attach($bossadmin);
        }
        $admin = User::firstOrCreate(
            ['email' => 'admin@ekke2.hu'],
            [
                'name'     => 'Gáspár Admin',
                'password' => Hash::make('password2026'),
            ]
        );
        $admin->roles()->sync([$admin->id, $user->id]);

        $editor = User::firstOrCreate(
            ['email' => 'admin@admin.hu'],
            [
                'name'     => 'Kis Pista',
                'password' => Hash::make('password2026'),
            ]
        );
        $editor->roles()->sync([$user->id]);
    }
}

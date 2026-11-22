<?php

namespace Tests\Feature;

use App\Models\LocomotiveType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\ServiceLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LocomotiveApiTest extends TestCase
{
    use RefreshDatabase;
    private function createAdminUser(): User
    {
        $user = User::factory()->create();
        $role = Role::firstOrCreate(['name' => 'admin2'], ['label' => 'Admin2']);
        $permission = Permission::firstOrCreate(['name' => 'edit-vehicles',   'description' => 'Járművek szerkesztése']);

        $role->permissions()->attach($permission->id);
        $user->roles()->attach($role->id);

        return $user;
    }

    #[Test]
    public function vendeg_nem_tud_uj_mozdonyt_letrehozni()
    {
        $response = $this->postJson('/api/locomotives', [
            'uic' => '91550470001-1',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('locomotives', [
            'uic' => '91550470001-1',
        ]);
    }

    #[Test]
    public function admin_letre_tud_hozni_uj_mozdonyt()
    {
        $adminUser = $this->createAdminUser();
        $type = LocomotiveType::create(['type_number' => 'START V43', 'name' => 'V43', 'description' => 'V43 típusú mozdony', 'vmax' => 120]);
        $location = ServiceLocation::create(['name' => 'Budapest-Ferencváros']);

        $payload = [
            'uic' => '91550470001-3',
            'locomotive_type_id' => $type->id,
            'service_location_id' => $location->id,
            'is_active' => true,
        ];

        $response = $this->actingAs($adminUser, 'sanctum')
            ->postJson('/api/locomotives', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('locomotives', [
            'uic' => '91550470001-3',
        ]);
    }

    #[Test]
    public function hianyzik_a_kotelezo_uic_azonosito_hibat_dob()
    {
        $adminUser = $this->createAdminUser();

        $response = $this->actingAs($adminUser, 'sanctum')
            ->postJson('/api/locomotives', [
                'is_active' => true,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['uic']);
    }
}

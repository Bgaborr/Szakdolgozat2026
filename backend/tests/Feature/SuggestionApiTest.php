<?php

namespace Tests\Feature;

use App\Models\Locomotive;
use App\Models\LocomotiveType;
use App\Models\ServiceLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SuggestionApiTest extends TestCase
{
    use RefreshDatabase;
    #[Test]
    public function felhasznalo_tud_modositasi_javaslatot_bekuldeni_mozdonyhoz()
    {
        $user = User::factory()->create();
        $type = LocomotiveType::create(['type_number' => 'START V43', 'name' => 'V43', 'description' => 'V43 típusú mozdony', 'vmax' => 120]);
        $location = ServiceLocation::create(['name' => 'Budapest-Ferencváros']);

        $locomotive = Locomotive::create([
            'uic' => '91550431001-3',
            'locomotive_type_id' => $type->id,
            'service_location_id' => $location->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/locomotives/{$locomotive->id}/suggestions", [
                'suggested_data' => [
                    'is_active' => false,
                    'comment' => 'Selejtezésre vár',
                ],
                'source' => 'saját forrás',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('suggestions', [
            'user_id' => $user->id,
            'suggestable_type' => Locomotive::class,
            'suggestable_id' => $locomotive->id,
            'status' => 'Pending',
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GalleryApiTest extends TestCase
{
    use RefreshDatabase;
    #[Test]
    public function regisztralt_felhasznalo_tud_kepet_feltolteni_moderaciora()
    {

        Storage::fake('public');

        $user = User::factory()->create();
        $fakeImage = new UploadedFile(
            base_path('tests/red.jpg'),
            'red.jpg',
            'image/jpeg',
            null,
            true
        );

        $response = $this->actingAs($user, 'sanctum')
            ->withHeader('Accept', 'application/json')
            ->post('/api/gallery', [
                'title' => 'V43 1001 Egerben',
                'description' => 'Reggeli személyvonattal',
                'vehicle_category' => 'locomotive',
                'image' => $fakeImage,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('gallery_posts', [
            'title' => 'V43 1001 Egerben',
            'user_id' => $user->id,
            'is_approved' => 0,
        ]);
    }
}

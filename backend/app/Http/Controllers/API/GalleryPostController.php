<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Concerns\ChecksPermissions;
use App\Http\Controllers\Controller;
use App\Models\GalleryPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class GalleryPostController extends Controller
{
    use ChecksPermissions;

    private const CATEGORIES = ['locomotive', 'passenger_car', 'multiple_unit'];

    private const RATIOS = [16 / 9, 4 / 3];
    private const RATIO_TOLERANCE = 0.04;
    public function index(): JsonResponse
    {
        $posts = GalleryPost::with('user:id,name')
            ->where('is_approved', true)
            ->latest()
            ->get();

        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->hasFile('image') && !$request->file('image')->isValid()) {
            return response()->json([
                'message' => 'A kép feltöltése nem sikerült: ' . $request->file('image')->getErrorMessage(),
            ], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'vehicle_category' => ['required', Rule::in(self::CATEGORIES)],
            'image' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg',
                'max:10240',
                'dimensions:min_width=600',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $size = @getimagesize($value->getRealPath());
                    if (!$size || $size[1] === 0) {
                        return;
                    }
                    $ratio = $size[0] / $size[1];
                    foreach (self::RATIOS as $allowed) {
                        if (abs($ratio - $allowed) / $allowed <= self::RATIO_TOLERANCE) {
                            return;
                        }
                    }
                    $fail('A kép aránya csak 16:9 vagy 4:3 lehet.');
                },
            ],
        ]);

        $path = $request->file('image')->store('gallery', 'public');

        $post = new GalleryPost([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'vehicle_category' => $validated['vehicle_category'],
            'image_path' => $path,
        ]);

        $post->user_id = $user->id;
        $post->save();

        return response()->json([
            'message' => 'Kép sikeresen feltöltve a galériába!',
            'data' => $post->load('user:id,name'),
        ], 201);
    }

    public function getPending(Request $request): JsonResponse
    {
        $this->requirePermission($request, ['approve-gallery']);

        $posts = GalleryPost::with('user:id,name')
            ->where('is_approved', false)
            ->latest()
            ->get();

        return response()->json($posts);
    }
    public function approve(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, ['approve-gallery']);

        $post = GalleryPost::findOrFail($id);
        $post->is_approved = true;
        $post->save();

        return response()->json(['message' => 'A kép sikeresen kikerült a publikus galériába!']);
    }

    public function reject(Request $request, $id): JsonResponse
    {
        $this->requirePermission($request, ['approve-gallery']);

        $post = GalleryPost::findOrFail($id);
        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }
        $post->delete();

        return response()->json(['message' => 'A kép elutasítva és törölve a rendszerből.']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $post = GalleryPost::findOrFail($id);
        $user = $request->user();
        $isOwner = (int) $post->user_id === (int) $user->id;
        $canModerate = $this->userHasAnyPermission($user, ['delete-images', 'approve-gallery']);

        if (!$isOwner && !$canModerate) {
            return response()->json(['message' => 'Nincs jogosultságod ezt a képet törölni!'], 403);
        }

        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }
        $post->delete();

        return response()->json(['message' => 'A kép sikeresen törölve lett a galériából.']);
    }
}

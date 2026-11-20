<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GalleryPost extends Model
{
    protected $fillable = [
        'title',
        'description',
        'user_id',
        'image_path',
        'vehicle_category',
        'is_approved'
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}

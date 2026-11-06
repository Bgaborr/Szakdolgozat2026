<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Suggestion extends Model
{
    protected $fillable = [
        'suggestable_type',
        'suggestable_id',
        'user_id',
        'original_data',
        'suggested_data',
        'source',
        'source_link',
        'status'
    ];

    protected $casts = [
        'original_data' => 'array',
        'suggested_data' => 'array',
    ];

    public function suggestable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

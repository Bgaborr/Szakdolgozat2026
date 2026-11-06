<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PassengerCarSuggestion extends Model
{
    protected $fillable = ['passenger_car_id', 'user_id', 'original_data', 'suggested_data', 'status', 'source', 'source_link'];
    protected $casts = [
        'suggested_data' => 'array',
        'original_data' => 'array',
    ];

    public function car()
    {
        return $this->belongsTo(PassengerCar::class, 'passenger_car_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

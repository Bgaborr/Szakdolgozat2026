<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PassengerCarType extends Model
{
    protected $fillable = [
        'car_category_id',
        'type_number',
        'designation',
        'number_of_seats',
        'vmax',
        'description_id'
    ];

    public function passengerCars()
    {
        return $this->hasMany(PassengerCar::class);
    }
    public function category()
    {
        return $this->belongsTo(CarCategory::class, 'car_category_id');
    }
}

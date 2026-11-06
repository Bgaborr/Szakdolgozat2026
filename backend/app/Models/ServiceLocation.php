<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceLocation extends Model
{
    protected $fillable = ['name'];

    public function passengerCars()
    {
        return $this->hasMany(PassengerCar::class, 'service_location_id');
    }

    public function locomotives()
    {
        return $this->hasMany(Locomotive::class, 'service_location_id');
    }

    public function multipleUnits()
    {
        return $this->hasMany(MultipleUnit::class, 'service_location_id');
    }
}

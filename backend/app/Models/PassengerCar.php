<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PassengerCar extends Model
{
    protected $fillable = [
        'passenger_car_type_id',
        'uic',
        'next_rev_date',
        'home_depot_id',
        'service_location_id',
        'number_of_seats',
        'vmax',
        'is_active',
        'comment'
    ];
    protected $appends = ['formatted_uic'];
    public function type()
    {
        return $this->belongsTo(PassengerCarType::class, 'passenger_car_type_id');
    }
    public function homeDepot()
    {
        return $this->belongsTo(ServiceLocation::class, 'home_depot_id');
    }
    public function serviceLocation()
    {
        return $this->belongsTo(ServiceLocation::class, 'service_location_id');
    }

    public function suggestions()
    {
        return $this->morphMany(Suggestion::class, 'suggestable');
    }
    public function getVmaxAttribute($value)
    {
        if ($value > 0) {
            return $value;
        }
        return $this->type->vmax ?? 0;
    }

    public function getFormattedUicAttribute()
    {
        $uic = preg_replace('/[^0-9]/', '', $this->uic);

        if (strlen($uic) === 12) {
            return substr($uic, 0, 2) . ' ' .
                substr($uic, 2, 2) . ' ' .
                substr($uic, 4, 2) . '-' .
                substr($uic, 6, 2) . ' ' .
                substr($uic, 8, 3) . '-' .
                substr($uic, 11, 1);
        }
        return $this->uic;
    }
}

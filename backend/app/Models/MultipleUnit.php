<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MultipleUnit extends Model
{
    protected $fillable = [
        'multiple_unit_type_id',
        'uic',
        'home_depot_id',
        'service_location_id',
        'next_rev_date',
        'is_active',
        'comment'
    ];
    protected $appends = ['formatted_uic'];
    public function type()
    {
        return $this->belongsTo(MultipleUnitType::class, 'multiple_unit_type_id');
    }

    public function serviceLocation()
    {
        return $this->belongsTo(ServiceLocation::class, 'service_location_id');
    }
    public function homeDepot()
    {
        return $this->belongsTo(ServiceLocation::class, 'home_depot_id');
    }
    public function suggestions()
    {
        return $this->morphMany(Suggestion::class, 'suggestable');
    }
    public function getFormattedUicAttribute()
    {
        $uic = preg_replace('/[^0-9]/', '', $this->uic);

        if (strlen($uic) === 12) {
            return substr($uic, 0, 2) . ' ' .
                substr($uic, 2, 2) . ' ' .
                substr($uic, 4, 4) . ' ' .
                substr($uic, 8, 3) . '-' .
                substr($uic, 11, 1);
        }
        return $this->uic;
    }
}

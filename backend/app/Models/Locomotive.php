<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Locomotive extends Model
{
    protected $fillable = [
        'locomotive_type_id',
        'uic',
        'service_location_id',
        'is_active',
        'comment'
    ];

    protected $appends = ['formatted_uic'];
    public function type()
    {
        return $this->belongsTo(LocomotiveType::class, 'locomotive_type_id');
    }

    public function serviceLocation()
    {
        return $this->belongsTo(ServiceLocation::class, 'service_location_id');
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

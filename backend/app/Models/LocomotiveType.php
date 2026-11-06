<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocomotiveType extends Model
{
    protected $fillable = [
        'type_number',
        'name',
        'vmax',
        'description_id'
    ];

    public function locomotives()
    {
        return $this->hasMany(Locomotive::class, 'locomotive_type_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MultipleUnitType extends Model
{
    protected $fillable = [
        'name',
        'type_number',
        'description_id'
    ];

    public function multipleUnits()
    {
        return $this->hasMany(MultipleUnit::class, 'multiple_unit_type_id');
    }
}

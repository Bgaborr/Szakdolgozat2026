<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public const HIERARCHY = [
        'bossadmin'      => 100,
        'admin'     => 80,
        'moderator' => 50,
        'user'      => 10,
    ];
    protected $fillable = ['name', 'label'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    public function hasPermission(string $permission): bool
    {
        return $this->permissions->pluck('name')->contains($permission);
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LocomotiveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class LocomotivTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(LocomotiveType::orderBy('name')->get());
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MultipleUnitType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultipleUnitTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(MultipleUnitType::orderBy('name')->get());
    }
}

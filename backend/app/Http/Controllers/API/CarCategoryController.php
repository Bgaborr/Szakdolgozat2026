<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CarCategory;
use Illuminate\Http\JsonResponse;

class CarCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(CarCategory::orderBy('name')->get());
    }
}

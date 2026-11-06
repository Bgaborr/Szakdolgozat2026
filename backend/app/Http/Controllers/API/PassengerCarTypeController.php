<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PassengerCarType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Js;

class PassengerCarTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PassengerCarType::with('category')->orderBy('type_number')->get());
    }
}

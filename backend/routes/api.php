<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\GalleryPostController;
use App\Http\Controllers\API\GlossaryController;
use App\Http\Controllers\API\LocomotiveController;
use App\Http\Controllers\API\PermissionController;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\ServiceLocationController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\PassengerCarController;
use App\Http\Controllers\API\PassengerCarTypeController;
use App\Http\Controllers\API\LocomotivTypeController;
use App\Http\Controllers\API\MultipleUnitController;
use App\Http\Controllers\API\MultipleUnitTypeController;
use App\Http\Controllers\API\StatController;
use App\Http\Controllers\API\SuggestionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
        Route::put('/me', [UserController::class, 'updateMe']);
    });

    Route::post('/gallery', [GalleryPostController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'permission:manage-users'])->group(function () {
    Route::apiResource('/users', UserController::class);
    Route::apiResource('/roles', RoleController::class);
    Route::apiResource('/permissions', PermissionController::class);
});

//GET
Route::get('/service-locations', [ServiceLocationController::class, 'index']);
Route::get('/service-locations/{id}', [ServiceLocationController::class, 'show']);

Route::get('/locomotives', [LocomotiveController::class, 'index']);
Route::get('/locomotives/{id}', [LocomotiveController::class, 'show']);

Route::get('/mu', [MultipleUnitController::class, 'index']);
Route::get('/mu/{id}', [MultipleUnitController::class, 'show']);

Route::get('/passenger-cars', [PassengerCarController::class, 'index']);
Route::get('/passenger-cars/{id}', [PassengerCarController::class, 'show']);

Route::get('/passenger-car-types', [PassengerCarTypeController::class, 'index']);
Route::get('/locomotive-types', [LocomotivTypeController::class, 'index']);
Route::get('/mu-types', [MultipleUnitTypeController::class, 'index']);

Route::get('/gallery', [GalleryPostController::class, 'index']);
Route::middleware(['permission:edit-gallery'])->group(function () {
    Route::delete('/gallery/{id}', [GalleryPostController::class, 'destroy']);
});

Route::get('/glossary', [GlossaryController::class, 'index']);

Route::middleware(['auth:sanctum', 'permission:approve-gallery'])->group(function () {
    Route::get('/gallery/pending', [GalleryPostController::class, 'getPending']);
    Route::patch('/gallery/{id}/approve', [GalleryPostController::class, 'approve']);
    Route::delete('/gallery/{id}/reject', [GalleryPostController::class, 'reject']);
});

Route::middleware(['auth:sanctum', 'permission:edit-vehicles'])->group(function () {

    Route::post('/service-locations', [ServiceLocationController::class, 'store']);
    Route::put('/service-locations/{id}', [ServiceLocationController::class, 'update']);
    Route::delete('/service-locations/{id}', [ServiceLocationController::class, 'destroy']);
    //Passenger car 
    Route::post('/passenger-cars', [PassengerCarController::class, 'store']);
    Route::put('/passenger-cars/{id}', [PassengerCarController::class, 'update']);
    Route::delete('/passenger-cars/{id}', [PassengerCarController::class, 'destroy']);
    //Locomotive
    Route::post('/locomotives', [LocomotiveController::class, 'store']);
    Route::put('/locomotives/{id}', [LocomotiveController::class, 'update']);
    Route::delete('/locomotives/{id}', [LocomotiveController::class, 'destroy']);
    //Motorvonat
    Route::post('/mu', [MultipleUnitController::class, 'store']);
    Route::put('/mu/{id}', [MultipleUnitController::class, 'update']);
    Route::delete('/mu/{id}', [MultipleUnitController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:stat-view'])->group(function () {
    Route::get('/stat/locomotives', [StatController::class, 'getLocomotiveStats']);
    Route::get('/stat/passenger-cars', [StatController::class, 'getPassengerCarStats']);
    Route::get('/stat/multiple-units', [StatController::class, 'getMultipleUnitStats']);
});
Route::middleware(['auth:sanctum', 'permission:glossary-edit'])->group(function () {
    Route::post('/glossary', [GlossaryController::class, 'store']);
    Route::put('/glossary/{id}', [GlossaryController::class, 'update']);
    Route::delete('/glossary/{id}', [GlossaryController::class, 'delete']);
});

Route::middleware(['auth:sanctum', 'permission:approve-suggestions'])->group(function () {

    Route::get('/suggestions', [SuggestionController::class, 'index']);
    Route::post('/suggestions/{id}/approve', [SuggestionController::class, 'approve']);
    Route::post('/suggestions/{id}/reject', [SuggestionController::class, 'reject']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/passenger-cars/{id}/suggestions', [PassengerCarController::class, 'storeSuggestion']);
    Route::post('/locomotives/{id}/suggestions', [LocomotiveController::class, 'storeSuggestion']);
    Route::post('/mu/{id}/suggestions', [MultipleUnitController::class, 'storeSuggestion']);
});

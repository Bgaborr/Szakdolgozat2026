<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('passenger_cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passenger_car_type_id')->constrained('passenger_car_types');
            $table->string('uic', 16)->unique();
            $table->date('next_rev_date')->nullable();
            $table->foreignId('home_depot_id')->constrained('service_locations');
            $table->foreignId('service_location_id')->constrained('service_locations');
            $table->boolean('is_active')->default(true);
            $table->string('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('passenger_cars');
    }
};

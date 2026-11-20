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
        Schema::create('passenger_car_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_category_id')->constrained('car_categories');
            $table->string('type_number', 24)->unique();
            $table->string('designation')->nullable();
            $table->string('number_of_seats')->nullable();
            $table->integer('vmax')->nullable();
            $table->bigInteger('description_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('passenger_car_types');
    }
};

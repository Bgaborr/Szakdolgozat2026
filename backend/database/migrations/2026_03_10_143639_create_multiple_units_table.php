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
        Schema::create('multiple_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('multiple_unit_type_id')->constrained('multiple_unit_types');
            $table->string('uic', 16)->unique();
            $table->date('next_rev_date')->nullable();
            $table->foreignId('home_depot_id')->constrained('service_locations');
            $table->foreignId('service_location_id')->constrained('service_locations');
            $table->boolean('is_active')->default(true);
            $table->integer('number_of_seats')->default(0);
            $table->string('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('multiple_units');
    }
};

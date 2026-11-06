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
        Schema::create('locomotives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('locomotive_type_id')->constrained('locomotive_types');
            $table->string('uic', 16)->unique();
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
        Schema::dropIfExists('locomotives');
    }
};

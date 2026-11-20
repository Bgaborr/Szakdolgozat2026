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
        Schema::create('multiple_unit_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_number', 24)->unique();
            $table->string('name');
            $table->integer('number_of_seats')->default(0);
            $table->bigInteger('description_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('multiple_unit_types');
    }
};

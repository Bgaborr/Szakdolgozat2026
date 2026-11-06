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
        Schema::create('locomotive_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_number', 24)->unique();
            $table->string('name');
            $table->string('vmax')->nullable();
            $table->integer('description_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locomotive_types');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('objectives', function (Blueprint $table) {
            $table->id('objective_id');
            $table->string('obj_title')->nullable();
            $table->string('level')->nullable();
            $table->string('description')->nullable();
            $table->string('status')->nullable();
            $table->decimal('progress_percent', 5, 2)->nullable()->default(0);
            $table->foreignId('user_id')->nullable()->constrained('users','user_id')->cascadeOnDelete();
            $table->foreignId('cycle_id')->nullable()->constrained('cycles','cycle_id')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('objectives');
    }
};

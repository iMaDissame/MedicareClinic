<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('video_path')->nullable()->change();

            $table->string('cover_image')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('video_path')->nullable(false)->change();
            $table->string('cover_image')->nullable(false)->change();
        });
    }
};

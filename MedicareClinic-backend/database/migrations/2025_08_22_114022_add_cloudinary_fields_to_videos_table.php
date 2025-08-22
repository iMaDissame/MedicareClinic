<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('cloudinary_public_id')->nullable()->after('video_path');
            $table->string('cloudinary_url')->nullable()->after('cloudinary_public_id');

            $table->string('cover_cloudinary_id')->nullable()->after('cover_image');
            $table->string('cover_cloudinary_url')->nullable()->after('cover_cloudinary_id');


            $table->integer('duration')->nullable()->after('cover_cloudinary_url');
            $table->bigInteger('file_size')->nullable()->after('duration');
        });
    }

    public function down()
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'cloudinary_public_id',
                'cloudinary_url',
                'cover_cloudinary_id',
                'cover_cloudinary_url',
                'duration',
                'file_size'
            ]);
        });
    }
};

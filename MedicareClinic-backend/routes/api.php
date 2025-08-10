<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\VideoController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// User/Student Authentication Routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [UserAuthController::class, 'login']);
    Route::post('logout', [UserAuthController::class, 'logout'])->middleware('auth:api');
    Route::get('me', [UserAuthController::class, 'me'])->middleware('auth:api');
});

// Student Protected Routes
Route::middleware('auth:api')->group(function () {
    Route::get('my-videos', [VideoController::class, 'getUserVideos']);
    Route::get('videos/{video}', [VideoController::class, 'show']);
});

// Admin Authentication Routes
Route::group(['prefix' => 'admin'], function () {
    Route::post('login', [AdminAuthController::class, 'login']);
    Route::post('logout', [AdminAuthController::class, 'logout'])->middleware('auth:admin');
    Route::get('me', [AdminAuthController::class, 'me'])->middleware('auth:admin');
    Route::post('refresh', [AdminAuthController::class, 'refresh'])->middleware('auth:admin');

    // Admin Protected Routes
    Route::middleware('auth:admin')->group(function () {
        // User Management Routes
        Route::get('users/statistics', [UserManagementController::class, 'statistics']);
        Route::get('users', [UserManagementController::class, 'index']);
        Route::post('users', [UserManagementController::class, 'store']);
        Route::get('users/{user}', [UserManagementController::class, 'show']);
        Route::put('users/{user}', [UserManagementController::class, 'update']);
        Route::delete('users/{user}', [UserManagementController::class, 'destroy']);
        Route::patch('users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus']);
        Route::patch('users/{user}/extend-access', [UserManagementController::class, 'extendAccess']);

        // Video Management Routes
        Route::get('videos/statistics', [VideoController::class, 'statistics']);
        Route::get('videos', [VideoController::class, 'index']);
        Route::post('videos', [VideoController::class, 'store']);
        Route::get('videos/{video}', [VideoController::class, 'show']);
        Route::put('videos/{video}', [VideoController::class, 'update']);
        Route::delete('videos/{video}', [VideoController::class, 'destroy']);
        Route::patch('videos/{video}/toggle-publish', [VideoController::class, 'togglePublishStatus']);
        Route::get('categories/{category}/videos', [VideoController::class, 'getByCategory']);

        // Category Management Routes
        Route::get('categories/statistics', [CategoryController::class, 'statistics']);
        Route::get('categories/select-options', [CategoryController::class, 'getAllForSelect']);
        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::get('categories/{category}', [CategoryController::class, 'show']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
        Route::post('categories/{category}/assign-users', [CategoryController::class, 'assignUsers']);
    });
});



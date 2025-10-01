<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CycleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ObjectiveController;
use App\Http\Controllers\MyOKRController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('landingpage');
});

// Landing Page - hiển thị nút đăng nhập
Route::get('/landingpage', function () {
    return view('landingpage');
})->name('landingpage');

Route::group(['middleware' => ['web']], function () {
    // Route xác thực
    Route::get('/login', [AuthController::class, 'redirectToCognito'])->name('login');
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/signup', [AuthController::class, 'redirectToSignup'])->name('auth.signup');
    Route::get('/auth/callback', [AuthController::class, 'handleCallback'])->name('auth.callback');
    Route::get('/auth/forgot', [AuthController::class, 'forgotPassword'])->name('auth.forgot');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

    // Route dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('auth')->name('dashboard');

    //Routes cho Cycle
    Route::resource('cycles', CycleController::class);

    // Routes cho Profile
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/change-password', [App\Http\Controllers\AuthController::class, 'showChangePasswordForm'])->name('change.password.form');
    Route::post('/change-password', [App\Http\Controllers\AuthController::class, 'changePassword'])->name('change.password');

    // Objectives Routes
    Route::resource('objectives', ObjectiveController::class);
    // Route::get('/dashboard', [ObjectiveController::class, 'dashboard'])->name('dashboard');
    Route::get('/objectives/create/tailwind', [ObjectiveController::class, 'createTailwind'])->name('objectives.create.tailwind');

    // My OKR Routes
    Route::get('/my-okr', [MyOKRController::class, 'index'])->middleware('auth')->name('my-okr.index');
});

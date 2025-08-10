<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Admin;

class AdminAuthController extends Controller
{

    /**
     * Get a JWT via given credentials for ADMIN users only.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Determine if login is email or username
        $login_type = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $credentials = [
            $login_type => $request->login,
            'password' => $request->password
        ];

        // Use admin guard specifically
        if (!$token = Auth::guard('admin')->attempt($credentials)) {
            return response()->json(['error' => 'Invalid admin credentials'], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Get the authenticated Admin.
     */
    public function me()
    {
        try {
            $admin = Auth::guard('admin')->user();

            if (!$admin) {
                return response()->json(['error' => 'Admin not found'], 404);
            }

            return response()->json([
                'id' => $admin->id,
                'username' => $admin->username,
                'email' => $admin->email,
                'name' => $admin->name,
                'role' => 'admin' // Explicitly set role as admin
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token is invalid'], 401);
        }
    }

    /**
     * Log the admin out (Invalidate the token).
     */
    public function logout()
    {
        Auth::guard('admin')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        return $this->respondWithToken(Auth::guard('admin')->refresh());
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        $admin = Auth::guard('admin')->user();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('admin')->factory()->getTTL() * 60,
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'email' => $admin->email,
                'name' => $admin->name,
                'role' => 'admin' // Explicitly set as admin
            ]
        ]);
    }
}

<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserAuthController extends Controller
{
    /**
     * Get a JWT via given credentials for CLIENT/USER users only.
     */
    public function login(Request $request)
    {
        try {
            Log::info('User login attempt started', [
                'request_data' => $request->all(),
                'ip' => $request->ip()
            ]);

            $validator = Validator::make($request->all(), [
                'login' => 'required|string',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                Log::warning('User login validation failed', [
                    'errors' => $validator->errors()
                ]);
                return response()->json($validator->errors(), 422);
            }

            // Determine if login is email or username
            $login_type = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

            Log::info('Attempting user login', [
                'login_type' => $login_type,
                'login_value' => $request->login
            ]);

            // First, check if user exists
            $user = User::where($login_type, $request->login)->first();

            if (!$user) {
                Log::warning('User not found', [
                    'login_type' => $login_type,
                    'login_value' => $request->login
                ]);
                return response()->json(['error' => 'User not found'], 404);
            }

            Log::info('User found', ['user_id' => $user->id]);

            // Check password manually first
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Password check failed', ['user_id' => $user->id]);
                return response()->json(['error' => 'Invalid password'], 401);
            }

            Log::info('Password check passed, attempting JWT auth');

            $credentials = [
                $login_type => $request->login,
                'password' => $request->password
            ];

            // Use default api guard for users
            if (!$token = Auth::guard('api')->attempt($credentials)) {
                Log::error('JWT token generation failed', [
                    'guard' => 'api',
                    'credentials_keys' => array_keys($credentials)
                ]);
                return response()->json(['error' => 'Token generation failed'], 401);
            }

            Log::info('User login successful', [
                'user_id' => $user->id,
                'token_length' => strlen($token)
            ]);

            return $this->respondWithToken($token);

        } catch (\Exception $e) {
            Log::error('User login exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Login failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        try {
            Log::info('User me() called');

            $user = Auth::guard('api')->user();

            if (!$user) {
                Log::warning('User not authenticated');
                return response()->json(['error' => 'User not found'], 404);
            }

            Log::info('User authenticated successfully', ['user_id' => $user->id]);

            return response()->json([
                'id' => $user->id,
                'username' => $user->username ?? $user->name,
                'email' => $user->email,
                'name' => $user->name,
                'role' => 'student'
            ]);
        } catch (\Exception $e) {
            Log::error('User me() exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Token is invalid'], 401);
        }
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        try {
            Auth::guard('api')->logout();
            Log::info('User logged out successfully');
            return response()->json(['message' => 'Successfully logged out']);
        } catch (\Exception $e) {
            Log::error('User logout exception', [
                'message' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Logout failed'], 500);
        }
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        try {
            $user = Auth::guard('api')->user();

            if (!$user) {
                Log::error('No user found when responding with token');
                return response()->json(['error' => 'User not found'], 404);
            }

            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username ?? $user->name,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => 'student'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Respond with token exception', [
                'message' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Token response failed'], 500);
        }
    }
}

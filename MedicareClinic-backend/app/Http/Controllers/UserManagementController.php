<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\StudentCredentialsMail;
use Carbon\Carbon;

class UserManagementController extends Controller
{
    /**
     * Display a listing of the users (students only).
     */
    public function index(Request $request)
    {
        try {
            $query = User::query();
            $query = User::with('categories');

            // Filter by status if provided
            if ($request->has('status')) {
                switch ($request->status) {
                    case 'active':
                        $query->withValidAccess();
                        break;
                    case 'inactive':
                        $query->where('is_active', false);
                        break;
                    case 'expired':
                        $query->expired();
                        break;
                    case 'expiring_soon':
                        $query->expiringSoon();
                        break;
                }
            }

            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('username', 'like', "%{$search}%")
                      ->orWhere('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $users = $query->latest()->paginate($perPage);

            // Add computed fields
            $users->getCollection()->transform(function ($user) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'access_start' => $user->access_start ? $user->access_start->format('Y-m-d') : null,
                    'access_end' => $user->access_end ? $user->access_end->format('Y-m-d') : null,
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                    'days_remaining' => $user->days_remaining,
                    'has_valid_access' => $user->hasValidAccess(),
                     'categories' => $user->categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name
                    ];
                }),
                    'created_at' => $user->created_at->toISOString(),
                    'updated_at' => $user->updated_at->toISOString(),
                ];
            });

            return response()->json($users);

        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch users'], 500);
        }
    }

    /**
     * Get dashboard statistics.
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_students' => User::count(),
                'active_students' => User::withValidAccess()->count(),
                'inactive_students' => User::where('is_active', false)->count(),
                'expired_students' => User::expired()->count(),
                'expiring_soon' => User::expiringSoon(7)->count(),
            ];

            return response()->json($stats);

        } catch (\Exception $e) {
            Log::error('Error fetching statistics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch statistics'], 500);
        }
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users',
                'password' => 'required|string|min:6',
                'access_start' => 'required|date',
                'access_end' => 'required|date|after:access_start',
                'is_active' => 'boolean',
                'category_ids' => 'nullable|array',
                'category_ids.*' => 'exists:categories,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $userData = $request->except(['category_ids']);

            // Store plain password for email before hashing
            $plainPassword = $userData['password'];

            $userData['password'] = Hash::make($userData['password']);
            $userData['name'] = $userData['name'] ?? $userData['username'];
            $userData['is_active'] = $userData['is_active'] ?? true;

            $user = User::create($userData);

            // Assign categories if provided
            if ($request->has('category_ids') && !empty($request->category_ids)) {
                $user->categories()->sync($request->category_ids);
            }

            Log::info('User created successfully', ['user_id' => $user->id]);

            // Send credentials email
            try {
                $frontendUrl = config('app.frontend_url', env('APP_FRONTEND_URL', 'http://localhost:5173'));
                Mail::to($user->email)->send(new StudentCredentialsMail($user, $plainPassword, $frontendUrl));

                Log::info('Credentials email sent successfully', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                $emailStatus = ' and credentials sent via email';
            } catch (\Exception $e) {
                Log::error('Failed to send credentials email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
                $emailStatus = ' but failed to send credentials email';
            }

            return response()->json([
                'message' => 'User created successfully' . $emailStatus,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'access_start' => $user->access_start->format('Y-m-d'),
                    'access_end' => $user->access_end->format('Y-m-d'),
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                    'categories' => $user->categories->map(function ($category) {
                        return [
                            'id' => $category->id,
                            'name' => $category->name
                        ];
                    }),
                    'created_at' => $user->created_at->toISOString(),
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create user'], 500);
        }
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        try {
            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'access_start' => $user->access_start ? $user->access_start->format('Y-m-d') : null,
                'access_end' => $user->access_end ? $user->access_end->format('Y-m-d') : null,
                'is_active' => $user->is_active,
                'access_status' => $user->access_status,
                'days_remaining' => $user->days_remaining,
                'has_valid_access' => $user->hasValidAccess(),
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'sometimes|required|string|max:255',
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|nullable|string|min:6',
                'access_start' => 'sometimes|required|date',
                'access_end' => 'sometimes|required|date|after:access_start',
                'is_active' => 'sometimes|boolean',
                'category_ids' => 'nullable|array',
                'category_ids.*' => 'exists:categories,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $updateData = $request->except(['category_ids']);

            // Hash password if provided
            if (isset($updateData['password'])) {
                $updateData['password'] = Hash::make($updateData['password']);
            }

            $user->update($updateData);

            // Update categories if provided
            if ($request->has('category_ids')) {
                $user->categories()->sync($request->category_ids ?? []);
            }

            Log::info('User updated successfully', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'access_start' => $user->access_start ? $user->access_start->format('Y-m-d') : null,
                    'access_end' => $user->access_end ? $user->access_end->format('Y-m-d') : null,
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                    'categories' => $user->categories->map(function ($category) {
                        return [
                            'id' => $category->id,
                            'name' => $category->name
                        ];
                    }),
                    'updated_at' => $user->updated_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        try {
            $userId = $user->id;
            $username = $user->username;

            $user->delete();

            Log::info('User deleted successfully', [
                'user_id' => $userId,
                'username' => $username
            ]);

            return response()->json([
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete user'], 500);
        }
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(User $user)
    {
        try {
            $user->update(['is_active' => !$user->is_active]);

            Log::info('User status toggled', [
                'user_id' => $user->id,
                'new_status' => $user->is_active ? 'active' : 'inactive'
            ]);

            return response()->json([
                'message' => 'User status updated successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error toggling user status: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update user status'], 500);
        }
    }

    /**
     * Extend user access period.
     */
    public function extendAccess(Request $request, User $user)
    {
        try {
            $validator = Validator::make($request->all(), [
                'extend_days' => 'required|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $currentEnd = $user->access_end ? Carbon::parse($user->access_end) : Carbon::now();
            $newEnd = $currentEnd->addDays($request->extend_days);

            $user->update(['access_end' => $newEnd]);

            Log::info('User access extended', [
                'user_id' => $user->id,
                'extended_days' => $request->extend_days,
                'new_end_date' => $newEnd->format('Y-m-d')
            ]);

            return response()->json([
                'message' => 'Access period extended successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'access_end' => $user->access_end->format('Y-m-d'),
                    'days_remaining' => $user->days_remaining,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error extending user access: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to extend access'], 500);
        }
    }

    /**
 * Assign categories to a user
 */
public function assignCategories(Request $request, User $user)
{
    try {
        $validator = Validator::make($request->all(), [
            'category_ids' => 'array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        // Sync the categories for this user (empty array will remove all categories)
        $user->categories()->sync($request->category_ids ?? []);

        Log::info('Categories assigned to user successfully', [
            'user_id' => $user->id,
            'category_ids' => $request->category_ids ?? []
        ]);

        return response()->json([
            'message' => 'Categories assigned to user successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'assigned_categories' => $user->categories->pluck('name')
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Error assigning categories to user: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to assign categories to user'], 500);
    }
}

    /**
     * Resend credentials email to a user
     */
    public function resendCredentials(Request $request, User $user)
    {
        try {
            if (!$user->email) {
                return response()->json([
                    'error' => 'User does not have an email address'
                ], 400);
            }

            // Generate a new temporary password if requested, or use a default message
            $shouldGenerateNewPassword = $request->input('generate_new_password', false);

            if ($shouldGenerateNewPassword) {
                // Generate a random password
                $newPassword = $this->generateRandomPassword();
                $user->password = Hash::make($newPassword);
                $user->save();

                Log::info('New password generated for user', ['user_id' => $user->id]);
            } else {
                // For security, we can't send the actual password, so generate a new one
                $newPassword = $this->generateRandomPassword();
                $user->password = Hash::make($newPassword);
                $user->save();
            }

            $frontendUrl = config('app.frontend_url', env('APP_FRONTEND_URL', 'http://localhost:5173'));
            Mail::to($user->email)->send(new StudentCredentialsMail($user, $newPassword, $frontendUrl));

            Log::info('Credentials email resent successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'message' => 'Credentials email sent successfully with new password'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to resend credentials email', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to send credentials email'], 500);
        }
    }

    /**
     * Generate a random password
     */
    private function generateRandomPassword($length = 12)
    {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        $characterLength = strlen($characters);

        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[rand(0, $characterLength - 1)];
        }

        return $password;
    }
}

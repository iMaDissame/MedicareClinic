<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
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
                'username' => 'required|string|max:255|unique:users',
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255|unique:users',
                'password' => 'required|string|min:6',
                'access_start' => 'required|date',
                'access_end' => 'required|date|after:access_start',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $userData = $request->all();
            $userData['password'] = Hash::make($userData['password']);
            $userData['name'] = $userData['name'] ?? $userData['username'];

            $user = User::create($userData);

            Log::info('User created successfully', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'access_start' => $user->access_start->format('Y-m-d'),
                    'access_end' => $user->access_end->format('Y-m-d'),
                    'is_active' => $user->is_active,
                    'access_status' => $user->access_status,
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
                'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
                'name' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|nullable|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|nullable|string|min:6',
                'access_start' => 'sometimes|required|date',
                'access_end' => 'sometimes|required|date|after:access_start',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $updateData = $request->all();

            // Hash password if provided
            if (isset($updateData['password'])) {
                $updateData['password'] = Hash::make($updateData['password']);
            }

            $user->update($updateData);

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
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 422);
        }

        // Sync the categories for this user
        $user->categories()->sync($request->category_ids);

        Log::info('Categories assigned to user successfully', [
            'user_id' => $user->id,
            'category_ids' => $request->category_ids
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
}

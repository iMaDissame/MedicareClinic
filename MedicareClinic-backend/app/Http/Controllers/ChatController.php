<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DirectChat;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::guard('api')->user();
        $admin = Auth::guard('admin')->user();

        if ($user) {
            $chats = DirectChat::where('user_id', $user->id)->with('admin', 'messages')->get();
        } else if ($admin) {
            $chats = DirectChat::where('admin_id', $admin->id)->with('user', 'messages')->get();
        } else {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json(['success' => true, 'data' => $chats]);
    }

    // Get messages for a specific chat
    public function show($chatId)
    {
        $chat = DirectChat::with('messages')->findOrFail($chatId);
        return response()->json(['success' => true, 'data' => $chat->messages]);
    }

    // Send a message
    public function sendMessage(Request $request, $chatId)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $chat = DirectChat::findOrFail($chatId);

        $user = Auth::guard('api')->user();
        $admin = Auth::guard('admin')->user();

        if ($user) {
            $senderId = $user->id;
            $senderType = 'user';
        } else if ($admin) {
            $senderId = $admin->id;
            $senderType = 'admin';
        } else {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_id' => $senderId,
            'sender_type' => $senderType,
            'message' => $request->message,
        ]);

        return response()->json(['success' => true, 'data' => $message]);
    }

    // Start a new chat (user initiates)
    public function startChat(Request $request)
    {
        $user = Auth::guard('api')->user();
        $adminId = $request->input('admin_id');

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $chat = DirectChat::firstOrCreate([
            'user_id' => $user->id,
            'admin_id' => $adminId,
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }
}

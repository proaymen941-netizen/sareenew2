<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json(Notification::orderBy('created_at', 'desc')->get());
    }

    public function unread()
    {
        return response()->json(Notification::where('read', false)->get());
    }

    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read' => true]);
        return response()->json($notification);
    }

    public function markAllAsRead()
    {
        Notification::where('read', false)->update(['read' => true]);
        return response()->json(['message' => 'تم تحديث جميع التنبيهات']);
    }
}

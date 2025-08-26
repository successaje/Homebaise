'use client';

import { useState, useEffect } from 'react';
import MagneticEffect from './MagneticEffect';
import { formatCurrency } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'investment' | 'yield' | 'kyc' | 'property' | 'market' | 'community' | 'remittance';
  title: string;
  message: string;
  amount?: number;
  propertyName?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  userId: string;
}

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'yield',
      title: 'Monthly Yield Payment Received',
      message: 'You received a yield payment for Lagos Marina Luxury Apartments',
      amount: 50,
      propertyName: 'Lagos Marina Luxury Apartments',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      read: false,
      actionUrl: '/portfolio',
      priority: 'high'
    },
    {
      id: '2',
      type: 'investment',
      title: 'Investment Confirmed',
      message: 'Your investment in Nairobi Tech Hub has been confirmed',
      amount: 3000,
      propertyName: 'Nairobi Tech Hub Office Complex',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      read: false,
      actionUrl: '/portfolio',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'kyc',
      title: 'KYC Verification Approved',
      message: 'Your identity verification has been approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: true,
      actionUrl: '/profile',
      priority: 'medium'
    },
    {
      id: '4',
      type: 'property',
      title: 'New Property Available',
      message: 'New agricultural investment opportunity in Ghana',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      read: true,
      actionUrl: '/properties',
      priority: 'low'
    },
    {
      id: '5',
      type: 'market',
      title: 'Secondary Market Update',
      message: 'New tokens available for trading in Lagos Marina',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      read: true,
      actionUrl: '/market',
      priority: 'medium'
    },
    {
      id: '6',
      type: 'community',
      title: 'Community Pool Update',
      message: 'New community investment pool launched in Kenya',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
      read: true,
      actionUrl: '/community',
      priority: 'low'
    },
    {
      id: '7',
      type: 'remittance',
      title: 'Remittance Conversion Complete',
      message: 'Your $500 remittance has been converted to property tokens',
      amount: 500,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      read: true,
      actionUrl: '/remittance',
      priority: 'medium'
    }
  ];

  useEffect(() => {
    // Load notifications
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);

    // Simulate real-time notifications
    const interval = setInterval(() => {
      // Simulate new notifications
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'yield',
          title: 'New Yield Payment',
          message: 'You received a yield payment from your investment',
          amount: Math.floor(Math.random() * 100) + 10,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/portfolio',
          priority: 'high'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'investment':
        return '💰';
      case 'yield':
        return '📈';
      case 'kyc':
        return '✅';
      case 'property':
        return '🏠';
      case 'market':
        return '📊';
      case 'community':
        return '👥';
      case 'remittance':
        return '💱';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'investment':
        return 'border-emerald-500/20 bg-emerald-500/10';
      case 'yield':
        return 'border-green-500/20 bg-green-500/10';
      case 'kyc':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'property':
        return 'border-purple-500/20 bg-purple-500/10';
      case 'market':
        return 'border-orange-500/20 bg-orange-500/10';
      case 'community':
        return 'border-pink-500/20 bg-pink-500/10';
      case 'remittance':
        return 'border-cyan-500/20 bg-cyan-500/10';
      default:
        return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <MagneticEffect>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </MagneticEffect>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl mb-2 border transition-all cursor-pointer hover:bg-white/5 ${
                    notification.read ? 'opacity-60' : ''
                  } ${getNotificationColor(notification.type)}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className="text-gray-400 text-xs">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <div className="text-emerald-400 font-semibold text-sm">
                          {formatCurrency(notification.amount)}
                        </div>
                      )}
                      {notification.propertyName && (
                        <div className="text-gray-400 text-xs mt-1">
                          📍 {notification.propertyName}
                        </div>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-400">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => window.location.href = '/notifications'}
              className="w-full text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
} 
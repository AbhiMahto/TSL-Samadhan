import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function SettingsScreen() {
  const { logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    const performLogout = async () => {
      setLoggingOut(true);
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to log out cleanly.');
        } else {
          Alert.alert('Logout Error', 'Failed to log out cleanly.');
        }
      } finally {
        setLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to log out of your session?');
      if (confirm) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to log out of your session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  const settingSections = [
    {
      title: 'Preferences',
      items: [
        { label: 'Push Notifications', value: 'Enabled', icon: 'notifications-outline' },
        { label: 'Dark Mode', value: 'System Default', icon: 'moon-outline' }
      ]
    },
    {
      title: 'Company & Support',
      items: [
        { label: 'Privacy Policy', value: 'View Details', icon: 'document-text-outline' },
        { label: 'Contact IT Support', value: 'support@company.com', icon: 'chatbox-ellipses-outline' }
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-6">
        {/* Settings Options */}
        {settingSections.map((section, idx) => (
          <View key={idx} className="mb-6">
            <Text className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-3 px-1">
              {section.title}
            </Text>

            <View className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between p-4 border-b border-zinc-100 last:border-b-0"
                >
                  <View className="flex-row items-center">
                    <Ionicons name={item.icon as any} size={20} color="#71717a" className="mr-3" />
                    <Text className="text-zinc-800 text-sm font-medium">{item.label}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-zinc-500 text-xs mr-1">{item.value}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#a1a1aa" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* System Details */}


        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
          className="mt-auto mb-6"
        >
          <View className="bg-red-600 rounded-xl py-3.5 items-center justify-center shadow-sm">
            {loggingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="log-out-outline" size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-base tracking-wide">SIGN OUT</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

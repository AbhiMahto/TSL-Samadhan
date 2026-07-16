import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'admin') {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#18181b',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: true,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center mr-2 px-2.5 py-1.5 rounded-lg active:bg-zinc-100"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" className="mr-1" />
            <Text className="text-red-500 font-semibold text-sm">Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="upload-excel"
        options={{
          title: 'Excel Upload Portal',
        }}
      />
      <Stack.Screen
        name="employee-list"
        options={{
          title: 'Employee Registry',
        }}
      />
      <Stack.Screen
        name="employee-details"
        options={{
          title: 'Employee Information',
        }}
      />
    </Stack>
  );
}


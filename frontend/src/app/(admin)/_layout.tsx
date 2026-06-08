import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Route security: Ensure user is logged in and has an Admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (user?.role !== 'admin') {
      router.replace('/(app)/dashboard');
    }
  }, [user, isAuthenticated, router]);

  if (user?.role !== 'admin') {
    return null;
  }

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

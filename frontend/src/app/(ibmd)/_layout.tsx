import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function IbmDLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'ibmd') {
    if (user?.role === 'admin') {
      return <Redirect href="/(admin)/upload-excel" />;
    } else if (user?.role === 'approver') {
      return <Redirect href="/(approver)/dashboard" />;
    } else if (user?.role === 'sales') {
      return <Redirect href="/(sales)/dashboard" />;
    } else {
      return <Redirect href="/(app)/dashboard" />;
    }
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
        name="dashboard"
        options={{
          title: 'IBMD Audit Queue',
          headerShown: false
        }}
      />
    </Stack>
  );
}


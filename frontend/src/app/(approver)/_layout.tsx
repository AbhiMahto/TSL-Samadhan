import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function ApproverLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'approver') {
    if (user?.role === 'admin') {
      return <Redirect href="/(admin)/upload-excel" />;
    } else if (user?.role === 'ibmd') {
      return <Redirect href="/(ibmd)/dashboard" />;
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
          title: 'Approver Action Portal',
          headerShown: false
        }}
      />
    </Stack>
  );
}


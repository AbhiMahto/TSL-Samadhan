import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadSession, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load session on startup
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Listen for auth state changes and redirect
  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const inAdminGroup = segs[0] === '(admin)';

    if (!isAuthenticated) {
      // If not authenticated and not in auth screens, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // If authenticated
      if (inAuthGroup || segs.length === 0 || segs[0] === 'index' || segs[0] === 'explore') {
        // Redirect to admin upload screen if admin, otherwise to employee dashboard
        if (user?.role === 'admin') {
          router.replace('/(admin)/upload-excel');
        } else {
          router.replace('/(app)/dashboard');
        }
      } else if (inAdminGroup && user?.role !== 'admin') {
        // Prevent regular employees from accessing admin pages
        router.replace('/(app)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, segments, user, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50">
        <ActivityIndicator size="large" color="#059669" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

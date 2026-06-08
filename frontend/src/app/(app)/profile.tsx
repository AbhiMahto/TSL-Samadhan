import React from 'react';
import {
  Text,
  View,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const profileItems = [
    { label: 'Employee ID', value: user?.emp_id, icon: 'id-card-outline' },
    { label: 'Full Name', value: user?.name, icon: 'person-outline' },
    { label: 'Email Address', value: user?.email, icon: 'mail-outline' },
    { label: 'Phone Number', value: user?.phone, icon: 'call-outline' },
    { label: 'Department', value: user?.department, icon: 'business-outline' },
    { label: 'Designation', value: user?.designation, icon: 'ribbon-outline' },
    { label: 'Account Status', value: user?.status, icon: 'ellipse', color: '#16a34a' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-6">
        {/* Profile Avatar Card */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-6 items-center mb-6 shadow-sm">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4 bg-green-100 border border-green-200"
          >
            <Text className="text-[#16a34a] text-3xl font-extrabold tracking-wide">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EE'}
            </Text>
          </View>
          <Text className="text-zinc-900 text-xl font-bold">{user?.name}</Text>
          <Text className="text-[#16a34a] text-xs mt-1 uppercase tracking-wider font-semibold">
            {user?.designation}
          </Text>
        </View>

        {/* Profile Fields */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-5 mb-8 shadow-sm">
          <Text className="text-zinc-900 font-bold text-lg mb-4 tracking-wide uppercase border-b border-zinc-200 pb-2">
            Personal Information
          </Text>

          <View className="space-y-4">
            {profileItems.map((item, idx) => (
              <View key={idx} className="flex-row items-center py-2 border-b border-zinc-100 last:border-b-0">
                <View className="bg-zinc-50 p-2.5 rounded-xl mr-4 border border-zinc-200">
                  <Ionicons 
                    name={item.icon as any} 
                    size={18} 
                    color={item.color || '#16a34a'} 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-zinc-500 text-xxs uppercase tracking-wider">{item.label}</Text>
                  <Text className="text-zinc-900 font-semibold text-sm mt-0.5 capitalize">
                    {item.value || 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System Meta Details */}
        <View className="items-center mb-6">
          <Text className="text-zinc-400 text-xxs tracking-widest uppercase">
            Registered on: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

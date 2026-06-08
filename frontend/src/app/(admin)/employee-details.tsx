import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Clipboard,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Employee } from '../../types';

export default function EmployeeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emp_id = params.emp_id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await api.get('/api/employee/all');
        if (response.data && response.data.success) {
          const list: Employee[] = response.data.employees;
          const found = list.find((emp) => emp.emp_id === emp_id);
          if (found) {
            setEmployee(found);
          } else {
            Alert.alert('Error', 'Employee not found in database.');
            router.back();
          }
        }
      } catch (error) {
        console.error('Fetch employee details error:', error);
        Alert.alert('Error', 'Failed to fetch employee details.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (emp_id) {
      fetchEmployeeDetails();
    }
  }, [emp_id, router]);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-zinc-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!employee) return null;

  const detailItems = [
    { label: 'Employee ID', value: employee.emp_id, icon: 'id-card-outline', copyable: true },
    { label: 'Full Name', value: employee.name, icon: 'person-outline', copyable: false },
    { label: 'Email Address', value: employee.email, icon: 'mail-outline', copyable: true },
    { label: 'Phone Number', value: employee.phone, icon: 'call-outline', copyable: true },
    { label: 'Department', value: employee.department, icon: 'business-outline', copyable: false },
    { label: 'Designation', value: employee.designation, icon: 'ribbon-outline', copyable: false },
    { label: 'Status', value: employee.status, icon: 'ellipse', color: '#059669', copyable: false },
    { label: 'First Login Pending', value: employee.firstLogin ? 'Yes (Password Not Configured)' : 'No (Password Set)', icon: 'key-outline', color: employee.firstLogin ? '#d97706' : '#059669', copyable: false }
  ];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-6">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-6"
        >
          <Ionicons name="arrow-back" size={20} color="#059669" />
          <Text className="text-emerald-600 font-semibold text-sm ml-2">Back to Registry</Text>
        </TouchableOpacity>

        {/* Header Profile Circle */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-6 items-center mb-6 shadow-sm">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-emerald-100 border border-emerald-200"
          >
            <Text className="text-emerald-700 text-2xl font-extrabold">
              {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text className="text-zinc-900 text-lg font-bold">{employee.name}</Text>
          <Text className="text-emerald-600 text-xs mt-1 uppercase tracking-wider font-semibold">
            {employee.designation} • {employee.department}
          </Text>
        </View>

        {/* Details Card */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-5 mb-8 shadow-sm">
          <Text className="text-zinc-900 font-bold text-base mb-4 tracking-wide uppercase border-b border-zinc-200 pb-2">
            Record details
          </Text>

          <View className="space-y-4">
            {detailItems.map((item, idx) => (
              <View key={idx} className="flex-row items-center py-2 border-b border-zinc-100 last:border-b-0 justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="bg-zinc-50 p-2.5 rounded-xl mr-4 border border-zinc-200">
                    <Ionicons 
                      name={item.icon as any} 
                      size={18} 
                      color={item.color || '#059669'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-500 text-xxs uppercase tracking-wider">{item.label}</Text>
                    <Text className="text-zinc-900 font-semibold text-sm mt-0.5 capitalize">
                      {item.value || 'N/A'}
                    </Text>
                  </View>
                </View>

                {item.copyable && item.value ? (
                  <TouchableOpacity 
                    onPress={() => copyToClipboard(item.value, item.label)}
                    className="p-2 bg-zinc-50 rounded-xl border border-zinc-200"
                  >
                    <Ionicons name="copy-outline" size={16} color="#059669" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Timestamp Meta */}
        <View className="items-center mb-6">
          <Text className="text-zinc-400 text-xxs tracking-widest uppercase">
            Record Created: {new Date(employee.createdAt).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

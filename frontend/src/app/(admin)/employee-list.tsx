import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Employee } from '../../types';

export default function EmployeeListScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employee/all');
      if (response.data && response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, []);

  // Filter employees when searching
  const filteredEmployees = React.useMemo(() => {
    if (!search) {
      return employees;
    }

    const query = search.toLowerCase();
    return employees.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(query) ||
        emp.emp_id.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.designation.toLowerCase().includes(query)
      );
    });
  }, [search, employees]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-zinc-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#71717a" className="mr-2" />
          <TextInput
            className="flex-1 text-zinc-900 text-base"
            placeholder="Search by ID, name, dept, title..."
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#71717a" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.emp_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="people-outline" size={48} color="#71717a" />
            <Text className="text-zinc-500 mt-4 text-center text-sm font-medium">
              No employees found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(admin)/employee-details',
              params: { emp_id: item.emp_id }
            })}
            activeOpacity={0.8}
            className="bg-white border border-zinc-200 rounded-2xl p-4 mb-4 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-4">
              {/* Avatar circle */}
              <View className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full items-center justify-center mr-4">
                <Text className="text-emerald-700 font-bold text-base">
                  {item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-zinc-900 font-bold text-base" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="bg-emerald-50 px-2 py-0.5 rounded ml-2">
                    <Text className="text-emerald-700 text-xxs font-bold uppercase">{item.emp_id}</Text>
                  </View>
                </View>
                <Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
                  {item.designation} • {item.department}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

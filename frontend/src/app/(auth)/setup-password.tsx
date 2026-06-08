import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function SetupPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setToken = useAuthStore((state) => state.setToken);

  const emp_id = (params.emp_id as string) || '';
  const verificationToken = (params.verificationToken as string) || '';
  const purpose = (params.purpose as string) || 'forgot-password';
  const isFirstTime = purpose === 'first-time-setup';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = isFirstTime ? '/api/auth/setup-password' : '/api/auth/reset-password';
      const response = await api.post(endpoint, {
        password: data.password,
        verificationToken
      });

      if (response.data && response.data.success) {
        if (isFirstTime) {
          // First time users get auto-logged in immediately
          const { token, user } = response.data;
          await setToken(token, user);
          
          if (Platform.OS === 'web') {
            window.alert('Success: Password configured successfully. Welcome!');
          } else {
            Alert.alert('Activation Successful', 'Password configured successfully. Welcome!');
          }
        } else {
          // Reset password sends them back to login screen
          if (Platform.OS === 'web') {
            window.alert('Success: Password reset successful. Please log in.');
          } else {
            Alert.alert('Reset Successful', 'Password reset successful. Please log in.');
          }
          router.replace('/(auth)/login');
        }
      }
    } catch (err: any) {
      console.log('Password configuration error:', err.response?.data);
      const msg = err.response?.data?.message || 'Failed to configure password. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-6 p-2 rounded-full border border-zinc-200 bg-white"
          >
            <Ionicons name="arrow-back" size={20} color="#16a34a" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl items-center justify-center bg-[#16a34a] mb-4">
              <Ionicons name="shield-checkmark-outline" size={36} color="white" />
            </View>
            <Text className="text-2xl font-bold text-zinc-900 tracking-wide text-center">
              {isFirstTime ? 'Setup Secure Password' : 'Reset Password'}
            </Text>
            <Text className="text-zinc-500 mt-2 text-center text-sm px-6">
              Create a secure password for your Employee ID:{' '}
              <Text className="text-zinc-900 font-bold">{emp_id}</Text>. Minimum of 6 characters required.
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            {!!errorMsg && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-xs font-semibold text-center">{errorMsg}</Text>
              </View>
            )}

            {/* Password Field */}
            <View className="mb-4">
              <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                New Password
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                }}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3">
                    <Ionicons name="lock-closed-outline" size={20} color="#71717a" className="mr-3" />
                    <TextInput
                      className="flex-1 text-zinc-900 text-base"
                      placeholder="Enter new password"
                      placeholderTextColor="#a1a1aa"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#71717a"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                Confirm Password
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordVal || 'Passwords do not match'
                }}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3">
                    <Ionicons name="lock-closed-outline" size={20} color="#71717a" className="mr-3" />
                    <TextInput
                      className="flex-1 text-zinc-900 text-base"
                      placeholder="Confirm password"
                      placeholderTextColor="#a1a1aa"
                      secureTextEntry={!showConfirmPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pl-2">
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#71717a"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View className="bg-[#16a34a] rounded-xl py-3.5 items-center justify-center shadow-sm">
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    {isFirstTime ? 'COMPLETE ACTIVATION' : 'RESET PASSWORD'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

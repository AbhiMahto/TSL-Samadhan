import React, { useState, useEffect } from 'react';
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
import api from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Purpose: 'first-time-setup' or 'forgot-password' (defaults to forgot password)
  const purpose = (params.purpose as string) || 'forgot-password';
  const isFirstTime = purpose === 'first-time-setup';

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      emp_id: ''
    }
  });

  // Pre-fill employee ID if passed from another screen
  useEffect(() => {
    if (params.emp_id) {
      setValue('emp_id', params.emp_id as string);
    }
  }, [params.emp_id, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/api/auth/send-otp', {
        emp_id: data.emp_id.trim().toUpperCase(),
        purpose: purpose
      });

      if (response.data && response.data.success) {
        const { sessionInfo, phone, mockOtp, isMock } = response.data;

        const handleProceed = () => {
          router.push({
            pathname: '/(auth)/verify-otp',
            params: {
              emp_id: data.emp_id.trim().toUpperCase(),
              phone,
              sessionInfo,
              purpose,
              mockOtp: mockOtp || ''
            }
          });
        };

        if (Platform.OS === 'web') {
          if (isMock && mockOtp) {
            window.alert(`[Development Mode]\nVerification OTP for testing: ${mockOtp}\nPhone: ${phone}`);
          } else {
            window.alert(`[Verification Code Sent]\nAn OTP verification code has been sent to your registered mobile ending in ${phone.substring(phone.length - 4)}.`);
          }
          handleProceed();
        } else {
          if (isMock && mockOtp) {
            Alert.alert(
              'Development Mode (Mock OTP)',
              `Verification OTP for testing: ${mockOtp}\nPhone: ${phone}`,
              [{ text: 'Proceed to Verify', onPress: handleProceed }]
            );
          } else {
            Alert.alert(
              'Verification Code Sent',
              `An OTP verification code has been sent to your registered mobile ending in ${phone.substring(phone.length - 4)}.`,
              [{ text: 'OK', onPress: handleProceed }]
            );
          }
        }
      }
    } catch (err: any) {
      console.log('Send OTP error response:', err.response?.data);
      const msg = err.response?.data?.message || 'Failed to send OTP. Please check employee ID or server connection.';
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
              <Ionicons
                name={isFirstTime ? 'person-add-outline' : 'key-outline'}
                size={36}
                color="white"
              />
            </View>
            <Text className="text-2xl font-bold text-zinc-900 tracking-wide text-center">
              {isFirstTime ? 'Account Activation' : 'Password Recovery'}
            </Text>
            <Text className="text-zinc-500 mt-2 text-center text-sm px-6">
              {isFirstTime
                ? 'Enter your Employee ID to retrieve your phone number and configure password'
                : 'Enter your Employee ID. We will send an OTP to your registered phone number'}
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            {errorMsg && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-xs font-semibold text-center">{errorMsg}</Text>
              </View>
            )}

            {/* Employee ID Field */}
            <View className="mb-6">
              <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                Employee ID
              </Text>
              <Controller
                control={control}
                rules={{ required: 'Employee ID is required' }}
                name="emp_id"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3">
                    <Ionicons name="person-outline" size={20} color="#71717a" className="mr-3" />
                    <TextInput
                      className="flex-1 text-zinc-900 text-base"
                      placeholder="e.g. EMP1001"
                      placeholderTextColor="#a1a1aa"
                      autoCapitalize="characters"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.emp_id && (
                <Text className="text-red-500 text-xs mt-1 font-medium">{errors.emp_id.message}</Text>
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
                    {isFirstTime ? 'INITIATE SETUP' : 'SEND OTP'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Back to Login */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            className="mt-8 items-center"
          >
            <Text className="text-zinc-500 text-sm font-semibold">
              Remember password? <Text className="text-[#16a34a] font-bold">Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

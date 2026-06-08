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

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Params passed from forgot-password
  const emp_id = (params.emp_id as string) || '';
  const phone = (params.phone as string) || '';
  const initialSession = (params.sessionInfo as string) || '';
  const purpose = (params.purpose as string) || 'forgot-password';
  const initialMockOtp = (params.mockOtp as string) || '';

  const [sessionInfo, setSessionInfo] = useState(initialSession);
  const [currentMockOtp, setCurrentMockOtp] = useState(initialMockOtp);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verification code timer count-down
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000) as any;
    return () => clearInterval(interval);
  }, [timer]);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      code: ''
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/api/auth/verify-otp', {
        emp_id,
        sessionInfo,
        code: data.code,
        purpose
      });

      if (response.data && response.data.success) {
        const { verificationToken } = response.data;
        
        // Navigate to setup/reset password screen with verification token proof
        router.push({
          pathname: '/(auth)/setup-password',
          params: {
            emp_id,
            verificationToken,
            purpose
          }
        });
      }
    } catch (err: any) {
      console.log('Verify OTP error:', err.response?.data);
      const msg = err.response?.data?.message || 'Invalid verification code. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/api/auth/send-otp', {
        emp_id: emp_id,
        purpose: purpose
      });

      if (response.data && response.data.success) {
        const { sessionInfo: newSession, mockOtp, isMock } = response.data;
        setSessionInfo(newSession);
        setTimer(60); // Reset timer
        
        if (isMock && mockOtp) {
          setCurrentMockOtp(mockOtp);
          if (Platform.OS === 'web') {
            window.alert(`[New Mock OTP Sent]\nVerification OTP for testing: ${mockOtp}`);
          } else {
            Alert.alert('New Mock OTP Sent', `Verification OTP for testing: ${mockOtp}`);
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('[OTP Resent]\nA new verification code has been sent to your registered phone number.');
          } else {
            Alert.alert('OTP Resent', 'A new verification code has been sent to your registered phone number.');
          }
        }
      }
    } catch (err: any) {
      console.log('Resend OTP error:', err.response?.data);
      const msg = err.response?.data?.message || 'Failed to resend verification code.';
      setErrorMsg(msg);
    } finally {
      setResending(false);
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
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="white" />
            </View>
            <Text className="text-2xl font-bold text-zinc-900 tracking-wide text-center">Enter Verification Code</Text>
            <Text className="text-zinc-500 mt-2 text-center text-sm px-6">
              We sent a 6-digit security code to your registered mobile number ending in{' '}
              <Text className="text-zinc-900 font-bold">{phone.substring(phone.length - 4)}</Text>
            </Text>

            {currentMockOtp ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4 w-full">
                <Text className="text-[#16a34a] text-xs font-bold text-center uppercase tracking-wider">
                  Test OTP: {currentMockOtp}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Form Card */}
          <View className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            {!!errorMsg && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-600 text-xs font-semibold text-center">{errorMsg}</Text>
              </View>
            )}

            {/* OTP Input Field */}
            <View className="mb-6">
              <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider text-center">
                6-Digit Verification Code
              </Text>
              <Controller
                control={control}
                rules={{ 
                  required: 'Verification code is required',
                  minLength: { value: 6, message: 'Code must be exactly 6 digits' },
                  maxLength: { value: 6, message: 'Code must be exactly 6 digits' }
                }}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row justify-center items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3">
                    <TextInput
                      className="text-zinc-900 text-2xl font-bold text-center tracking-[12] w-full"
                      placeholder="------"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="number-pad"
                      maxLength={6}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoFocus
                    />
                  </View>
                )}
              />
              {errors.code && (
                <Text className="text-red-500 text-xs mt-1 text-center font-medium">{errors.code.message}</Text>
              )}
            </View>

            {/* Resend Button & Timer */}
            <View className="flex-row justify-center items-center mb-6">
              {timer > 0 ? (
                <Text className="text-zinc-500 text-xs font-medium">
                  Resend code in <Text className="text-[#16a34a] font-bold">{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                  {resending ? (
                    <ActivityIndicator size="small" color="#16a34a" />
                  ) : (
                    <Text className="text-[#16a34a] text-xs font-bold underline">
                      Resend Code
                    </Text>
                  )}
                </TouchableOpacity>
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
                  <Text className="text-white font-bold text-base tracking-wide">VERIFY OTP</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Back link */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            className="mt-8 items-center"
          >
            <Text className="text-zinc-500 text-sm font-semibold">
              Cancel and return to <Text className="text-[#16a34a] font-bold">Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

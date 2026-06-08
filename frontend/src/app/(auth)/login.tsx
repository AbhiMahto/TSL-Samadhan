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
  Modal,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const generateRandomCaptcha = () => {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore(state => state.setToken);

  // App states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Plant selector states
  const [plant, setPlant] = useState('TSL');
  const [showPlantPicker, setShowPlantPicker] = useState(false);

  // Captcha states
  const [captchaCode, setCaptchaCode] = useState(() => generateRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Generate random 6-digit captcha
  const generateCaptcha = () => {
    setCaptchaCode(generateRandomCaptcha());
    setCaptchaInput('');
    setCaptchaError(null);
  };

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      emp_id: '',
      password: ''
    }
  });

  const onSubmit = async (data: any) => {
    setErrorMsg(null);
    setCaptchaError(null);

    // Validate CAPTCHA
    if (captchaInput !== captchaCode) {
      setCaptchaError('Incorrect CAPTCHA text.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        emp_id: data.emp_id.trim(),
        password: data.password
      });

      if (response.data && response.data.success) {
        const { token, user } = response.data;
        await setToken(token, user);
      }
    } catch (err: any) {
      console.log('Login error response:', err.response?.data);
      const msg = err.response?.data?.message || 'Connection failed. Please try again.';
      setErrorMsg(msg);

      // If employee is first time, route them to OTP verification setup
      if (err.response?.data?.isFirstLogin) {
        const handleProceed = () => {
          router.push({
            pathname: '/(auth)/forgot-password',
            params: { purpose: 'first-time-setup', emp_id: data.emp_id }
          });
        };

        if (Platform.OS === 'web') {
          const confirm = window.confirm('[First Time Setup Required]\nYou need to verify your phone number and configure a password first. Proceed to configure?');
          if (confirm) {
            handleProceed();
          }
        } else {
          Alert.alert(
            'First Time Setup Required',
            'You need to verify your phone number and configure a password first.',
            [
              {
                text: 'Configure Password',
                onPress: handleProceed
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }
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

          {/* Logo Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-extrabold text-[#16a34a] tracking-widest uppercase font-serif text-center">SAMADHAN</Text>
          </View>

          {/* Form Card */}
          <View className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <Text className="text-zinc-700 text-xs font-bold mb-4 uppercase tracking-wider text-center">Sign-In</Text>

          {/* Divider */}
          <View className="border-b border-zinc-100 mb-6" />

          {/* Error Message */}
          {!!errorMsg && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <Text className="text-red-600 text-xs font-semibold text-center">{errorMsg}</Text>
            </View>
          )}

          {/* Plant Selector */}
          <View className="mb-4">
            <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
              Tata Steel Plant
            </Text>
            <TouchableOpacity
              onPress={() => setShowPlantPicker(true)}
              activeOpacity={0.8}
              className="flex-row items-center bg-white border border-zinc-300 rounded-xl px-4 py-3.5"
            >
              <Ionicons name="business-outline" size={20} color="#71717a" className="mr-3" />
              <Text className="flex-1 text-zinc-900 text-base font-medium">{plant}</Text>
              <Ionicons name="chevron-down" size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Username Field */}
          <View className="mb-4">
            <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
              Username / Employee ID
            </Text>
            <Controller
              control={control}
              rules={{ required: 'Username is required' }}
              name="emp_id"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3.5">
                  <Ionicons name="person-outline" size={20} color="#71717a" className="mr-3" />
                  <TextInput
                    className="flex-1 text-zinc-900 text-base"
                    placeholder="Enter Username"
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

          {/* Password Field */}
          <View className="mb-4">
            <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
              Password
            </Text>
            <Controller
              control={control}
              rules={{ required: 'Password is required' }}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3.5">
                  <Ionicons name="lock-closed-outline" size={20} color="#71717a" className="mr-3" />
                  <TextInput
                    className="flex-1 text-zinc-900 text-base"
                    placeholder="Enter Password"
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

          {/* CAPTCHA SECTION */}
          <View className="mb-6">
            <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
              Security Verification
            </Text>
            <View className="flex-row items-center justify-between bg-zinc-100 border border-zinc-200 px-4 py-3 rounded-xl mb-3">
              <Text className="text-[#353480] text-xl font-bold tracking-[8px] italic line-through decoration-zinc-400">
                {captchaCode}
              </Text>
              <TouchableOpacity onPress={generateCaptcha} className="p-1">
                <Ionicons name="refresh-outline" size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-white border border-zinc-300 focus-within:border-[#16a34a] rounded-xl px-4 py-3.5">
              <Ionicons name="shield-checkmark-outline" size={20} color="#71717a" className="mr-3" />
              <TextInput
                value={captchaInput}
                onChangeText={setCaptchaInput}
                className="flex-1 text-zinc-900 text-base"
                placeholder="Enter CAPTCHA Code"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="none"
                keyboardType="numeric"
              />
            </View>
            {!!captchaError && (
              <Text className="text-red-500 text-xs mt-1 font-semibold">{captchaError}</Text>
            )}
          </View>

          {/* Solid Green Full-Width Sign In Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View className="bg-[#16a34a] rounded-xl py-3.5 items-center justify-center shadow-sm">
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-base tracking-wide uppercase">Sign In</Text>
              )}
            </View>
          </TouchableOpacity>

        </View>

        {/* Under-Card Navigation Helpers */}
        <View className="flex-row justify-between w-full max-w-md px-2 mt-6">
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(auth)/forgot-password',
              params: { purpose: 'forgot-password' }
            })}
          >
            <Text className="text-[#16a34a] text-sm font-bold underline">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(auth)/forgot-password',
              params: { purpose: 'first-time-setup' }
            })}
          >
            <Text className="text-[#16a34a] text-sm font-bold underline">
              Configure Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plant Picker Selector Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showPlantPicker}
          onRequestClose={() => setShowPlantPicker(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/40 justify-center items-center px-6"
            activeOpacity={1}
            onPress={() => setShowPlantPicker(false)}
          >
            <View className="bg-white w-full max-w-sm rounded-2xl p-6 border border-zinc-200 shadow-xl">
              <Text className="text-zinc-900 font-bold text-lg mb-4">Select Tata Steel Plant</Text>

              {['TSL (Tata Steel Limited)', 'TSK (Tata Steel Kalinganagar)', 'TSJ (Tata Steel Jamshedpur)'].map((p) => {
                const val = p.substring(0, 3);
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => {
                      setPlant(val);
                      setShowPlantPicker(false);
                    }}
                    className="py-3.5 border-b border-zinc-100 last:border-b-0 flex-row justify-between items-center"
                  >
                    <Text className="text-zinc-800 text-base font-medium">{p}</Text>
                    {plant === val && (
                      <Ionicons name="checkmark" size={18} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setShowPlantPicker(false)}
                className="mt-6 bg-zinc-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-zinc-700 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </View>
    </ScrollView>
    </KeyboardAvoidingView >
  );
}

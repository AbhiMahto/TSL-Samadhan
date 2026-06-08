import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState<'raise' | 'report' | 'help' | null>(null);

  // Animated slide value from left (-288px to 0)
  const [slideAnim] = useState(() => new Animated.Value(-288));

  // Handle slide-in animation when component becomes visible
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-288);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -288,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const toggleSection = (section: 'raise' | 'report' | 'help') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleSubmenuClick = (item: string) => {
    handleClose();
    Alert.alert(
      item,
      `You selected "${item}" from the menu drawer.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40 justify-start"
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
          }}
          className="w-72 h-full bg-[#1b5e20] py-6"
        >
          {/* Header section with TATA logo and menu toggle */}
          <View className="flex-row justify-between items-center px-5 pb-4 border-b border-[#144c1a]">
            <Image
              source={require('../../../assets/images/tata.png')}
              style={{ width: 65, height: 65 }}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="menu-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Menu Items Container */}
          <View className="flex-1 mt-4">

            {/* Section 1: Raise Request For OCMS */}
            <View className="mb-0.5">
              <TouchableOpacity
                onPress={() => toggleSection('raise')}
                activeOpacity={0.8}
                className={`flex-row items-center px-5 py-3.5 ${expandedSection === 'raise' ? 'bg-[#1e1e1e]' : 'bg-transparent'}`}
              >
                <Ionicons name="document-text-outline" size={20} color="#ffffff" className="mr-3" />
                <Text className="text-white text-base font-semibold flex-1">Raise Request For OCMS</Text>
              </TouchableOpacity>

              {expandedSection === 'raise' && (
                <View className="bg-[#0e83cd]">
                  <TouchableOpacity
                    onPress={() => handleSubmenuClick('Raise Request')}
                    className="py-3 px-12 border-b border-[#ffffff]/10"
                  >
                    <Text className="text-white text-sm font-semibold">Raise Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSubmenuClick('Raise Request on Geo Location')}
                    className="py-3 px-12"
                  >
                    <Text className="text-white text-sm font-semibold">Raise Request on Geo Location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Section 2: Report For OCMS */}
            <View className="mb-0.5">
              <TouchableOpacity
                onPress={() => toggleSection('report')}
                activeOpacity={0.8}
                className={`flex-row items-center px-5 py-3.5 ${expandedSection === 'report' ? 'bg-[#1e1e1e]' : 'bg-transparent'}`}
              >
                <Ionicons name="search-outline" size={20} color="#ffffff" className="mr-3" />
                <Text className="text-white text-base font-semibold flex-1">Report For OCMS</Text>
              </TouchableOpacity>

              {expandedSection === 'report' && (
                <View className="bg-[#0e83cd]">
                  {['MIS for OCMS', 'Pending Requests', 'Dashboard', 'Pending Approval Geo Req'].map((item, idx, arr) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => handleSubmenuClick(item)}
                      className={`py-3 px-12 ${idx < arr.length - 1 ? 'border-b border-[#ffffff]/10' : ''}`}
                    >
                      <Text className="text-white text-sm font-semibold">{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Section 3: Help and support */}
            <View className="mb-0.5">
              <TouchableOpacity
                onPress={() => toggleSection('help')}
                activeOpacity={0.8}
                className={`flex-row items-center px-5 py-3.5 ${expandedSection === 'help' ? 'bg-[#1e1e1e]' : 'bg-transparent'}`}
              >
                <Ionicons name="help-circle-outline" size={20} color="#ffffff" className="mr-3" />
                <Text className="text-white text-base font-semibold flex-1">Help and support</Text>
              </TouchableOpacity>

              {expandedSection === 'help' && (
                <View className="bg-[#f38181]">
                  <TouchableOpacity
                    onPress={() => handleSubmenuClick('Support')}
                    className="py-3 px-12 border-b border-[#ffffff]/10"
                  >
                    <Text className="text-white text-sm font-semibold">Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSubmenuClick('FAQs')}
                    className="py-3 px-12"
                  >
                    <Text className="text-white text-sm font-semibold">FAQs</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Spacer & Divider for Profile & Session */}
            <View className="border-t border-[#ffffff]/20 my-4 mx-5" />

            {/* My Profile Details */}
            <TouchableOpacity
              onPress={() => {
                handleClose();
                router.push('/(app)/profile');
              }}
              className="flex-row items-center px-5 py-3"
            >
              <Ionicons name="person-outline" size={20} color="#ffffff" className="mr-3" />
              <Text className="text-white text-base font-semibold">My Profile Details</Text>
            </TouchableOpacity>

            {/* Logout Session */}
            <TouchableOpacity
              onPress={async () => {
                handleClose();
                await logout();
              }}
              className="flex-row items-center px-5 py-3"
            >
              <Ionicons name="log-out-outline" size={20} color="#fca5a5" className="mr-3" />
              <Text className="text-red-300 text-base font-semibold">Logout Session</Text>
            </TouchableOpacity>

          </View>

          {/* Profile Summary footer */}
          <View className="mt-auto px-5 pt-3 border-t border-[#144c1a] items-center justify-center">
            <Text className="text-white text-xs font-medium mb-1">Powered by</Text>
            <Image
              source={require('../../../assets/images/button_logo-removebg-preview.png')}
              style={{ width: 100, height: 60 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

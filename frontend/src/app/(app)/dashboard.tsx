import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Menu drawer toggle state
  const [menuVisible, setMenuVisible] = useState(false);

  // Accordion drawer state
  const [expandedSection, setExpandedSection] = useState<'raise' | 'report' | 'help' | null>(null);

  // Animated slide value from left (-288px to 0)
  const [slideAnim] = useState(() => new Animated.Value(-288));

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-288);
    }
  }, [menuVisible, slideAnim]);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -288,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const toggleSection = (section: 'raise' | 'report' | 'help') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleSubmenuClick = (item: string) => {
    closeMenu();
    Alert.alert(
      item,
      `You selected "${item}" from the menu drawer.`,
      [{ text: 'OK' }]
    );
  };

  // --- Form states ---
  const [natureOfItems, setNatureOfItems] = useState('');

  // Area Details
  const [location, setLocation] = useState('');
  const [division, setDivision] = useState('');
  const [department, setDepartment] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  // Contact & Approver Details
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState('');
  const [approverPNo, setApproverPNo] = useState('');
  const [approverMailId, setApproverMailId] = useState('');

  // Material Details
  const [itemType, setItemType] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [hazardousItems, setHazardousItems] = useState('No');
  const [umc, setUmc] = useState('');
  const [umcRemarks, setUmcRemarks] = useState('');
  const [alloyType, setAlloyType] = useState('None');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [uom, setUom] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');

  // Attachments
  const [attachment1, setAttachment1] = useState<any>(null);
  const [attachment2, setAttachment2] = useState<any>(null);
  const [attachment3, setAttachment3] = useState<any>(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);

  // Accordion active panel tracker (1 to 5)
  const [activePanel, setActivePanel] = useState<number | null>(1);

  // Reusable bottom picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerCallback, setPickerCallback] = useState<(val: string) => void>(() => () => { });

  const openPicker = (title: string, options: string[], callback: (val: string) => void) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerCallback(() => callback);
    setPickerVisible(true);
  };

  const handleFilePick = async (fileKey: 'attachment1' | 'attachment2' | 'attachment3') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check size limit: 500KB
        if (file.size && file.size > 512000) {
          Alert.alert('File Too Large', 'Please select a file smaller than 500KB.');
          return;
        }

        if (fileKey === 'attachment1') setAttachment1(file);
        else if (fileKey === 'attachment2') setAttachment2(file);
        else if (fileKey === 'attachment3') setAttachment3(file);
      }
    } catch (err) {
      console.log('Document picking error:', err);
    }
  };

  const handleSubmitForm = () => {
    // Validations
    if (!natureOfItems) {
      Alert.alert('Validation Error', 'Please select Nature of Items.');
      setActivePanel(1);
      return;
    }
    if (!location || !division || !department || !pickupLocation.trim()) {
      Alert.alert('Validation Error', 'Please complete all fields in Area Details.');
      setActivePanel(2);
      return;
    }
    if (!contactNumber.trim() || !approverPNo.trim() || !approverMailId.trim()) {
      Alert.alert('Validation Error', 'Please complete all fields in Contact & Approver Details.');
      setActivePanel(3);
      return;
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(approverMailId.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid Approver Mail Id.');
      setActivePanel(3);
      return;
    }
    if (!itemType || !itemCategory || !itemDescription.trim() || !quantity.trim() || !uom || !weight.trim() || !reason) {
      Alert.alert('Validation Error', 'Please complete all required fields in Material Details.');
      setActivePanel(4);
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Request Submitted',
        'Your OCMS Gate Pass Request has been submitted successfully for approval.',
        [{ text: 'OK', onPress: handleResetForm }]
      );
    }, 1500);
  };

  const handleResetForm = () => {
    setNatureOfItems('');
    setLocation('');
    setDivision('');
    setDepartment('');
    setPickupLocation('');
    setContactNumber('');
    setApproverPNo('');
    setApproverMailId('');
    setItemType('');
    setItemCategory('');
    setHazardousItems('No');
    setUmc('');
    setUmcRemarks('');
    setAlloyType('None');
    setItemDescription('');
    setQuantity('');
    setUom('');
    setWeight('');
    setRemarks('');
    setReason('');
    setAttachment1(null);
    setAttachment2(null);
    setAttachment3(null);
    setActivePanel(1);
  };

  const togglePanel = (panelIdx: number) => {
    setActivePanel(prev => prev === panelIdx ? null : panelIdx);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'EE';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={['top', 'left', 'right']}>
      {/* Custom Top Navigation Bar */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-zinc-200">
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="p-2 rounded-xl border border-zinc-100 hover:bg-zinc-50"
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color="#18181b" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-[#16a34a] font-extrabold text-base tracking-widest uppercase font-serif">SAMADHAN</Text>

        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/profile')}
          className="w-9 h-9 rounded-full bg-green-100 border border-green-200 items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-green-800 text-xs font-bold">{getInitials(user?.name)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 px-4 py-5"
      >
        {/* Welcome Banner */}
        <View className="bg-[#16a34a] rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-green-100 text-xs font-semibold uppercase tracking-widest">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Employee'}
          </Text>
          <Text className="text-white text-2xl font-bold mt-1.5 leading-tight">
            Samadhan Services Portal
          </Text>
          <Text className="text-green-100 text-xs mt-2 leading-relaxed">
            Welcome to the Tata Steel Samadhan workspace.
          </Text>
        </View>

        {/* Section 1: Nature of Items */}
        <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={() => togglePanel(1)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <Text className="text-green-800 font-bold text-sm">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-800 font-bold text-base">Nature of Items</Text>
                {activePanel !== 1 && !!natureOfItems && (
                  <Text className="text-zinc-500 text-xs mt-0.5">{natureOfItems}</Text>
                )}
              </View>
            </View>
            <Ionicons name={activePanel === 1 ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
          </TouchableOpacity>

          {activePanel === 1 && (
            <View className="mt-4 pt-4 border-t border-zinc-100">
              <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                Nature of Items *
              </Text>
              <TouchableOpacity
                onPress={() => openPicker('Select Nature of Items', ['Capital Item', 'Revenue Item'], setNatureOfItems)}
                className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
              >
                <Text className={`flex-1 text-base ${natureOfItems ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                  {natureOfItems || '-- Select --'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#71717a" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 2: Area Details */}
        <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={() => togglePanel(2)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <Text className="text-green-800 font-bold text-sm">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-800 font-bold text-base">Area Details</Text>
                {activePanel !== 2 && (!!location || !!division) && (
                  <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                    {[location, division, department].filter(Boolean).join(' • ')}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name={activePanel === 2 ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
          </TouchableOpacity>

          {activePanel === 2 && (
            <View className="mt-4 pt-4 border-t border-zinc-100">
              {/* Location Dropdown */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Location *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Location', ['Jamshedpur', 'Kalinganagar', 'Kharagpur', 'Pune', 'Mumbai', 'Kolkata'], setLocation)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${location ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {location || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Division Dropdown */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Division *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Division', ['Flat Products', 'Long Products', 'Shared Services', 'Corporate Office', 'Raw Materials'], setDivision)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${division ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {division || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Department Dropdown */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Department *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Department', ['IT Services', 'Safety & Emergency', 'Security', 'Maintenance', 'Human Resources', 'Finance'], setDepartment)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${department ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {department || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Pick Up Location */}
              <View className="mb-2">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Pick Up Location *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    className="text-zinc-900 text-base"
                    placeholder="Enter pickup location details"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section 3: Contact & Approver Details */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-5 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={() => togglePanel(3)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <Text className="text-green-800 font-bold text-sm">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-800 font-bold text-base">Contact & Approver Details</Text>
                {activePanel !== 3 && !!contactNumber && (
                  <Text className="text-zinc-500 text-xs mt-0.5">{contactPerson} • {contactNumber}</Text>
                )}
              </View>
            </View>
            <Ionicons name={activePanel === 3 ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
          </TouchableOpacity>

          {activePanel === 3 && (
            <View className="mt-4 pt-4 border-t border-zinc-100">
              {/* Contact Person */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Contact Person *</Text>
                <View className="bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3">
                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    className="text-zinc-800 text-base font-semibold"
                    placeholder="Contact person name"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              </View>

              {/* Contact Number */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Contact Number *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    className="text-zinc-900 text-base"
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>

              {/* User Dept */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">User Dept *</Text>
                <View className="bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3.5">
                  <Text className="text-zinc-600 text-base font-medium">
                    {user?.department || 'IT Services'}
                  </Text>
                </View>
              </View>

              {/* Approver P.No. */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Approver P.No. (IL3 & above) *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={approverPNo}
                    onChangeText={setApproverPNo}
                    className="text-zinc-900 text-base"
                    placeholder="Enter Approver P.No."
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              </View>

              {/* Approver Mail Id */}
              <View className="mb-2">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Approver Mail Id *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={approverMailId}
                    onChangeText={setApproverMailId}
                    className="text-zinc-900 text-base"
                    placeholder="approver@tatasteel.com"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section 4: Material Details */}
        <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={() => togglePanel(4)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <Text className="text-green-800 font-bold text-sm">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-800 font-bold text-base">Material Details</Text>
                {activePanel !== 4 && !!itemType && (
                  <Text className="text-zinc-500 text-xs mt-0.5">{itemType} • {quantity} {uom}</Text>
                )}
              </View>
            </View>
            <Ionicons name={activePanel === 4 ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
          </TouchableOpacity>

          {activePanel === 4 && (
            <View className="mt-4 pt-4 border-t border-zinc-100">
              {/* Item Type */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Item Type *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Item Type', ['Scrap', 'Surplus Material', 'Capital Asset', 'Hazardous Waste', 'Reusable Item'], setItemType)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${itemType ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {itemType || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Item Category */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Item Category *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Item Category', ['Ferrous Scrap', 'Non-Ferrous Scrap', 'Electrical Cable', 'Battery', 'Lubricant / Oil', 'Machinery Spare'], setItemCategory)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${itemCategory ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {itemCategory || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Hazardous Items */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Hazardous Items *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Hazardous Items Status', ['No', 'Yes'], setHazardousItems)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className="flex-1 text-base text-zinc-900 font-medium">
                    {hazardousItems}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* UMC */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">UMC</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={umc}
                    onChangeText={setUmc}
                    className="text-zinc-900 text-base"
                    placeholder="Enter UMC code"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              </View>

              {/* UMC Remarks */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">UMC Remarks</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={umcRemarks}
                    onChangeText={setUmcRemarks}
                    className="text-zinc-900 text-base"
                    placeholder="Enter UMC remarks"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              </View>

              {/* Alloy Type */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Alloy Type *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Alloy Type', ['None', 'Stainless Steel', 'Carbon Steel', 'Copper Alloy', 'Aluminum Alloy'], setAlloyType)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className="flex-1 text-base text-zinc-900 font-medium">
                    {alloyType}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Item Description */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Item Description *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2">
                  <TextInput
                    value={itemDescription}
                    onChangeText={setItemDescription}
                    className="text-zinc-900 text-base"
                    placeholder="Enter detail description of the materials"
                    placeholderTextColor="#a1a1aa"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Quantity */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Quantity *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    className="text-zinc-900 text-base"
                    placeholder="Enter quantity"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* UOM */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">UOM *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Unit of Measure', ['Ton', 'Kilogram (Kg)', 'Pieces', 'Meters', 'Liters'], setUom)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${uom ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {uom || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Weight */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Weight (Kg) *</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3">
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    className="text-zinc-900 text-base"
                    placeholder="Enter weight in Kg"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Remarks */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Remarks</Text>
                <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2">
                  <TextInput
                    value={remarks}
                    onChangeText={setRemarks}
                    className="text-zinc-900 text-base"
                    placeholder="Enter general remarks"
                    placeholderTextColor="#a1a1aa"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Reason */}
              <View className="mb-2">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Reason *</Text>
                <TouchableOpacity
                  onPress={() => openPicker('Select Reason', ['Obsolete', 'Damaged Beyond Repair', 'Surplus Stock', 'Project Leftover', 'Safety Hazard'], setReason)}
                  className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-3.5"
                >
                  <Text className={`flex-1 text-base ${reason ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                    {reason || '-- Select --'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Section 5: Attachments */}
        <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-6 shadow-sm">
          <TouchableOpacity
            onPress={() => togglePanel(5)}
            activeOpacity={0.7}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <Text className="text-green-800 font-bold text-sm">5</Text>
              </View>
              <View className="flex-1">
                <Text className="text-zinc-800 font-bold text-base">Attachments</Text>
                {activePanel !== 5 && (!!attachment1 || !!attachment2 || !!attachment3) && (
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {[attachment1, attachment2, attachment3].filter(Boolean).length} File(s) Selected
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name={activePanel === 5 ? 'chevron-up' : 'chevron-down'} size={20} color="#71717a" />
          </TouchableOpacity>

          {activePanel === 5 && (
            <View className="mt-4 pt-4 border-t border-zinc-100 space-y-4">
              {/* Attachment 1 */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                  {"Write-Off Sanction/Attachment (<500KB) *"}
                </Text>
                {attachment1 ? (
                  <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl p-3">
                    <Ionicons name="document-attach" size={20} color="#16a34a" className="mr-3" />
                    <Text className="flex-1 text-zinc-800 text-sm font-semibold truncate" numberOfLines={1}>
                      {attachment1.name}
                    </Text>
                    <TouchableOpacity onPress={() => setAttachment1(null)}>
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleFilePick('attachment1')}
                    className="flex-row items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 rounded-xl py-4"
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color="#71717a" className="mr-2" />
                    <Text className="text-zinc-600 font-bold text-sm">Choose File</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Attachment 2 */}
              <View className="mb-4">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                  {"Test-Certificate (<500KB)"}
                </Text>
                {attachment2 ? (
                  <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl p-3">
                    <Ionicons name="document-attach" size={20} color="#16a34a" className="mr-3" />
                    <Text className="flex-1 text-zinc-800 text-sm font-semibold truncate" numberOfLines={1}>
                      {attachment2.name}
                    </Text>
                    <TouchableOpacity onPress={() => setAttachment2(null)}>
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleFilePick('attachment2')}
                    className="flex-row items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 rounded-xl py-4"
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color="#71717a" className="mr-2" />
                    <Text className="text-zinc-600 font-bold text-sm">Choose File</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Attachment 3 */}
              <View className="mb-2">
                <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                  {"Photograph (<500KB)"}
                </Text>
                {attachment3 ? (
                  <View className="flex-row items-center bg-green-50 border border-green-200 rounded-xl p-3">
                    <Ionicons name="image-outline" size={20} color="#16a34a" className="mr-3" />
                    <Text className="flex-1 text-zinc-800 text-sm font-semibold truncate" numberOfLines={1}>
                      {attachment3.name}
                    </Text>
                    <TouchableOpacity onPress={() => setAttachment3(null)}>
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleFilePick('attachment3')}
                    className="flex-row items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 rounded-xl py-4"
                  >
                    <Ionicons name="image-outline" size={20} color="#71717a" className="mr-2" />
                    <Text className="text-zinc-600 font-bold text-sm">Choose File</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Solid Green Full-Width Submit Button */}
        <TouchableOpacity
          onPress={handleSubmitForm}
          disabled={submitting}
          activeOpacity={0.8}
          className="mb-8"
        >
          <View className="bg-[#16a34a] rounded-xl py-3.5 items-center justify-center shadow-sm">
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-base tracking-wide uppercase">Submit</Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Slide-out Menu Drawer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-start"
          activeOpacity={1}
          onPress={closeMenu}
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
              <TouchableOpacity onPress={closeMenu}>
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
                  closeMenu();
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
                  closeMenu();
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

      {/* Dropdown Selector Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[70%] p-6 shadow-2xl">
            <Text className="text-zinc-800 font-bold text-lg mb-4 text-center">{pickerTitle}</Text>
            <ScrollView className="space-y-1">
              {pickerOptions.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    pickerCallback(opt);
                    setPickerVisible(false);
                  }}
                  className="py-3.5 border-b border-zinc-100 items-center active:bg-zinc-50"
                >
                  <Text className="text-zinc-800 text-base font-semibold">{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              className="mt-6 bg-zinc-100 py-3.5 rounded-xl items-center"
            >
              <Text className="text-zinc-700 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

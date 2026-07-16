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
  ActivityIndicator,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { GatePassRequest } from '../../types';

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

  // Master Data States
  const [selectedLocation, setSelectedLocation] = useState<{ _id: string, name: string } | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<{ _id: string, name: string } | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<{ _id: string, name: string } | null>(null);

  const [locationOptions, setLocationOptions] = useState<{ _id: string, name: string }[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<{ _id: string, name: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<{ _id: string, name: string }[]>([]);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const fetchLocations = async () => {
    if (loadingLocations) return;
    setLoadingLocations(true);
    try {
      const response = await api.get('/api/master/locations');
      setLocationOptions(response.data);
    } catch (error) {
      console.error('Fetch locations error:', error);
      Alert.alert('Error', 'Unable to load locations. Please try again.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchDivisions = async (locId: string) => {
    setLoadingDivisions(true);
    try {
      const response = await api.get(`/api/master/divisions?locationId=${locId}`);
      setDivisionOptions(response.data);
    } catch (error) {
      console.error('Fetch divisions error:', error);
      Alert.alert('Error', 'Unable to load divisions. Please try again.');
    } finally {
      setLoadingDivisions(false);
    }
  };

  const fetchDepartments = async (divId: string) => {
    setLoadingDepartments(true);
    try {
      const response = await api.get(`/api/master/departments?divisionId=${divId}`);
      setDepartmentOptions(response.data);
    } catch (error) {
      console.error('Fetch departments error:', error);
      Alert.alert('Error', 'Unable to load departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleLocationSelect = (selectedName: string) => {
    const matched = locationOptions.find(opt => opt.name === selectedName);
    if (matched) {
      setSelectedLocation(matched);
      setLocation(matched.name);

      // Reset children
      setSelectedDivision(null);
      setDivision('');
      setSelectedDepartment(null);
      setDepartment('');
      setDivisionOptions([]);
      setDepartmentOptions([]);

      fetchDivisions(matched._id);
    }
  };

  const handleDivisionSelect = (selectedName: string) => {
    const matched = divisionOptions.find(opt => opt.name === selectedName);
    if (matched) {
      setSelectedDivision(matched);
      setDivision(matched.name);

      // Reset child
      setSelectedDepartment(null);
      setDepartment('');
      setDepartmentOptions([]);

      fetchDepartments(matched._id);
    }
  };

  const handleDepartmentSelect = (selectedName: string) => {
    const matched = departmentOptions.find(opt => opt.name === selectedName);
    if (matched) {
      setSelectedDepartment(matched);
      setDepartment(matched.name);
    }
  };

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

  const [activePanel, setActivePanel] = useState<number | null>(1);

  // --- New workflow states ---
  const [activeTab, setActiveTab] = useState<'raise' | 'my_requests'>('raise');
  const [myRequests, setMyRequests] = useState<GatePassRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GatePassRequest | null>(null);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await api.get('/api/requests/my-requests');
      if (response.data && response.data.success) {
        setMyRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Fetch my requests error:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch requests and locations on initial mount
  useEffect(() => {
    fetchMyRequests();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (activeTab === 'my_requests') {
      fetchMyRequests();
    }
  }, [activeTab]);

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

        let base64Uri = '';
        if (Platform.OS === 'web') {
          // Web environment FileReader fallback
          const response = await fetch(file.uri);
          const blob = await response.blob();
          base64Uri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Mobile environment native base64 conversion
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          base64Uri = `data:${file.mimeType || 'image/png'};base64,${base64}`;
        }

        const fileWithUri = {
          name: file.name,
          size: file.size,
          mimeType: file.mimeType || 'image/png',
          uri: base64Uri
        };

        if (fileKey === 'attachment1') setAttachment1(fileWithUri);
        else if (fileKey === 'attachment2') setAttachment2(fileWithUri);
        else if (fileKey === 'attachment3') setAttachment3(fileWithUri);
      }
    } catch (err) {
      console.log('Document picking error:', err);
      Alert.alert('Picking Error', 'Failed to pick or convert the selected file.');
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
    const payload = {
      natureOfItems,
      areaDetails: {
        location,
        locationId: selectedLocation?._id,
        division,
        divisionId: selectedDivision?._id,
        department,
        departmentId: selectedDepartment?._id,
        pickupLocation
      },
      contactDetails: {
        contactPerson,
        contactNumber,
        userDept: user?.department || 'IT Services'
      },
      approverDetails: {
        approverPNo,
        approverMailId
      },
      materialDetails: {
        itemType,
        itemCategory,
        hazardousItems,
        umc,
        umcRemarks,
        alloyType,
        itemDescription,
        quantity,
        uom,
        weight,
        remarks,
        reason
      },
      attachments: {
        attachment1: attachment1 ? { name: attachment1.name, size: attachment1.size, mimeType: attachment1.mimeType, uri: attachment1.uri } : undefined,
        attachment2: attachment2 ? { name: attachment2.name, size: attachment2.size, mimeType: attachment2.mimeType, uri: attachment2.uri } : undefined,
        attachment3: attachment3 ? { name: attachment3.name, size: attachment3.size, mimeType: attachment3.mimeType, uri: attachment3.uri } : undefined
      }
    };

    api.post('/api/requests', payload)
      .then(response => {
        setSubmitting(false);
        if (response.data && response.data.success) {
          Alert.alert(
            'Request Submitted',
            `Your OCMS Gate Pass Request ${response.data.request.requestNo} has been submitted successfully for approval.`,
            [{
              text: 'OK', onPress: () => {
                handleResetForm();
                setActiveTab('my_requests');
                fetchMyRequests();
              }
            }]
          );
        } else {
          Alert.alert('Submission Failed', response.data.message || 'An error occurred.');
        }
      })
      .catch(error => {
        setSubmitting(false);
        console.error('Submit form error:', error);
        Alert.alert('Submission Error', error.response?.data?.message || 'Server connection failed.');
      });
  };

  const handleResetForm = () => {
    setNatureOfItems('');
    setSelectedLocation(null);
    setLocation('');
    setSelectedDivision(null);
    setDivision('');
    setSelectedDepartment(null);
    setDepartment('');
    setDivisionOptions([]);
    setDepartmentOptions([]);
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

  if (!user) {
    return null;
  }

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

        {/* Tab selectors */}
        <View className="flex-row bg-zinc-200 p-1 rounded-xl mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('raise')}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'raise' ? 'bg-white' : 'bg-transparent'}`}
            style={activeTab === 'raise' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}}
          >
            <Text className={`font-bold text-sm ${activeTab === 'raise' ? 'text-green-700' : 'text-zinc-600'}`}>
              Raise Request
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my_requests')}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'my_requests' ? 'bg-white' : 'bg-transparent'}`}
            style={activeTab === 'my_requests' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}}
          >
            <Text className={`font-bold text-sm ${activeTab === 'my_requests' ? 'text-green-700' : 'text-zinc-600'}`}>
              My Requests ({myRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Layouts based on active tab */}
        {activeTab === 'raise' && (
          <>
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
                      disabled={loadingLocations}
                      onPress={() => {
                        if (locationOptions.length === 0) {
                          fetchLocations();
                        }
                        openPicker(
                          'Select Location',
                          locationOptions.map(opt => opt.name),
                          handleLocationSelect
                        );
                      }}
                      className="flex-row items-center bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3.5"
                    >
                      {loadingLocations ? (
                        <ActivityIndicator size="small" color="#059669" className="mr-2" />
                      ) : null}
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
                      disabled={!selectedLocation || loadingDivisions}
                      onPress={() => {
                        if (!selectedLocation) {
                          Alert.alert('Selection Required', 'Please select a Location first.');
                          return;
                        }
                        openPicker(
                          'Select Division',
                          divisionOptions.map(opt => opt.name),
                          handleDivisionSelect
                        );
                      }}
                      className={`flex-row items-center border rounded-xl px-4 py-3.5 ${
                        !selectedLocation ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-50 border-zinc-300'
                      }`}
                      activeOpacity={!selectedLocation ? 1 : 0.7}
                    >
                      {loadingDivisions ? (
                        <ActivityIndicator size="small" color="#059669" className="mr-2" />
                      ) : null}
                      <Text className={`flex-1 text-base ${
                        !selectedLocation ? 'text-zinc-400 italic' : division ? 'text-zinc-900 font-medium' : 'text-zinc-400'
                      }`}>
                        {!selectedLocation ? 'Select Location First' : division || '-- Select --'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={!selectedLocation ? '#a1a1aa' : '#71717a'} />
                    </TouchableOpacity>
                  </View>

                  {/* Department Dropdown */}
                  <View className="mb-4">
                    <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Department *</Text>
                    <TouchableOpacity
                      disabled={!selectedDivision || loadingDepartments}
                      onPress={() => {
                        if (!selectedDivision) {
                          Alert.alert('Selection Required', 'Please select a Division first.');
                          return;
                        }
                        openPicker(
                          'Select Department',
                          departmentOptions.map(opt => opt.name),
                          handleDepartmentSelect
                        );
                      }}
                      className={`flex-row items-center border rounded-xl px-4 py-3.5 ${
                        !selectedDivision ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-50 border-zinc-300'
                      }`}
                      activeOpacity={!selectedDivision ? 1 : 0.7}
                    >
                      {loadingDepartments ? (
                        <ActivityIndicator size="small" color="#059669" className="mr-2" />
                      ) : null}
                      <Text className={`flex-1 text-base ${
                        !selectedDivision ? 'text-zinc-400 italic' : department ? 'text-zinc-900 font-medium' : 'text-zinc-400'
                      }`}>
                        {!selectedDivision ? 'Select Division First' : department || '-- Select --'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={!selectedDivision ? '#a1a1aa' : '#71717a'} />
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
                      onPress={() => openPicker('Select Item Category', ['Aluminium Cables', 'Bearings', 'Conveyors', 'Aluminium', 'Copper', 'Brass', 'Transformers', 'Mechanical M/C Parts', 'Melting Scraps', 'HEMM', 'Plant Machinery', 'Building Structure', 'Utilities', 'Vehicles', 'Scrap Rolls in Materials'], setItemCategory)}
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
              className="mb-8 mt-4"
            >
              <View className="bg-[#16a34a] rounded-xl py-3.5 items-center justify-center shadow-sm">
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide uppercase">Submit</Text>
                )}
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Render Employee My Requests */}
        {activeTab === 'my_requests' && (
          <View className="space-y-4">
            {loadingRequests ? (
              <ActivityIndicator size="large" color="#16a34a" className="my-8" />
            ) : myRequests.length === 0 ? (
              <View className="bg-white border border-zinc-200 rounded-2xl p-8 items-center justify-center">
                <Ionicons name="document-text-outline" size={48} color="#a1a1aa" />
                <Text className="text-zinc-500 text-sm font-semibold mt-4">No Gate Pass Requests found.</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('raise')}
                  className="mt-4 bg-[#16a34a] px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-bold text-xs">Raise New Request</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myRequests.map((req: any) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'pending_approver': return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'pending_ibmd': return 'bg-blue-100 text-blue-800 border-blue-200';
                    case 'pending_sales': return 'bg-purple-100 text-purple-800 border-purple-200';
                    case 'closed': return 'bg-green-100 text-green-800 border-green-200';
                    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
                    default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'pending_approver': return 'Pending Approver';
                    case 'pending_ibmd': return 'Pending IBMD';
                    case 'pending_sales': return 'Pending Sales';
                    case 'closed': return 'Closed / Approved';
                    case 'rejected': return 'Rejected';
                    default: return status;
                  }
                };

                return (
                  <TouchableOpacity
                    key={req._id}
                    onPress={() => setSelectedRequest(req)}
                    className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm active:bg-zinc-50 mb-3"
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-zinc-900 font-extrabold text-base">{req.requestNo}</Text>
                      <Text className="text-zinc-400 text-xs font-semibold">{new Date(req.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-zinc-700 font-bold text-sm mb-1">{req.materialDetails.itemCategory}</Text>
                    <Text className="text-zinc-500 text-xs mb-3" numberOfLines={2}>{req.materialDetails.itemDescription}</Text>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-zinc-600 text-xs font-medium">Qty: {req.materialDetails.quantity} {req.materialDetails.uom}</Text>
                      <View className={`border rounded-lg px-2.5 py-1 ${getStatusColor(req.status)}`}>
                        <Text className="text-xs font-bold">{getStatusLabel(req.status)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

      </ScrollView>

      {/* Detailed Gate Pass Request Modal */}
      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setSelectedRequest(null);
        }}
      >
        <SafeAreaView className="flex-1 bg-zinc-50">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-zinc-200">
            <TouchableOpacity
              onPress={() => {
                setSelectedRequest(null);
              }}
              className="p-1 rounded-full bg-zinc-100"
            >
              <Ionicons name="close-outline" size={24} color="#18181b" />
            </TouchableOpacity>
            <Text className="text-zinc-900 font-extrabold text-base">Request Details</Text>
            <View className="w-8" />
          </View>

          {selectedRequest && (
            <ScrollView className="flex-1 p-5">
              {/* Header Card */}
              <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="text-zinc-900 font-extrabold text-lg">{selectedRequest.requestNo}</Text>
                    <Text className="text-zinc-400 text-xs font-medium mt-0.5">Raised on {new Date(selectedRequest.createdAt).toLocaleString()}</Text>
                  </View>
                  <View className={`border rounded-lg px-3 py-1 ${selectedRequest.status === 'pending_approver' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                      selectedRequest.status === 'pending_ibmd' ? 'bg-blue-100 border-blue-200 text-blue-800' :
                        selectedRequest.status === 'pending_sales' ? 'bg-purple-100 border-purple-200 text-purple-800' :
                          selectedRequest.status === 'closed' ? 'bg-green-100 border-green-200 text-green-800' :
                            'bg-red-100 border-red-200 text-red-800'
                    }`}>
                    <Text className="text-xs font-bold uppercase tracking-wide">
                      {selectedRequest.status === 'pending_approver' && 'Pending Approver'}
                      {selectedRequest.status === 'pending_ibmd' && 'Pending IBMD'}
                      {selectedRequest.status === 'pending_sales' && 'Pending Sales'}
                      {selectedRequest.status === 'closed' && 'Closed'}
                      {selectedRequest.status === 'rejected' && 'Rejected'}
                    </Text>
                  </View>
                </View>

                {/* Lifting Date / DO No indicators */}
                {((selectedRequest as any).liftingDate || (selectedRequest as any).doNo) && (
                  <View className="flex-row flex-wrap border-t border-zinc-100 mt-3 pt-3">
                    {(selectedRequest as any).liftingDate && (
                      <View className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 flex-row items-center mr-3 mb-1">
                        <Ionicons name="calendar-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                        <Text className="text-zinc-750 text-xs font-bold">Lifting Date: {(selectedRequest as any).liftingDate}</Text>
                      </View>
                    )}
                    {(selectedRequest as any).doNo && (
                      <View className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 flex-row items-center mb-1">
                        <Ionicons name="document-text-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                        <Text className="text-zinc-750 text-xs font-bold">DO No: {(selectedRequest as any).doNo}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Stepper progress representation */}
                <View className="flex-row justify-between items-center mt-6 px-1">
                  {[
                    { key: 'pending_approver', label: 'Submit' },
                    { key: 'pending_ibmd', label: 'Approver' },
                    { key: 'pending_sales', label: 'IBMD' },
                    { key: 'closed', label: 'Closed' }
                  ].map((step, idx) => {
                    const isRejected = selectedRequest.status === 'rejected';
                    let isCompleted = false;
                    let isActive = false;

                    if (selectedRequest.status === 'closed') {
                      isCompleted = true;
                    } else if (selectedRequest.status === 'pending_sales') {
                      isCompleted = idx <= 2;
                      isActive = idx === 2;
                    } else if (selectedRequest.status === 'pending_ibmd') {
                      isCompleted = idx <= 1;
                      isActive = idx === 1;
                    } else if (selectedRequest.status === 'pending_approver') {
                      isCompleted = idx <= 0;
                      isActive = idx === 0;
                    }

                    return (
                      <View key={step.key} className="items-center flex-1">
                        <View className="flex-row items-center w-full justify-center">
                          {/* Circle */}
                          <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${isRejected && idx > 0 ? 'border-zinc-200 bg-zinc-100' :
                              isRejected && idx === 0 ? 'border-red-500 bg-red-100' :
                                isCompleted ? 'border-[#16a34a] bg-[#16a34a]' :
                                  isActive ? 'border-[#16a34a] bg-green-50' :
                                    'border-zinc-200 bg-zinc-50'
                            }`}>
                            {isCompleted && !isRejected ? (
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                            ) : isRejected && idx === 0 ? (
                              <Ionicons name="close" size={14} color="#dc2626" />
                            ) : (
                              <Text className={`text-xs font-bold ${isActive ? 'text-[#16a34a]' : 'text-zinc-400'}`}>
                                {idx + 1}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text className={`text-[10px] font-bold mt-1.5 ${isRejected && idx === 0 ? 'text-red-600' :
                            isCompleted ? 'text-zinc-800' :
                              isActive ? 'text-[#16a34a]' :
                                'text-zinc-400'
                          }`}>{isRejected && idx === 0 ? 'Rejected' : step.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Accordion Sections in Details Modal */}
              <View className="space-y-4 mb-12">
                {/* 1. Employee Details */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Employee Information</Text>
                  <View className="space-y-2">
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Name</Text>
                      <Text className="text-zinc-700 text-sm font-bold">{selectedRequest.employeeDetails.name}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Employee ID</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.employeeDetails.emp_id}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Email Address</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.employeeDetails.email}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Nature of Items</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.natureOfItems}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Area Details */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Area Details</Text>
                  <View className="space-y-2">
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Location</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.areaDetails.location}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Division</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.areaDetails.division}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Department</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.areaDetails.department}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Pickup Location</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.areaDetails.pickupLocation}</Text>
                    </View>
                  </View>
                </View>

                {/* 3. Contact & Approver Details */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Contact & Approver Details</Text>
                  <View className="space-y-2">
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Contact Person</Text>
                      <Text className="text-zinc-700 text-sm font-bold">{selectedRequest.contactDetails.contactPerson}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Contact Number</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.contactDetails.contactNumber}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Approver P.No.</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.approverDetails.approverPNo}</Text>
                    </View>
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Approver Mail ID</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.approverDetails.approverMailId}</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Material Details */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Material Details</Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-zinc-400 text-xs font-medium">Item Type</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.itemType}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-zinc-400 text-xs font-medium">Item Category</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.itemCategory}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-zinc-400 text-xs font-medium">Hazardous</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.hazardousItems}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#71717a] text-xs font-medium">Alloy Type</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.alloyType}</Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-zinc-400 text-xs font-medium">Description</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.itemDescription}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-zinc-400 text-xs font-medium">Quantity</Text>
                        <Text className="text-zinc-700 text-sm font-bold">{selectedRequest.materialDetails.quantity} {selectedRequest.materialDetails.uom}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-zinc-400 text-xs font-medium">Weight (Kg)</Text>
                        <Text className="text-zinc-700 text-sm font-bold">{selectedRequest.materialDetails.weight} Kg</Text>
                      </View>
                    </View>
                    {!!selectedRequest.materialDetails.umc && (
                      <View className="mb-2">
                        <Text className="text-zinc-400 text-xs font-medium">UMC Code ({selectedRequest.materialDetails.umc})</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.umcRemarks || 'N/A'}</Text>
                      </View>
                    )}
                    <View className="mb-2">
                      <Text className="text-zinc-400 text-xs font-medium">Reason for gate pass</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.reason}</Text>
                    </View>
                    {!!selectedRequest.materialDetails.remarks && (
                      <View>
                        <Text className="text-zinc-400 text-xs font-medium">Additional Remarks</Text>
                        <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.remarks}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 5. Attachments Section */}
                {selectedRequest.attachments && (Object.keys(selectedRequest.attachments).length > 0) && (
                  <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Attachments</Text>
                    <View className="space-y-4">
                      {Object.entries(selectedRequest.attachments).map(([key, file]: [string, any]) => {
                        if (!file || !file.name) return null;
                        const isImage = file.mimeType && file.mimeType.startsWith('image/');

                        return (
                          <View key={key} className="border border-zinc-100 rounded-xl p-3 bg-zinc-50 mb-3">
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center flex-1 mr-2">
                                <Ionicons
                                  name={isImage ? 'image-outline' : 'document-text-outline'}
                                  size={18}
                                  color="#16a34a"
                                  style={{ marginRight: 8 }}
                                />
                                <Text className="text-zinc-800 text-xs font-bold truncate" numberOfLines={1}>
                                  {file.name}
                                </Text>
                              </View>
                              <Text className="text-zinc-400 text-[10px] font-semibold">
                                {file.size ? `${Math.round(file.size / 1024)} KB` : ''}
                              </Text>
                            </View>

                            {/* Render image if it's base64 or has an actual uri */}
                            {isImage && file.uri ? (
                              <Image
                                source={{ uri: file.uri }}
                                className="w-full h-44 rounded-lg bg-zinc-200"
                                style={{ resizeMode: 'contain' }}
                              />
                            ) : (
                              <View className="py-2 items-center justify-center bg-zinc-100 rounded-lg">
                                <Text className="text-zinc-500 text-[11px] font-medium">Non-image file / Document format</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 6. Workflow Action Log (Timeline) */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-4 uppercase tracking-wider">Workflow Trail</Text>
                  <View className="space-y-4">
                    {selectedRequest.timeline.map((act: any, idx: number) => (
                      <View key={act._id} className="flex-row items-start">
                        {/* Dot indicator */}
                        <View className="items-center mr-3">
                          <View className={`w-3.5 h-3.5 rounded-full border-2 ${act.status === 'rejected' ? 'bg-red-500 border-red-200' :
                              act.status === 'closed' ? 'bg-green-500 border-green-200' :
                                'bg-green-200 border-green-100'
                            }`} />
                          {idx < selectedRequest.timeline.length - 1 && (
                            <View className="w-0.5 h-12 bg-zinc-200 mt-1" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-zinc-800 text-sm font-bold">
                            {act.status === 'pending_approver' && 'Request Submitted'}
                            {act.status === 'pending_ibmd' && 'Approved by Approver'}
                            {act.status === 'pending_sales' && 'Approved by IBMD'}
                            {act.status === 'closed' && 'Closed by Sales'}
                            {act.status === 'rejected' && 'Rejected'}
                          </Text>
                          <Text className="text-zinc-400 text-[10px] font-semibold mt-0.5">{new Date(act.timestamp).toLocaleString()}</Text>
                          <Text className="text-zinc-500 text-xs font-medium mt-1">By: {act.updatedBy.name} ({act.updatedBy.role.toUpperCase()})</Text>
                          {!!act.remarks && (
                            <Text className="text-zinc-600 text-xs bg-zinc-50 border border-zinc-100 rounded-lg p-2 mt-1.5 italic">" {act.remarks} "</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>


              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

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

import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ExcelUploadScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  // Pick Excel file from device storage
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'application/octet-stream'
        ],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Double check extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
          Alert.alert('Invalid File', 'Please select a valid Excel file (.xlsx or .xls).');
          return;
        }

        setSelectedFile(file);
        setUploadResult(null); // Clear previous results
      }
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to pick file from storage.');
    }
  };

  // Upload file to Express server
  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please choose an Excel file to upload.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Construct file upload object based on platform (Web vs Native iOS/Android)
      if (Platform.OS === 'web') {
        if (selectedFile.file) {
          formData.append('file', selectedFile.file);
        } else {
          formData.append('file', selectedFile as any);
        }
      } else {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        } as any);
      }

      console.log('Uploading file:', selectedFile.name);

      const response = await api.post('/api/employee/upload-excel', formData, {
        headers: {
          'Content-Type': undefined // Let Axios auto-detect multi-part boundaries
        }
      });

      if (response.data && response.data.success) {
        setUploadResult(response.data);
        setSelectedFile(null); // Reset selection
        Alert.alert('Upload Successful', response.data.message);
      }
    } catch (error: any) {
      console.error('Upload failed:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Server error occurred during upload.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-6">
        {/* Navigation panel */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.replace('/(app)/dashboard')}
            className="flex-row items-center bg-white border border-zinc-200 px-4 py-2.5 rounded-xl flex-1 mr-2 justify-center shadow-sm"
          >
            <Ionicons name="home-outline" size={16} color="#059669" className="mr-2" />
            <Text className="text-zinc-800 text-xs font-semibold">Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(admin)/employee-list')}
            className="flex-row items-center bg-white border border-zinc-200 px-4 py-2.5 rounded-xl flex-1 ml-2 justify-center shadow-sm"
          >
            <Ionicons name="people-outline" size={16} color="#059669" className="mr-2" />
            <Text className="text-zinc-800 text-xs font-semibold">View Registry</Text>
          </TouchableOpacity>
        </View>

        {/* Upload box */}
        <View className="bg-white border border-zinc-200 rounded-3xl p-6 items-center mb-6 shadow-sm">
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4 bg-emerald-50 shadow-sm">
            <Ionicons name="document-attach-outline" size={32} color="#059669" />
          </View>
          
          <Text className="text-zinc-900 font-bold text-lg mb-1">Import Employee Directory</Text>
          <Text className="text-zinc-500 text-xs text-center px-4 mb-6 leading-relaxed">
            Select a `.xlsx` or `.xls` spreadsheet. The sheet must contain columns: 
            <Text className="text-emerald-600 font-bold"> emp_id, name, phone, email, department, designation</Text>.
          </Text>

          {selectedFile ? (
            <View className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 w-full flex-row items-center justify-between mb-6">
              <View className="flex-row items-center flex-1 mr-4">
                <Ionicons name="document-text" size={24} color="#059669" className="mr-3" />
                <View className="flex-1">
                  <Text className="text-zinc-800 font-semibold text-sm" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text className="text-zinc-400 text-xxs mt-0.5">
                    {(selectedFile.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickFile}
              activeOpacity={0.7}
              className="border-2 border-dashed border-zinc-300 rounded-2xl w-full py-8 items-center justify-center mb-6"
            >
              <Ionicons name="cloud-upload-outline" size={36} color="#059669" />
              <Text className="text-emerald-600 font-bold mt-2 text-sm">Choose Excel File</Text>
            </TouchableOpacity>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleUpload}
            disabled={loading || !selectedFile}
            activeOpacity={0.8}
            className="w-full"
          >
            <View
              className={`${selectedFile ? 'bg-emerald-600' : 'bg-zinc-200'} rounded-xl py-3.5 items-center justify-center shadow-sm`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className={`${selectedFile ? 'text-white' : 'text-zinc-400'} font-bold text-base tracking-wide`}>
                  UPLOAD & IMPORT
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Upload Summary Statistics */}
        {uploadResult && (
          <View className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
            <Text className="text-zinc-900 font-bold text-base mb-4 tracking-wide uppercase border-b border-zinc-200 pb-2">
              Import Summary
            </Text>

            <View className="flex-row justify-between mb-4">
              <View className="items-center flex-1">
                <Text className="text-zinc-500 text-xxs uppercase tracking-wider">Total Rows</Text>
                <Text className="text-zinc-900 font-extrabold text-xl mt-1">
                  {uploadResult.summary?.totalRows}
                </Text>
              </View>
              <View className="items-center flex-1 border-x border-zinc-100">
                <Text className="text-emerald-600 text-xxs uppercase tracking-wider">Imported</Text>
                <Text className="text-emerald-600 font-extrabold text-xl mt-1">
                  {uploadResult.summary?.imported}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-red-600 text-xxs uppercase tracking-wider">Duplicates</Text>
                <Text className="text-red-600 font-extrabold text-xl mt-1">
                  {uploadResult.summary?.skippedDuplicates}
                </Text>
              </View>
            </View>

            {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
              <View className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mt-2">
                <Text className="text-red-600 text-xs font-semibold mb-2">Skipped Duplicate IDs:</Text>
                <ScrollView style={{ maxHeight: 100 }}>
                  {uploadResult.duplicates.map((dup: any, idx: number) => (
                    <Text key={idx} className="text-zinc-500 text-xs mt-1">
                      Row {dup.row}: {dup.emp_id} ({dup.reason})
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

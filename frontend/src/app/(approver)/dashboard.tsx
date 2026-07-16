import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { GatePassRequest } from '../../types';

export default function ApproverDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [pendingRequests, setPendingRequests] = useState<GatePassRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GatePassRequest | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // History Tab States
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [historyRequests, setHistoryRequests] = useState<GatePassRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await api.get('/api/requests/pending');
      if (response.data && response.data.success) {
        setPendingRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchHistoryRequests = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/api/requests/history');
      if (response.data && response.data.success) {
        setHistoryRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Fetch history requests error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchHistoryRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingRequests();
    } else {
      fetchHistoryRequests();
    }
  }, [activeTab]);

  const handleWorkflowAction = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    if (action === 'reject' && !remarksInput.trim()) {
      Alert.alert('Validation Error', 'Please enter remarks/reason for rejection.');
      return;
    }

    const body = { remarks: remarksInput.trim() };
    setActionLoading(true);
    try {
      const endpoint = action === 'approve' 
        ? `/api/requests/${selectedRequest._id}/approver-approve`
        : `/api/requests/${selectedRequest._id}/reject`;

      const response = await api.post(endpoint, body);
      if (response.data && response.data.success) {
        Alert.alert(
          'Action Completed',
          `Request ${selectedRequest.requestNo} has been successfully ${action}d.`,
          [{ text: 'OK', onPress: () => {
            setSelectedRequest(null);
            setRemarksInput('');
            fetchPendingRequests();
            fetchHistoryRequests();
          }}]
        );
      }
    } catch (error: any) {
      console.error('Approver action error response:', error.response?.data || error.message);
      Alert.alert('Action Error', error.response?.data?.message || 'Failed to process request.');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AP';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={['top', 'left', 'right']}>
      {/* Custom Top Navigation Bar */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-zinc-200">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#16a34a" style={{ marginRight: 8 }} />
          <Text className="text-[#16a34a] font-extrabold text-base tracking-widest uppercase font-serif">SAMADHAN</Text>
        </View>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={async () => await logout()}
            className="p-2 mr-2 bg-red-50 rounded-xl"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
          <View className="w-9 h-9 rounded-full bg-green-100 border border-green-200 items-center justify-center">
            <Text className="text-green-800 text-xs font-bold">{getInitials(user?.name)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-4 py-5">
        {/* Tab Switcher */}
        <View className="flex-row bg-zinc-200/60 p-1.5 rounded-xl mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'pending' ? 'bg-white' : 'bg-transparent'}`}
            style={activeTab === 'pending' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}}
          >
            <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-green-700' : 'text-zinc-600'}`}>
              Pending Actions ({pendingRequests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'history' ? 'bg-white' : 'bg-transparent'}`}
            style={activeTab === 'history' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 } : {}}
          >
            <Text className={`font-bold text-sm ${activeTab === 'history' ? 'text-green-700' : 'text-zinc-600'}`}>
              Action History ({historyRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View className="bg-zinc-100 border border-zinc-200 rounded-2xl p-4 mb-6">
          <Text className="text-zinc-800 text-base font-bold">
            {activeTab === 'pending' ? 'Pending Approvals' : 'Action History'}
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">
            {activeTab === 'pending'
              ? 'Below is the list of Gate Pass requests currently awaiting your approval.'
              : 'Below is the list of Gate Pass requests you have previously reviewed and acted on.'}
          </Text>
        </View>

        {/* Requests List */}
        <View className="space-y-4">
          {activeTab === 'pending' ? (
            loadingRequests ? (
              <ActivityIndicator size="large" color="#16a34a" className="my-8" />
            ) : pendingRequests.length === 0 ? (
              <View className="bg-white border border-zinc-200 rounded-2xl p-8 items-center justify-center">
                <Ionicons name="checkmark-circle-outline" size={48} color="#16a34a" />
                <Text className="text-zinc-600 text-sm font-bold mt-4">Inbox Cleared!</Text>
                <Text className="text-zinc-400 text-xs text-center mt-1">No requests are currently pending your action.</Text>
                <TouchableOpacity
                  onPress={fetchPendingRequests}
                  className="mt-4 bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Ionicons name="refresh-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                  <Text className="text-zinc-700 font-bold text-xs">Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <TouchableOpacity
                  key={req._id}
                  onPress={() => setSelectedRequest(req)}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm active:bg-zinc-50 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-zinc-900 font-extrabold text-base">{req.requestNo}</Text>
                    <Text className="text-zinc-400 text-xs font-semibold">{new Date(req.createdAt).toLocaleDateString()}</Text>
                  </View>
                  
                  <View className="mb-2">
                    <Text className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Submitted By</Text>
                    <Text className="text-zinc-700 text-sm font-bold">{req.employeeDetails.name} ({req.employeeDetails.emp_id})</Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Material & Category</Text>
                    <Text className="text-zinc-700 text-sm font-semibold">{req.materialDetails.itemType} - {req.materialDetails.itemCategory}</Text>
                  </View>

                  <View className="border-t border-zinc-100 pt-3 flex-row justify-between items-center">
                    <Text className="text-zinc-500 text-xs font-medium">Qty: {req.materialDetails.quantity} {req.materialDetails.uom}</Text>
                    <Text className="text-[#16a34a] text-xs font-bold flex-row items-center">
                      View details <Ionicons name="arrow-forward" size={12} color="#16a34a" />
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          ) : (
            loadingHistory ? (
              <ActivityIndicator size="large" color="#16a34a" className="my-8" />
            ) : historyRequests.length === 0 ? (
              <View className="bg-white border border-zinc-200 rounded-2xl p-8 items-center justify-center">
                <Ionicons name="document-text-outline" size={48} color="#71717a" />
                <Text className="text-zinc-600 text-sm font-bold mt-4">No History Found</Text>
                <Text className="text-zinc-400 text-xs text-center mt-1">You have not processed any requests yet.</Text>
              </View>
            ) : (
              historyRequests.map((req) => (
                <TouchableOpacity
                  key={req._id}
                  onPress={() => setSelectedRequest(req)}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm active:bg-zinc-50 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center space-x-2">
                      <Text className="text-zinc-900 font-extrabold text-base">{req.requestNo}</Text>
                      <View className={`border rounded-full px-2 py-0.5 ${
                        req.status === 'rejected' ? 'bg-red-50 border-red-100' :
                        req.status === 'closed' ? 'bg-green-50 border-green-100' :
                        'bg-amber-50 border-amber-100'
                      }`}>
                        <Text className={`text-[9px] font-bold uppercase ${
                          req.status === 'rejected' ? 'text-red-700' :
                          req.status === 'closed' ? 'text-green-700' :
                          'text-amber-700'
                        }`}>
                          {req.status === 'pending_approver' && 'Pending Approver'}
                          {req.status === 'pending_ibmd' && 'Pending IBMD'}
                          {req.status === 'pending_sales' && 'Pending Sales'}
                          {req.status === 'closed' && 'Closed'}
                          {req.status === 'rejected' && 'Rejected'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold">{new Date(req.createdAt).toLocaleDateString()}</Text>
                  </View>
                  
                  <View className="mb-2">
                    <Text className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Submitted By</Text>
                    <Text className="text-zinc-700 text-sm font-bold">{req.employeeDetails.name} ({req.employeeDetails.emp_id})</Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">Material & Category</Text>
                    <Text className="text-zinc-700 text-sm font-semibold">{req.materialDetails.itemType} - {req.materialDetails.itemCategory}</Text>
                  </View>

                  <View className="border-t border-zinc-100 pt-3 flex-row justify-between items-center">
                    <Text className="text-zinc-500 text-xs font-medium">Qty: {req.materialDetails.quantity} {req.materialDetails.uom}</Text>
                    <Text className="text-[#16a34a] text-xs font-bold flex-row items-center">
                      View details <Ionicons name="arrow-forward" size={12} color="#16a34a" />
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}
        </View>
      </ScrollView>

      {/* Detailed Modal */}
      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setSelectedRequest(null);
          setRemarksInput('');
        }}
      >
        <SafeAreaView className="flex-1 bg-zinc-50">
          <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-zinc-200">
            <TouchableOpacity
              onPress={() => {
                setSelectedRequest(null);
                setRemarksInput('');
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
              <View className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="text-zinc-900 font-extrabold text-lg">{selectedRequest.requestNo}</Text>
                    <Text className="text-zinc-400 text-xs font-medium mt-0.5">Raised on {new Date(selectedRequest.createdAt).toLocaleString()}</Text>
                  </View>
                  <View className={`border rounded-lg px-3 py-1 ${
                    selectedRequest.status === 'rejected' ? 'bg-red-100 border-red-200' :
                    selectedRequest.status === 'closed' ? 'bg-green-100 border-green-200' :
                    'bg-amber-100 border-amber-200'
                  }`}>
                    <Text className={`text-xs font-bold uppercase tracking-wide ${
                      selectedRequest.status === 'rejected' ? 'text-red-800' :
                      selectedRequest.status === 'closed' ? 'text-green-800' :
                      'text-amber-800'
                    }`}>
                      {selectedRequest.status === 'pending_approver' && 'Pending Approver'}
                      {selectedRequest.status === 'pending_ibmd' && 'Pending IBMD'}
                      {selectedRequest.status === 'pending_sales' && 'Pending Sales'}
                      {selectedRequest.status === 'closed' && 'Closed'}
                      {selectedRequest.status === 'rejected' && 'Rejected'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="space-y-4 mb-12">
                {/* Employee Info */}
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

                {/* Area Details */}
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

                {/* Contact details */}
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

                {/* Material Details */}
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
                    <View>
                      <Text className="text-zinc-400 text-xs font-medium">Reason for gate pass</Text>
                      <Text className="text-zinc-700 text-sm font-semibold">{selectedRequest.materialDetails.reason}</Text>
                    </View>
                  </View>
                </View>

                {/* Attachments Section */}
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

                {/* Workflow Trail / Audit Timeline */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-4">
                  <Text className="text-zinc-900 font-extrabold text-sm mb-4 uppercase tracking-wider">Workflow Trail</Text>
                  <View className="space-y-4">
                    {selectedRequest.timeline.map((act: any, idx: number) => (
                      <View key={act._id || idx} className="flex-row items-start">
                        {/* Dot indicator */}
                        <View className="items-center mr-3">
                          <View className={`w-3.5 h-3.5 rounded-full border-2 ${
                            act.status === 'rejected' ? 'bg-red-500 border-red-200' :
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
                            {act.status === 'closed' && (act.updatedBy.role === 'sales' ? 'Closed by Sales' : act.updatedBy.role === 'ibmd' ? 'Closed by IBMD' : 'Closed')}
                            {act.status === 'rejected' && `Rejected by ${act.updatedBy.role.toUpperCase()}`}
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

                {/* Review Action */}
                {selectedRequest.status === 'pending_approver' && (
                  <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-6">
                    <Text className="text-zinc-900 font-extrabold text-sm mb-3 uppercase tracking-wider">Review Action</Text>
                    
                    <Text className="text-zinc-700 text-xs font-semibold mb-2 uppercase tracking-wider">Remarks / Comments *</Text>
                    <View className="bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2 mb-4">
                      <TextInput
                        value={remarksInput}
                        onChangeText={setRemarksInput}
                        className="text-zinc-900 text-base"
                        placeholder="Enter remarks..."
                        placeholderTextColor="#a1a1aa"
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        onPress={() => handleWorkflowAction('reject')}
                        disabled={actionLoading}
                        className="flex-1 bg-red-600 rounded-xl py-3 items-center justify-center mr-2"
                      >
                        <Text className="text-white font-bold text-sm uppercase tracking-wide">Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleWorkflowAction('approve')}
                        disabled={actionLoading}
                        className="flex-2 bg-[#16a34a] rounded-xl py-3 items-center justify-center flex-[2]"
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text className="text-white font-bold text-sm uppercase tracking-wide text-center">
                            Approve & Forward
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

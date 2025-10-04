import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export const CustomersScreen: React.FC = () => {
  const customers = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      email: 'john@example.com',
      totalVisits: 12,
      lastVisit: '2 days ago',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+1 (555) 234-5678',
      email: 'jane@example.com',
      totalVisits: 8,
      lastVisit: '1 week ago',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      phone: '+1 (555) 345-6789',
      email: 'mike@example.com',
      totalVisits: 3,
      lastVisit: '2 weeks ago',
      status: 'Inactive',
    },
  ];

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Customers</Text>
        <Text className="text-gray-600">
          Manage your customer database
        </Text>
      </View>

      {/* Search and Filter */}
      <View className="px-6 py-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-gray-500 text-sm">Search customers...</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="px-6 py-2">
        <View className="flex-row justify-between">
          <View className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm">
            <Text className="text-2xl font-bold text-blue-600">156</Text>
            <Text className="text-sm text-gray-600">Total Customers</Text>
          </View>
          <View className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm">
            <Text className="text-2xl font-bold text-green-600">89</Text>
            <Text className="text-sm text-gray-600">Active This Month</Text>
          </View>
        </View>
      </View>

      {/* Customers List */}
      <View className="px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Customers</Text>
        {customers.map((customer) => (
          <TouchableOpacity
            key={customer.id}
            className="bg-white rounded-xl p-4 mb-4 shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="font-semibold text-gray-900">{customer.name}</Text>
                <Text className="text-sm text-gray-600">{customer.phone}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(customer.status)}`}>
                <Text className="text-xs font-medium">{customer.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600">{customer.email}</Text>
                <Text className="text-sm text-gray-500">Last visit: {customer.lastVisit}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-medium text-gray-900">{customer.totalVisits} visits</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add New Customer Button */}
      <View className="px-6 py-4">
        <TouchableOpacity className="bg-green-500 rounded-xl py-4" activeOpacity={0.8}>
          <Text className="text-white font-semibold text-center">Add New Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};

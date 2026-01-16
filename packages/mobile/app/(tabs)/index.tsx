import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DashboardScreen from '@/screens/dashboard/Dashboard';


export default function Dashboard() {
  return (
  <SafeAreaProvider>
      <DashboardScreen />
    </SafeAreaProvider>
  )

}


import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DashboardScreen from '@/app/(tabs)/(dashboard)/index';


export default function Dashboard() {
  return (
  <SafeAreaProvider>
      <DashboardScreen />
    </SafeAreaProvider>
  )

}


import React from 'react';
import { SafeAreaView } from 'react-native';
import Dashboard from './src/screens/Dashboard';

const App = () => {
  return (
    <SafeAreaView className="flex-1">
      <Dashboard />
    </SafeAreaView>
  );
};

export default App;

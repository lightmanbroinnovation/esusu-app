import React from 'react';
import { ScrollView, SafeAreaView, Text, View } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';

const HomeScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <ScrollView>
        <UserCard />
        <View className='border flex-row justify-center items-center p-2 rounded-2xl mt-6 bg-[#E5F1FF]'>

        <Text className=" ">➕ New User</Text>
        </View>
<RecentActivity />
        {/* Add more components like KYB, Recent Activity etc here */}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

export default HomeScreen;

// app/components/contributors/ContributorsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchContributors } from '../../services/api';
import { Contributor } from './ContributorsScreen'; // Import the Contributor type

const ContributorListScreen = ({ route }: { route: { params: { duration: string; contributorIds: string[] } } }) => {
  const { duration, contributorIds } = route.params; // Access contributorIds directly
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getContributors = async () => {
      try {
        const allContributors = await fetchContributors("62f2");
        const filteredContributors = allContributors.filter(contributor => contributorIds.includes(contributor.id));
        setContributors(filteredContributors);
      } catch (error) {
        console.error("Error fetching contributors:", error);
      } finally {
        setLoading(false);
      }
    };

    getContributors();
  }, [contributorIds]);

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">{duration} Contributors</Text>
      {loading ? (
        <Text>Loading contributors...</Text>
      ) : (
        <ScrollView>
          {contributors.map((contributor) => (
            <View key={contributor.id} className="bg-gray-100 rounded-xl p-4 mb-4">
              <Text className="font-semibold">{contributor.firstName} {contributor.lastName}</Text>
              <Text>Phone Number: {contributor.phoneNumber}</Text>
              <Text>Deposit Amount: {contributor.depositAmount}</Text>
              <Text>Frequency: {contributor.frequency}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default ContributorListScreen;
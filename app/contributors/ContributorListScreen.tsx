import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Contributor } from './ContributorsScreen'; // Import the Contributor type
import { fetchContributors } from '../../services/api'; // Import fetchContributors

const ContributorListScreen = ({ route }: { route?: { params: { duration: string; contributorIds: string[] } } }) => {
  // Check if route and params are defined
  const { duration = "Unknown", contributorIds = [] } = route?.params || {}; // Fallback to default values

  console.log("Duration:", duration); // Log duration
  console.log("Contributor IDs:", contributorIds); // Log contributor IDs

  const [contributors, setContributors] = useState<Contributor[]>([]); // Initialize with an empty array
  const [loading, setLoading] = useState(true); // Set loading to true initially
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const getContributors = async () => {
      try {
        const allContributors = await fetchContributors("62f2"); // Fetch all contributors
        const filteredContributors = allContributors.filter((contributor: Contributor) => contributorIds.includes(contributor.id)); // Filter based on IDs
        console.log("Filtered Contributors:", filteredContributors); // Log filtered contributors
        setContributors(filteredContributors);
      } catch (err) {
        console.error("Error fetching contributors:", err);
        setError("Failed to load contributors.");
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    getContributors();
  }, [contributorIds]); // Depend on contributorIds

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">{duration} Contributors</Text>
      {loading ? (
        <Text>Loading contributors...</Text>
      ) : error ? (
        <Text className="text-red-500">{error}</Text> // Display error message if any
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
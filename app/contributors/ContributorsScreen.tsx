import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";
import Footer from '../components/Footer';
import { fetchContributors } from '../../services/api';

// Define the Contributor type
export interface Contributor {
  id: string;
  agentName: string;
  agentId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  ninNumber: string;
  language: string;
  depositAmount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  durationValue: number;
  photoUri: string;
}

// Define a union type for frequency keys
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'Other';

const ContributorsScreen = () => {
  const router = useRouter();
  const [allContributors, setAllContributors] = useState<Contributor[]>([]); // Store all contributors
  const [loading, setLoading] = useState(true);
  const agentId = "62f2";

  useEffect(() => {
    const getContributors = async () => {
      try {
        const data = await fetchContributors(agentId);
        setAllContributors(data); // Store all contributors

        // Group contributors by frequency
        const groupedByFrequency = data.reduce((acc: Record<Frequency, Contributor[]>, contributor: Contributor) => {
          const frequency = contributor.frequency as Frequency; // Cast to Frequency type
          if (!acc[frequency]) {
            acc[frequency] = []; // Initialize array if it doesn't exist
          }
          acc[frequency].push(contributor); // Push contributor to the corresponding frequency array
          return acc;
        }, {} as Record<Frequency, Contributor[]>);

        // Log only the duration and contributor IDs for each duration
        Object.keys(groupedByFrequency).forEach((key) => {
          const ids = groupedByFrequency[key].map((contributor: Contributor) => contributor.id); // Explicitly define the type
          console.log(`${key} Contributors IDs:`, ids); // Log each frequency group with IDs
        });

      } catch (error) {
        console.error("Error fetching contributors:", error);
      } finally {
        setLoading(false);
      }
    };

    getContributors();
  }, [agentId]);

  // Define titles and descriptions based on frequency
  const frequencyDetails: Record<Frequency, { title: string; description: string }> = {
    daily: {
      title: "Daily Contributors",
      description: "Contributors who save every day.",
    },
    weekly: {
      title: "Weekly Contributors",
      description: "Contributors who save every week.",
    },
    monthly: {
      title: "Monthly Contributors",
      description: "Contributors who save once a month.",
    },
    yearly: {
      title: "Yearly Contributors",
      description: "Contributors who save once a year.",
    },
    Other: {
      title: "Other Contributors",
      description: "Contributors with unspecified frequency.",
    },
  };

  const handleCardPress = (duration: string) => {
    const contributorIds = allContributors
      .filter(contributor => contributor.frequency === duration)
      .map(contributor => contributor.id); // Extract IDs

    console.log("Navigating to ContributorListScreen with Duration:", duration); // Log duration
    console.log("Contributor IDs:", contributorIds); // Log contributor IDs

    // Pass the selected duration and contributor IDs to the next page
    router.push({
      pathname: '/contributors/ContributorListScreen',
      params: { duration, contributorIds }, // Ensure this is structured correctly
    });
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Contributors</Text>
      <TextInput
        placeholder="Enter phone number..."
        className="border border-gray-300 rounded-lg p-2 mb-4"
      />
      {loading ? (
        <Text>Loading contributors...</Text>
      ) : (
        <ScrollView>
          {Object.keys(frequencyDetails).map((duration) => {
            const { title, description } = frequencyDetails[duration as Frequency];
            const totalCount = allContributors.filter(contributor => contributor.frequency === duration).length; // Get total count for this duration
            return (
              <TouchableOpacity
                key={duration}
                onPress={() => handleCardPress(duration)}
                className="bg-primaryCard rounded-xl p-4 mb-4"
              >
                <Text className="text-lg font-semibold text-white">{title}</Text>
                <Text className="text-white mb-2">{description}</Text>
                <View className="flex-row mb-2 items-center">
                  {allContributors.filter(contributor => contributor.frequency === duration).slice(0, 3).map((contributor, index) => (
                    <View key={index} style={{ position: 'relative', marginLeft: index > 0 ? -15 : 0 }}>
                      <Image 
                        source={{ uri: contributor.photoUri }}
                        style={{ width: 40, height: 40, borderRadius: 20 }} 
                        className="rounded-full border border-white"
                      />
                    </View>
                  ))}
                  {totalCount > 3 && (
                    <Text className="text-white ml-2">+{totalCount - 3}</Text> // Show remaining count
                  )}
                </View>
                <TouchableOpacity className="bg-blue-600 p-2 rounded-lg mt-2 flex-row items-center justify-center">
                  <MaterialIcons name="notifications" size={20} color="#fff" />
                  <Text className="text-white text-center ml-2">Send Reminder</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <Footer />
    </View>
  );
};

export default ContributorsScreen;

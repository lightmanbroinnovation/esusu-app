import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface TopicSection {
    title: string;
    content: string;
}

interface TopicContent {
    mainDescription: string;
    sections: TopicSection[];
}

interface TopicData {
    id: number;
    title: string;
    description: string;
    content: TopicContent;
}

export default function Topic() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Parse the topic data from params
    const topicData: TopicData = params.topicData ? JSON.parse(params.topicData as string) : null;

    const handlePreviousPage = () => {
        router.back();
    };

    if (!topicData) {
        return (
            <View className="flex-1 px-4 pt-10 bg-white">
                <Text>Topic not found</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 px-4 pt-10 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between mt-[2rem]">
                <TouchableOpacity 
                    onPress={handlePreviousPage} 
                    className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'
                >
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold flex-1 text-center mr-8">
                    Help Center
                </Text>
            </View>

            <View className="flex flex-col px-4 items-start gap-2 mt-8 pb-20">
                {/* Title */}
                <Text className="text-[24px] font-semibold text-[#007BFF] mb-4">
                    {topicData.title}
                </Text>

                {/* Main Description */}
                <Text className="text-[#6B7280] text-[16px] mb-4 text-sm">
                    {topicData.content.mainDescription}
                </Text>

                {/* Sections */}
                {topicData.content.sections.map((section, index) => (
                    <View key={index} className="mb-6 w-full">
                        <Text className=" text-[18px] font-semibold mb-2 text-[#007BFF] italic">
                            {section.title}
                        </Text>
                        <Text className="text-[#6B7280] text-[13px]">
                            {section.content}
                        </Text>
                    </View>
                ))}

                {/* Feedback section */}
                <View className="mt-8 w-full">
                    <Text className="text-[#007BFF] text-[16px] font-semibold mb-4">
                        Did that help solve your question?
                    </Text>

                    <View className="flex-row gap-4">
                        <TouchableOpacity className="bg-[#E5F1FF] px-8 py-3 rounded-full">
                            <Text className="text-[#007BFF] font-semibold">Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-[#E5F1FF] px-8 py-3 rounded-full">
                            <Text className="text-[#007BFF] font-semibold">No</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}


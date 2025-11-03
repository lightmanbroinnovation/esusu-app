import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ImageStyle, 
  ScrollViewProps 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { Ionicons } from '@expo/vector-icons';

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 40,
    },
    offlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    offlineText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    notFoundContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 40,
        backgroundColor: '#FFFFFF',
    },
    notFoundText: {
        fontSize: 16,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginRight: 32,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    topicTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#007BFF',
        marginBottom: 16,
    },
    mainDescription: {
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007BFF',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    sectionContent: {
        color: '#6B7280',
        fontSize: 13,
        lineHeight: 20,
    },
    feedbackContainer: {
        marginTop: 32,
        width: '100%',
    },
    feedbackTitle: {
        color: '#007BFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    feedbackButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    feedbackButton: {
        backgroundColor: '#E5F1FF',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 20,
    },
    feedbackButtonText: {
        color: '#007BFF',
        fontWeight: '600',
    },
});

export default function Topic() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Parse the topic data from params
    const topicData: TopicData = params.topicData ? JSON.parse(params.topicData as string) : null;

    const handlePreviousPage = () => {
        router.back();
    };

    const [loading, setLoading] = useState(true);
    const [networkAvailable, setNetworkAvailable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkAvailable(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) {
        return <EsusuLoader />;
    }

    if (!networkAvailable && !topicData) {
        return (
            <View style={styles.offlineContainer}>
                <Text style={styles.offlineText}>No network. Please connect to the internet to load topics.</Text>
            </View>
        );
    }

    if (!topicData) {
        return (
            <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>Topic not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handlePreviousPage}
                >
                    <Ionicons name="arrow-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Help Center
                </Text>
            </View>

            <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.topicTitle}>
                    {topicData.title}
                </Text>

                {/* Main Description */}
                <Text style={styles.mainDescription}>
                    {topicData.content.mainDescription}
                </Text>

                {/* Sections */}
                {topicData.content.sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {section.title}
                        </Text>
                        <Text style={styles.sectionContent}>
                            {section.content}
                        </Text>
                    </View>
                ))}

                {/* Feedback section */}
                <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackTitle}>
                        Did that help solve your question?
                    </Text>

                    <View style={styles.feedbackButtons}>
                        <TouchableOpacity style={styles.feedbackButton}>
                            <Text style={styles.feedbackButtonText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                            <Text style={styles.feedbackButtonText}>No</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}


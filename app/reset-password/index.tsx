import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ResetPassword() {
    const router = useRouter();

    const handlePreviousPage = () => {
        router.back();
    };

    const handleNextPage = (route: string) => {
        router.push(route as any);
    };

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handlePreviousPage} style={styles.backButton}>
                        <Image
                            source={require('../assets/images/back-arrow.png')}
                            style={styles.backIcon}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reset Password</Text>
                </View>

                {/* Password change input */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Current Password"
                                placeholderTextColor="#A9A8AF"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter New Password"
                                placeholderTextColor="#A9A8AF"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                placeholderTextColor="#A9A8AF"
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.updateButton}
                        onPress={() => handleNextPage('/(tabs)/home')}
                    >
                        <Text style={styles.buttonText}>Update Password</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    backButton: {
        backgroundColor: '#F2F8FF',
        height: 32,
        width: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    backIcon: {
        width: 16,
        height: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginLeft: 8,
    },
    formContainer: {
        flex: 1,
        alignItems: 'flex-start',
        marginTop: 40,
        width: '100%',
    },
    inputGroup: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#272636',
    },
    inputContainer: {
        backgroundColor: '#F4F4F5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14.4,
        borderRadius: 8,
        width: '100%',
    },
    input: {
        color: '#A9A8AF',
        width: '100%',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 40,
        width: '100%',
    },
    updateButton: {
        backgroundColor: '#0072CE',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VerificationStep from './VerificationStep';
import GovernmentIDSelect from './GovernmentIDSelect';
import DocumentQualityCheck from './DocumentQualityCheck';
import BusinessLocationUpload from './BusinessLocationUpload';

interface VerifyBusinessProps {
  onStepSelect: (step: string) => void;
  onClose: () => void;
  onVerificationComplete?: () => void;
}

interface StepState {
  completed: boolean;
  selected: boolean;
}

interface StepsState {
  businessInfo: StepState;
  governmentID: StepState;
  businessLocation: StepState;
  [key: string]: StepState;
}

const VerifyBusiness = ({ onStepSelect, onClose, onVerificationComplete }: VerifyBusinessProps) => {
  const router = useRouter();
  const [steps, setSteps] = useState<StepsState>({
    businessInfo: { completed: true, selected: false },
    governmentID: { completed: false, selected: false },
    businessLocation: { completed: false, selected: false }
  });

  const [showIDSelect, setShowIDSelect] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationCamera, setShowLocationCamera] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [showLocationQualityCheck, setShowLocationQualityCheck] = useState(false);
  const [selectedIDType, setSelectedIDType] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [locationImage, setLocationImage] = useState('');
  const [cameraType, setCameraType] = useState('id'); // 'id' or 'location'

  // Sample images for demo
  const sampleIDImage = 'https://reactnative.dev/img/tiny_logo.png'; // Using React Native logo as placeholder
  const sampleLocationImage = 'https://reactnative.dev/img/tiny_logo.png'; // Using React Native logo as placeholder

  const handleStepSelect = (step: string) => {
    const updatedSteps = { ...steps };
    
    // Reset all selected states
    Object.keys(updatedSteps).forEach(key => {
      updatedSteps[key].selected = false;
    });
    
    // Set selected step
    updatedSteps[step].selected = true;
    
    setSteps(updatedSteps);
    
    // Show specific screens based on the selected step
    if (step === 'governmentID') {
      setShowIDSelect(true);
    } else if (step === 'businessLocation') {
      // Open camera directly for business location
      setCameraType('location');
      setShowLocationCamera(true);
    } else {
      // Call the parent's onStepSelect for other steps
      onStepSelect(step);
    }
  };

  const handleIDTypeSelect = (type: string) => {
    setSelectedIDType(type);
    setShowIDSelect(false);
    
    // Open camera for ID
    setCameraType('id');
    setShowCamera(true);
  };

  const handleCaptureID = () => {
    setShowCamera(false);
    // Set captured image (using sample for demo)
    setCapturedImage(sampleIDImage);
    setShowQualityCheck(true);
  };

  const handleCaptureLocation = () => {
    setShowLocationCamera(false);
    // Set captured location image (using sample for demo)
    setLocationImage(sampleLocationImage);
    setShowLocationQualityCheck(true);
  };

  const handleIDImageConfirm = () => {
    setShowQualityCheck(false);
    
    // Mark government ID as completed
    const updatedSteps = { ...steps };
    updatedSteps.governmentID.completed = true;
    setSteps(updatedSteps);
  };

  const handleLocationImageConfirm = () => {
    setShowLocationQualityCheck(false);
    
    // Mark business location as completed
    const updatedSteps = { ...steps };
    updatedSteps.businessLocation.completed = true;
    setSteps(updatedSteps);
  };

  const handleVerify = () => {
    // Check if all steps are completed
    const allCompleted = Object.values(steps).every(step => step.completed);
    
    if (allCompleted) {
      // Navigate to success page
      console.log('All verification steps completed - navigating to success');
      if (onVerificationComplete) {
        onVerificationComplete();
      } else {
        router.push('/verification/success');
      }
    } else {
      // Show message about incomplete steps
      console.log('Please complete all verification steps');
    }
  };

  return (
    <SafeAreaView className=" bg-white">
      <ScrollView className=" px-4">
   <View className=' mt-4 flex-row justify-end'>

          <TouchableOpacity 
            className=" bg-gray-100 p-2 rounded-full"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
   </View>
          
     
        <View className=' mt-2'>

          <Text className="text-[#0052CC] text-3xl font-bold text-center mt-4">
            Verify Business
          </Text>
          <Text className="text-gray-600 text-base text-center mt-2 px-8">
            Complete your KYB verification to start managing contributions securely.
          </Text>
        </View>

        <View className="mt-4 space-y-4">
          <VerificationStep 
            title="Business Information"
            description="Provide details about your business to ensure a smooth verification process."
            completed={steps.businessInfo.completed}
            selected={steps.businessInfo.selected}
            onPress={() => handleStepSelect('businessInfo')}
          />
          
          <VerificationStep 
            title="Government ID"
            description="Provide a Driver's License, National Identity Card, or Passport."
            completed={steps.governmentID.completed}
            selected={steps.governmentID.selected}
            onPress={() => handleStepSelect('governmentID')}
          />
          
          <VerificationStep 
            title="Business Location"
            description="Upload clear photos of your shop to verify your business location."
            completed={steps.businessLocation.completed}
            selected={steps.businessLocation.selected}
            onPress={() => handleStepSelect('businessLocation')}
          />
        </View>

        <TouchableOpacity 
          className={`py-4 rounded-xl mt-8 mb-6 ${
            Object.values(steps).every(step => step.completed) 
              ? 'bg-[#007BFF]' 
              : 'bg-gray-300'
          }`}
          onPress={handleVerify}
        >
          <Text className="text-white text-center text-lg font-medium">
            Verify
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Government ID Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIDSelect}
        onRequestClose={() => setShowIDSelect(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <Text className="text-2xl font-bold text-center mb-8">
              Which photo ID would you like to use
            </Text>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('drivers_license')}
            >
              <Text className="text-xl font-bold">Driver's License</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('national_id')}
            >
              <Text className="text-xl font-bold">National Identity Card (NIN)</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('passport')}
            >
              <Text className="text-xl font-bold">Passport</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ID Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <Text className="text-white text-xl mb-4">Camera for {selectedIDType} (Simulated)</Text>
          <TouchableOpacity 
            className="mt-8 bg-white rounded-full p-4"
            onPress={handleCaptureID}
          >
            <View className="w-16 h-16 bg-white rounded-full border-4 border-gray-300" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Location Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showLocationCamera}
        onRequestClose={() => setShowLocationCamera(false)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <Text className="text-white text-xl mb-4">Camera for Business Location (Simulated)</Text>
          <TouchableOpacity 
            className="mt-8 bg-white rounded-full p-4"
            onPress={handleCaptureLocation}
          >
            <View className="w-16 h-16 bg-white rounded-full border-4 border-gray-300" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ID Quality Check Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showQualityCheck}
        onRequestClose={() => setShowQualityCheck(false)}
      >
        <DocumentQualityCheck 
          documentType={selectedIDType || 'national_id'}
          documentImage={capturedImage}
          onBack={() => {
            setShowQualityCheck(false);
            setShowIDSelect(true);
          }}
          onConfirm={handleIDImageConfirm}
          onRetake={() => {
            setShowQualityCheck(false);
            setShowCamera(true);
          }}
        />
      </Modal>

      {/* Location Quality Check Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showLocationQualityCheck}
        onRequestClose={() => setShowLocationQualityCheck(false)}
      >
        <DocumentQualityCheck 
          documentType="business_location"
          documentImage={locationImage}
          onBack={() => {
            setShowLocationQualityCheck(false);
          }}
          onConfirm={handleLocationImageConfirm}
          onRetake={() => {
            setShowLocationQualityCheck(false);
            setShowLocationCamera(true);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default VerifyBusiness; 
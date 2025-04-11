import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import VerifyBusiness from './index';
import BusinessInfoForm from './BusinessInfoForm';
import GovernmentIDSelect from './GovernmentIDSelect';
import DocumentQualityCheck from './DocumentQualityCheck';
import BusinessLocationUpload from './BusinessLocationUpload';

interface VerificationControllerProps {
  onClose?: () => void;
}

enum VerificationStage {
  MAIN = 'main',
  BUSINESS_INFO = 'business_info',
  GOVERNMENT_ID_SELECT = 'government_id_select',
  DOCUMENT_QUALITY_CHECK = 'document_quality_check',
  BUSINESS_LOCATION = 'business_location',
  LOCATION_QUALITY_CHECK = 'location_quality_check'
}

const VerificationController = ({ onClose }: VerificationControllerProps) => {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(VerificationStage.MAIN);
  const [verificationData, setVerificationData] = useState({
    businessInfo: null,
    governmentIDType: null,
    governmentIDImage: null,
    locationImages: []
  });
  
  const handleBusinessInfoSave = (data: any) => {
    setVerificationData({
      ...verificationData,
      businessInfo: data
    });
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleIDTypeSelect = (type: string) => {
    setVerificationData({
      ...verificationData,
      governmentIDType: type
    });
    setCurrentStage(VerificationStage.DOCUMENT_QUALITY_CHECK);
  };
  
  const handleIDConfirm = () => {
    setVerificationData({
      ...verificationData,
      governmentIDImage: 'captured_id_image'
    });
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleLocationPhotoTaken = () => {
    setCurrentStage(VerificationStage.LOCATION_QUALITY_CHECK);
  };
  
  const handleLocationConfirm = () => {
    setVerificationData({
      ...verificationData,
      locationImages: [...verificationData.locationImages, 'captured_location_image']
    });
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleMainStepSelect = (step: string) => {
    switch(step) {
      case 'businessInfo':
        setCurrentStage(VerificationStage.BUSINESS_INFO);
        break;
      case 'governmentID':
        setCurrentStage(VerificationStage.GOVERNMENT_ID_SELECT);
        break;
      case 'businessLocation':
        setCurrentStage(VerificationStage.BUSINESS_LOCATION);
        break;
    }
  };
  
  const handleCloseVerification = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleVerificationComplete = () => {
    // Navigate to success page
    router.push('/verification/success');
  };
  
  const renderCurrentStage = () => {
    switch(currentStage) {
      case VerificationStage.MAIN:
        return (
          <VerifyBusiness 
            onStepSelect={handleMainStepSelect}
            onClose={handleCloseVerification}
            onVerificationComplete={handleVerificationComplete}
          />
        );
      
      case VerificationStage.BUSINESS_INFO:
        return (
          <BusinessInfoForm 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onSave={handleBusinessInfoSave}
          />
        );
      
      case VerificationStage.GOVERNMENT_ID_SELECT:
        return (
          <GovernmentIDSelect 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onSelectIDType={handleIDTypeSelect}
          />
        );
      
      case VerificationStage.DOCUMENT_QUALITY_CHECK:
        return (
          <DocumentQualityCheck 
            documentType={verificationData.governmentIDType || ''}
            documentImage="https://reactnative.dev/img/tiny_logo.png"
            onBack={() => setCurrentStage(VerificationStage.GOVERNMENT_ID_SELECT)}
            onConfirm={handleIDConfirm}
            onRetake={() => {
              // In a real app, this would launch the camera again
              console.log('Retaking photo');
            }}
          />
        );
      
      case VerificationStage.BUSINESS_LOCATION:
        return (
          <BusinessLocationUpload 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onTakePhoto={handleLocationPhotoTaken}
          />
        );
      
      case VerificationStage.LOCATION_QUALITY_CHECK:
        return (
          <DocumentQualityCheck 
            documentType="business_location"
            documentImage="https://reactnative.dev/img/tiny_logo.png"
            isLoading={false}
            onBack={() => setCurrentStage(VerificationStage.BUSINESS_LOCATION)}
            onConfirm={handleLocationConfirm}
            onRetake={() => {
              // In a real app, this would launch the camera again
              console.log('Retaking photo');
            }}
          />
        );
    }
  };

  return (
    <View className="flex-1">
      {renderCurrentStage()}
    </View>
  );
};

export default VerificationController; 
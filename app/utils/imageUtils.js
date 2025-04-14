import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { uploadImage, uploadMultipleImages } from '../../services/cloudinary';

/**
 * Prepares an image for storage or upload by copying it to the app's storage
 * @param {string} sourceUri - The source URI of the image
 * @param {string} prefix - Prefix for the filename
 * @returns {Promise<string>} The new URI of the copied image
 */
export const prepareImageForStorage = async (sourceUri, prefix = 'image') => {
  try {
    const timestamp = new Date().getTime();
    const filename = `${prefix}_${timestamp}.jpg`;
    const destinationUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri
    });
    
    console.log(`Image copied to: ${destinationUri}`);
    return destinationUri;
  } catch (error) {
    console.error('Error preparing image for storage:', error);
    throw error;
  }
};

/**
 * Uploads a verification document image to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} documentType - Type of document (e.g., 'drivers_license', 'national_id')
 * @param {string} userId - User ID to associate with the image
 * @returns {Promise<string>} Cloudinary URL of the uploaded image
 */
export const uploadVerificationDocument = async (imageUri, documentType, userId) => {
  try {
    const folder = 'verification_documents';
    const metadata = {
      user_id: userId,
      document_type: documentType,
      timestamp: new Date().toISOString()
    };
    
    return await uploadImage(imageUri, folder, metadata);
  } catch (error) {
    console.error('Error uploading verification document:', error);
    Alert.alert(
      "Upload Error",
      "There was a problem uploading your document. Please try again.",
      [{ text: "OK" }]
    );
    throw error;
  }
};

/**
 * Uploads business location images to Cloudinary
 * @param {Array<{uri: string, latitude?: number, longitude?: number, timestamp: number}>} locationImages 
 * @param {string} userId - User ID to associate with the images
 * @returns {Promise<Array<{url: string, latitude?: number, longitude?: number, timestamp: number}>>}
 */
export const uploadBusinessLocationImages = async (locationImages, userId) => {
  try {
    const results = [];
    
    for (const image of locationImages) {
      const folder = 'business_locations';
      const metadata = {
        user_id: userId,
        latitude: image.latitude || 'unknown',
        longitude: image.longitude || 'unknown',
        timestamp: new Date(image.timestamp).toISOString()
      };
      
      const url = await uploadImage(image.uri, folder, metadata);
      
      results.push({
        url,
        latitude: image.latitude,
        longitude: image.longitude,
        timestamp: image.timestamp
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading business location images:', error);
    Alert.alert(
      "Upload Error",
      "There was a problem uploading your business images. Please try again.",
      [{ text: "OK" }]
    );
    throw error;
  }
};

/**
 * Prepares verification data for API submission by uploading images to Cloudinary
 * @param {Object} verificationData - The verification data with local image URIs
 * @param {string} userId - User ID to associate with the images
 * @param {Function} progressCallback - Callback function to report progress (0-1)
 * @returns {Promise<Object>} Verification data with Cloudinary URLs
 */
export const prepareVerificationDataForSubmission = async (
  verificationData, 
  userId, 
  progressCallback = (progress) => {}
) => {
  try {
    // Create a copy of the verification data
    const dataForSubmission = { ...verificationData };
    
    // Calculate total uploads needed for progress tracking
    const totalUploads = (verificationData.governmentIDImage ? 1 : 0) + 
      (verificationData.locationImages ? verificationData.locationImages.length : 0);
    let completedUploads = 0;
    
    // Update progress function
    const updateProgress = () => {
      completedUploads++;
      const progress = completedUploads / totalUploads;
      progressCallback(progress);
    };
    
    // Upload government ID document if present
    if (verificationData.governmentIDImage && verificationData.governmentIDType) {
      console.log(`Uploading government ID (${verificationData.governmentIDType}) to Cloudinary...`);
      
      dataForSubmission.governmentIDImageUrl = await uploadVerificationDocument(
        verificationData.governmentIDImage,
        verificationData.governmentIDType,
        userId
      );
      
      // Log Cloudinary response
      console.log("CLOUDINARY RESPONSE - Government ID:", JSON.stringify({
        success: true,
        url: dataForSubmission.governmentIDImageUrl,
        documentType: verificationData.governmentIDType
      }));
      
      // Keep the original path for reference but it won't be sent to the API
      dataForSubmission.governmentIDImageLocalPath = verificationData.governmentIDImage;
      delete dataForSubmission.governmentIDImage;
      
      // Store government_id URL to be saved in user data
      dataForSubmission.government_id = dataForSubmission.governmentIDImageUrl;
      
      // Update progress
      updateProgress();
    }
    
    // Upload business location images if present
    if (verificationData.locationImages && verificationData.locationImages.length > 0) {
      dataForSubmission.locationImagesUrls = [];
      
      // Upload each image individually to track progress
      for (const image of verificationData.locationImages) {
        const folder = 'business_locations';
        const metadata = {
          user_id: userId,
          latitude: image.latitude || 'unknown',
          longitude: image.longitude || 'unknown',
          timestamp: new Date(image.timestamp).toISOString()
        };
        
        console.log(`Uploading business location image to Cloudinary...`);
        const url = await uploadImage(image.uri, folder, metadata);
        
        // Log Cloudinary response
        console.log("CLOUDINARY RESPONSE - Business Location:", JSON.stringify({
          success: true,
          url: url,
          locationData: {
            latitude: image.latitude,
            longitude: image.longitude,
            timestamp: image.timestamp
          }
        }));
        
        dataForSubmission.locationImagesUrls.push({
          url,
          latitude: image.latitude,
          longitude: image.longitude,
          timestamp: image.timestamp
        });
        
        // Store the first business location image as the primary business_img
        if (dataForSubmission.locationImagesUrls.length === 1) {
          dataForSubmission.business_img = url;
        }
        
        // Update progress
        updateProgress();
      }
      
      // Keep original paths for reference but they won't be sent to the API
      dataForSubmission.locationImagesLocalPaths = verificationData.locationImages.map(img => img.uri);
      delete dataForSubmission.locationImages;
    }
    
    // Add verify_business flag
    dataForSubmission.verify_business = true;
    
    console.log('USER VERIFICATION DATA PREPARED:', JSON.stringify({
      government_id: dataForSubmission.government_id,
      business_img: dataForSubmission.business_img,
      verify_business: dataForSubmission.verify_business
    }));
    
    return dataForSubmission;
  } catch (error) {
    console.error('Error preparing verification data for submission:', error);
    throw error;
  }
}; 
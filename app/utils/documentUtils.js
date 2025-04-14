import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { uploadImage } from '../../services/cloudinary';

/**
 * Uploads a user's ID document to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} documentType - Type of document (e.g., 'national_id', 'cac_certificate')
 * @param {string} userId - User ID to associate with the image
 * @returns {Promise<string>} Cloudinary URL of the uploaded image
 */
export const uploadUserDocument = async (imageUri, documentType, userId) => {
  try {
    if (!imageUri) {
      throw new Error('No image provided');
    }
    
    const folder = 'user_documents';
    const metadata = {
      user_id: userId,
      document_type: documentType,
      timestamp: new Date().toISOString()
    };
    
    return await uploadImage(imageUri, folder, metadata);
  } catch (error) {
    console.error('Error uploading user document:', error);
    Alert.alert(
      "Upload Error",
      "There was a problem uploading your document. Please try again.",
      [{ text: "OK" }]
    );
    throw error;
  }
};

/**
 * Uploads a contributor's profile image to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} contributorId - Contributor ID to associate with the image
 * @param {string} userId - User ID of the agent who manages this contributor
 * @returns {Promise<string>} Cloudinary URL of the uploaded image
 */
export const uploadContributorImage = async (imageUri, contributorId, userId) => {
  try {
    // Validate input parameters
    if (!imageUri) {
      throw new Error('No image provided');
    }
    
    // Use safe defaults for missing IDs
    const safeContributorId = contributorId || `temp_contributor_${Date.now()}`;
    const safeUserId = userId || `temp_user_${Date.now()}`;
    
    if (!contributorId) {
      console.warn('No contributor ID provided, using temporary ID:', safeContributorId);
    }
    
    if (!userId) {
      console.warn('No user ID provided, using temporary ID:', safeUserId);
    }
    
    // Verify the image file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error(`Image file does not exist at path: ${imageUri}`);
    }
    
    console.log('Uploading contributor image:', {
      imageUri: imageUri.substring(0, 50) + '...',
      fileSize: fileInfo.size,
      contributorId: safeContributorId,
      userId: safeUserId
    });
    
    // Set up the folder and metadata
    const folder = 'contributor_profiles';
    const metadata = {
      user_id: safeUserId,
      contributor_id: safeContributorId,
      timestamp: new Date().toISOString()
    };
    
    // Attempt to upload with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Upload attempt ${attempts}/${maxAttempts}`);
        
        // Upload the image
        const url = await uploadImage(imageUri, folder, metadata);
        console.log('Upload successful:', url.substring(0, 60) + '...');
        return url;
      } catch (uploadError) {
        console.error(`Upload attempt ${attempts} failed:`, uploadError);
        
        if (attempts >= maxAttempts) {
          throw uploadError; // Rethrow error after all attempts fail
        }
        
        // Wait before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Failed to upload after maximum attempts');
  } catch (error) {
    console.error('Error uploading contributor image:', error);
    Alert.alert(
      "Upload Error",
      `There was a problem uploading the contributor image: ${error.message}. Please check your internet connection and try again.`,
      [{ text: "OK" }]
    );
    throw error;
  }
};

/**
 * Uploads user profile image to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} userId - User ID to associate with the image
 * @returns {Promise<string>} Cloudinary URL of the uploaded image
 */
export const uploadUserProfileImage = async (imageUri, userId) => {
  try {
    if (!imageUri) {
      throw new Error('No image provided');
    }
    
    const folder = 'user_profiles';
    const metadata = {
      user_id: userId,
      timestamp: new Date().toISOString()
    };
    
    return await uploadImage(imageUri, folder, metadata);
  } catch (error) {
    console.error('Error uploading user profile image:', error);
    Alert.alert(
      "Upload Error",
      "There was a problem uploading your profile image. Please try again.",
      [{ text: "OK" }]
    );
    throw error;
  }
}; 
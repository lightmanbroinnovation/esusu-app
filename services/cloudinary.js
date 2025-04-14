import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// Cloudinary configuration
const CLOUD_NAME = 'daskmqzyy';
const UPLOAD_PRESET = 'f1quj50x';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image to Cloudinary
 * @param {string} imageUri - The local URI of the image to upload
 * @param {string} folder - The folder to upload to (e.g., 'user_profiles', 'verification_documents')
 * @param {Object} metadata - Additional metadata to include with the upload (as context)
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImage = async (imageUri, folder = 'esusu', metadata = {}) => {
  try {
    console.log(`Uploading image to Cloudinary folder: ${folder}`);
    
    // Verify image exists and get info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error(`Image file does not exist at path: ${imageUri}`);
    }
    
    // Log file info
    console.log(`Image file size: ${(fileInfo.size / 1024).toFixed(2)}KB`);
    
    // Check file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (fileInfo.size > MAX_FILE_SIZE) {
      console.warn(`File too large (${(fileInfo.size / 1024 / 1024).toFixed(2)}MB). Will resize before upload.`);
      // We'll continue and let the base64 encoding handle it, but it might be slow
    }
    
    // Read the file as base64
    console.log('Reading file as base64...');
    let base64;
    try {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (readError) {
      console.error('Error reading file as base64:', readError);
      throw new Error(`Failed to read image file: ${readError.message}`);
    }
    
    if (!base64 || base64.length === 0) {
      throw new Error('Failed to read image file as base64 - empty result');
    }
    
    console.log(`Base64 encoding successful, length: ${base64.length} characters`);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64}`);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Add metadata as context if provided
    if (Object.keys(metadata).length > 0) {
      const contextString = Object.entries(metadata)
        .map(([key, value]) => `${key}=${value}`)
        .join('|');
      formData.append('context', contextString);
    }
    
    // Configure request with longer timeout
    const config = {
      timeout: 60000, // 60 seconds timeout for large files
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Retry configuration if available in your axios version
      // If not available, our retry logic in the calling functions will handle it
    };
    
    console.log('Sending request to Cloudinary...');
    
    // Upload to Cloudinary with multiple attempts
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await axios.post(UPLOAD_URL, formData, config);
        break; // Success, exit the loop
      } catch (uploadError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw uploadError; // Rethrow after max retries
        }
        console.log(`Upload attempt ${retryCount} failed, retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
    
    // Check if upload was successful
    if (response && response.status === 200 && response.data && response.data.secure_url) {
      console.log('Image uploaded successfully:', response.data.secure_url);
      return response.data.secure_url;
    } else {
      console.error('Cloudinary response without secure_url:', response ? response.data : 'No response');
      throw new Error('Failed to get secure URL from response');
    }
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    
    // Provide more detailed error message based on the error type
    if (error.response) {
      // Server responded with an error status code
      console.error('Cloudinary server error:', error.response.status, error.response.data);
      throw new Error(`Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // Request was made but no response received (network issue)
      console.error('Network error - no response received');
      throw new Error('Network error: No response received. Please check your internet connection.');
    } else {
      // Error in setting up the request
      throw new Error(`Upload error: ${error.message}`);
    }
  }
};

/**
 * Uploads a verification document to Cloudinary
 * @param {string} imageUri - The local URI of the document to upload
 * @param {string} documentType - The type of document (e.g., 'id', 'cac', 'utility_bill')
 * @param {string} userId - The ID of the user the document belongs to
 * @returns {Promise<string>} - The URL of the uploaded document
 */
export const uploadVerificationDocument = async (imageUri, documentType, userId) => {
  return uploadImage(imageUri, 'verification_documents', {
    document_type: documentType,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Uploads a business location photo to Cloudinary
 * @param {string} imageUri - The local URI of the photo to upload
 * @param {string} userId - The ID of the user the photo belongs to
 * @param {Object} locationData - GPS coordinates and address data
 * @returns {Promise<string>} - The URL of the uploaded photo
 */
export const uploadBusinessLocationPhoto = async (imageUri, userId, locationData = {}) => {
  const metadata = {
    user_id: userId,
    timestamp: new Date().toISOString(),
  };
  
  // Add location data if available
  if (locationData.latitude && locationData.longitude) {
    metadata.latitude = locationData.latitude;
    metadata.longitude = locationData.longitude;
  }
  
  if (locationData.address) {
    metadata.address = locationData.address;
  }
  
  return uploadImage(imageUri, 'business_locations', metadata);
};

/**
 * Uploads a contributor profile photo to Cloudinary
 * @param {string} imageUri - The local URI of the photo to upload
 * @param {string} contributorId - The ID of the contributor
 * @param {string} agentId - The ID of the agent who added the contributor
 * @returns {Promise<string>} - The URL of the uploaded photo
 */
export const uploadContributorPhoto = async (imageUri, contributorId, agentId) => {
  return uploadImage(imageUri, 'contributor_profiles', {
    contributor_id: contributorId,
    agent_id: agentId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Uploads a user profile photo to Cloudinary
 * @param {string} imageUri - The local URI of the photo to upload
 * @param {string} userId - The ID of the user
 * @returns {Promise<string>} - The URL of the uploaded photo
 */
export const uploadUserProfilePhoto = async (imageUri, userId) => {
  return uploadImage(imageUri, 'user_profiles', {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Uploads multiple images to Cloudinary
 * @param {string[]} imageUris - Array of local file URIs to upload
 * @param {string} folder - Cloudinary folder to upload to
 * @param {object} metadata - Additional metadata to attach to all images
 * @returns {Promise<string[]>} - Array of URLs of the uploaded images
 */
export const uploadMultipleImages = async (imageUris, folder, metadata = {}) => {
  try {
    const uploadPromises = imageUris.map(uri => uploadImage(uri, folder, metadata));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Generate a Cloudinary URL with transformations
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options (width, height, crop, etc.)
 * @returns {string} - Transformed URL
 */
export const getTransformedUrl = (url, options = {}) => {
  if (!url || !url.includes(CLOUD_NAME)) {
    console.warn('Invalid Cloudinary URL provided for transformation');
    return url;
  }
  
  // Extract the file path and extension from the URL
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }
  
  // Build transformation string
  let transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/' 
    : '';
  
  // Construct the new URL with transformations
  return `${urlParts[0]}/upload/${transformationString}${urlParts[1]}`;
}; 
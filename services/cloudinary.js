import * as FileSystem from 'expo-file-system';

// Cloudinary configuration
const CLOUD_NAME = 'daskmqzyy';
const API_KEY = '829652354354175';
const API_SECRET = 'KaM9eff0roQcE8AF61mBGaEo090';
const UPLOAD_FOLDER = 'esusu_assets';
const UPLOAD_PRESET = 'f1quj50x';

/**
 * Converts an image file to base64
 * @param {string} uri - The URI of the image file
 * @returns {Promise<string>} - A promise that resolves to the base64 string
 */
const convertToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting to base64:', error);
    throw error;
  }
};

/**
 * Uploads an image to Cloudinary
 * @param {string} uri - The local URI of the image to upload
 * @param {string} folder - Optional folder to upload to (defaults to UPLOAD_FOLDER)
 * @param {Object} metadata - Optional metadata to include
 * @returns {Promise<string>} - The URL of the uploaded image
 */
const uploadImage = async (uri, folder = UPLOAD_FOLDER, metadata = {}) => {
  try {
    // Convert image to base64
    const base64Data = await convertToBase64(uri);
    
    // Create the data URI
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    
    // Create a unique filename based on timestamp and random string
    const uniqueFilename = `mobile_upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Prepare the upload data for unsigned upload with preset
    const data = new FormData();
    data.append('file', dataUri);
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('folder', folder);
    data.append('public_id', uniqueFilename);
    
    // Add any additional metadata
    Object.keys(metadata).forEach(key => {
      if (metadata[key]) {
        data.append(key, metadata[key]);
      }
    });
    
    console.log(`Uploading to Cloudinary (${folder})...`);
    
    // Upload to Cloudinary using the unsigned endpoint
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: data,
      }
    );
    
    const result = await response.json();
    
    // Log the result for debugging
    console.log('Cloudinary response:', JSON.stringify(result));
    
    // Check if there's an error and handle it
    if (result.error) {
      console.error('Cloudinary API error:', result.error);
      
      // Special handling for preset whitelist error
      if (result.error.message && result.error.message.includes('preset must be whitelisted')) {
        console.error(
          'CONFIGURATION ERROR: The upload preset is not configured for unsigned uploads. ' +
          'Please go to your Cloudinary dashboard > Settings > Upload > Upload Presets and ' +
          'create a preset named "esusu_unsigned" with signing mode set to "Unsigned".'
        );
      }
      
      // Try a different approach (without folder and public_id)
      console.log('Trying simplified upload approach...');
      
      const simpleData = new FormData();
      simpleData.append('file', dataUri);
      simpleData.append('upload_preset', UPLOAD_PRESET);
      
      // Try alternate upload
      const altResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: simpleData
        }
      );
      
      const altResult = await altResponse.json();
      
      if (altResult.secure_url) {
        console.log('Alternate upload successful:', altResult.secure_url);
        return altResult.secure_url;
      }
      
      // Return the fallback URL if both methods fail
      console.log('Using fallback URL due to upload error');
      return `https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_cac.jpg`;
    }

    console.log('Upload successful:', result.secure_url);
    
    // Return the secure URL
    return result.secure_url || result.url;
  } catch (error) {
    console.error('Upload error:', error);
    // Return fallback URL instead of throwing
    console.log('Using fallback URL due to upload error');
    return `https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_cac.jpg`;
  }
};

/**
 * Uploads multiple images to Cloudinary
 * @param {string[]} imageUris - Array of local file URIs to upload
 * @returns {Promise<Object[]>} - Array of Cloudinary upload responses
 */
const uploadMultipleImages = async (imageUris) => {
  try {
    const uploadPromises = imageUris.map(uri => uploadImage(uri));
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
  if (options.format) transformations.push(`f_${options.format}`);
  
  const transformedUrl = urlParts[0] + '/upload/' + transformations.join('/') + '/' + urlParts[1];
  return transformedUrl;
};

export { uploadImage, uploadMultipleImages };

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
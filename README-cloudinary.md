# Cloudinary Integration for Esusu App

This document explains how to set up and use the Cloudinary integration for image uploads in the Esusu application.

## Setup

1. **Create a Cloudinary Account**
   - Go to [Cloudinary](https://cloudinary.com/) and sign up for an account.
   - Once registered, get your Cloud Name from the dashboard.

2. **Configure Upload Preset**
   - In your Cloudinary dashboard, navigate to Settings > Upload
   - Create a new upload preset with the following settings:
     - Mode: Unsigned
     - Folder: `esusu` (optional root folder)
     - Enable "Auto-create folders"
     - Set any transformations or restrictions as needed

3. **Update Cloudinary Configuration**
   - Open `services/cloudinary.js` in the project
   - Update the following values with your Cloudinary credentials:
     ```javascript
     const CLOUD_NAME = 'daskmqzyy'; // Replace with your cloud name
     const UPLOAD_PRESET = 'f1quj50x'; // Replace with your upload preset
     ```

## Folder Structure

Images are organized in Cloudinary with the following folder structure:

- **verification_documents/**: Government IDs and other verification documents
- **business_locations/**: Business location photos with geolocation data
- **contributor_profiles/**: Contributor profile photos
- **user_profiles/**: User profile photos
- **user_documents/**: User ID documents, CAC certificates, etc.

Each folder helps organize and distinguish between different types of file uploads.

## Implementation

The application uses direct URL uploads to Cloudinary. Here's an example of how it works:

```javascript
// Create FormData with the file and upload details
const formData = new FormData();
formData.append('file', fileData);
formData.append('upload_preset', UPLOAD_PRESET);
formData.append('folder', 'user_profiles'); // Specify the folder

// Add metadata as context
formData.append('context', 'user_id=123|timestamp=2023-07-12');

// Upload directly to Cloudinary
const response = await axios.post(
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
  formData
);

// Get the secure URL from the response
const imageUrl = response.data.secure_url;
```

## Usage in the App

The Cloudinary integration is used in several parts of the application:

1. **Business Verification**
   - Government ID documents are uploaded to the `verification_documents` folder
   - Business location photos are uploaded to the `business_locations` folder with location metadata

2. **Contributor Management**
   - Contributor profile photos are uploaded to the `contributor_profiles` folder
   - Each image includes the contributor ID and agent ID as metadata

3. **User Documents**
   - User profile photos go to the `user_profiles` folder
   - Other user documents go to the `user_documents` folder with document type metadata

## Metadata

Each upload includes relevant metadata to help with organization:

- **User ID**: To associate images with specific users
- **Timestamp**: When the image was uploaded
- **Document Type**: For identification documents
- **Geolocation**: For business location photos

## Troubleshooting

- **Upload Failures**: Check your network connection and Cloudinary credentials
- **Missing Images**: Verify that the correct upload preset and cloud name are being used
- **Permission Errors**: Make sure your upload preset is set to "Unsigned"
- **Rate Limiting**: Ensure you're not exceeding Cloudinary's limits for your account tier

## Security Considerations

- The implementation uses unsigned uploads with a preset for simplicity
- Sensitive documents should use restricted access modes in Cloudinary when possible
- Consider implementing a signed upload approach for sensitive documents in production 
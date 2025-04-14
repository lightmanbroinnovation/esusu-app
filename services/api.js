import axios from "axios";

const API_BASE_URL = 'http://192.168.0.116:8082'; // Ensure this is the correct base URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/users", userData);
    console.log("User registered successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

export const fetchUser = async (id) => {
  try {
    const response = await axiosInstance.get(`/users/${id}`);
    console.log("User details fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export const addContributor = async (contributorData) => {
  try {
    // Log the complete incoming data
    console.log("API SERVICE - CONTRIBUTOR DATA RECEIVED:", JSON.stringify({
      ...contributorData,
      photoUri: contributorData.photoUri ? (typeof contributorData.photoUri === 'string' ? contributorData.photoUri.substring(0, 30) + '...' : 'INVALID_URI') : 'MISSING',
      imageUrl: contributorData.imageUrl ? (typeof contributorData.imageUrl === 'string' ? contributorData.imageUrl.substring(0, 30) + '...' : 'INVALID_URI') : 'MISSING'
    }));
    
    // Make sure photoUri is properly included - ensure consistency between the two fields
    if (!contributorData.photoUri && contributorData.imageUrl) {
      contributorData.photoUri = contributorData.imageUrl;
      console.log("Added missing photoUri from imageUrl");
    } else if (!contributorData.imageUrl && contributorData.photoUri) {
      contributorData.imageUrl = contributorData.photoUri;
      console.log("Added missing imageUrl from photoUri");
    }
    
    // Ensure both URLs are properly set
    if (!contributorData.photoUri && !contributorData.imageUrl) {
      console.warn("WARNING: No image URL provided for contributor!");
    }
    
    // Log the final processed data being sent to the server (truncate long URLs)
    const logData = {
      ...contributorData,
      photoUri: contributorData.photoUri ? contributorData.photoUri.substring(0, 30) + '...' : null,
      imageUrl: contributorData.imageUrl ? contributorData.imageUrl.substring(0, 30) + '...' : null
    };
    console.log("PROCESSED CONTRIBUTOR DATA:", JSON.stringify(logData));
    
    const response = await axiosInstance.post("/contributors", contributorData);
    console.log("API RESPONSE - Contributor added successfully:", response.data);
    return response.data; // Return the added contributor data
  } catch (error) {
    console.error("Error adding contributor:", error);
    throw error;
  }
};

// Updated function to fetch contributors based on agentId
export const fetchContributors = async (agentId) => {
  try {
    const response = await axiosInstance.get(`/contributors?agentId=${agentId}`);
    console.log("Contributors fetched successfully:", response.data);
    return response.data; // Return the list of contributors
  } catch (error) {
    console.error("Error fetching contributors:", error);
    throw error;
  }
};

// Function to fetch transactions for a user by userId
export const fetchTransactions = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`); // Fetch the user data
    console.log("User fetched successfully:", response.data);
    
    // Return the transactions for the user
    return response.data.transactions || []; // Return an empty array if no transactions
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// Function to fetch commissions for a user by userId
export const fetchCommissions = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`); // Adjust the endpoint as necessary
    console.log("Commissions fetched successfully:", response.data);
    
    // Return the commissions for the user
    return response.data.commissions || []; // Return an empty array if no commissions
  } catch (error) {
    console.error("Error fetching commissions:", error);
    throw error;
  }
};

// Function to fetch user by phone number for login
export const fetchUserByPhone = async (phoneNumber) => {
  try {
    const response = await axiosInstance.get(`/users?phonenumber=${phoneNumber}`);
    console.log("User lookup by phone completed:", response.data);
    
    // If no user found or empty array returned
    if (!response.data || response.data.length === 0) {
      throw new Error("User not found. Please register an account.");
    }
    
    // Return the first user that matches the phone number
    return response.data[0];
  } catch (error) {
    console.error("Error fetching user by phone:", error);
    throw error;
  }
};

// Function to update a user's information
export const updateUser = async (userId, userData) => {
  try {
    const response = await axiosInstance.patch(`/users/${userId}`, userData);
    console.log("User updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Function to add PIN to a user if it doesn't exist
export const addPinToUser = async (userId, pin) => {
  try {
    // Get current user data
    const user = await fetchUser(userId);
    
    // Check if PIN already exists
    if (user.pin) {
      console.log("User already has a PIN");
      return user;
    }
    
    // Add PIN to user
    const updatedUser = await updateUser(userId, { pin });
    console.log("PIN added to user successfully");
    return updatedUser;
  } catch (error) {
    console.error("Error adding PIN to user:", error);
    throw error;
  }
};

// Function to fetch transactions for a contributor by contributorId
export const fetchContributorTransactions = async (contributorId) => {
  try {
    console.log(`Fetching transactions for contributor: ${contributorId}`);
    const response = await axiosInstance.get(`/contributors/${contributorId}`);
    console.log(response.data);
    return response.data.transactions || [];
  } catch (error) {
    console.error('Error fetching contributor transactions:', error);
    throw error;
  }
};

// Function to submit business verification data
export const submitBusinessVerification = async (userId, verificationData) => {
  try {
    console.log(`Submitting business verification for user ${userId}`);
    
    // First get the current user data
    const userResponse = await axiosInstance.get(`/users/${userId}`);
    const userData = userResponse.data;
    
    // Update the user with verification data
    const updatedUserData = {
      ...userData,
      government_id: verificationData.documentImageUrl || verificationData.governmentIDImageUrl,
      business_img: verificationData.businessLocationImageUrl,
      verify_business: true,
      verificationStatus: 'pending',
      verification_data: verificationData // Store the full verification data as a nested object
    };
    
    // Update the user record
    const response = await axiosInstance.patch(`/users/${userId}`, updatedUserData);
    console.log("Business verification submitted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting business verification:", error);
    throw error;
  }
};

// Function to get verification status
export const getVerificationStatus = async (userId) => {
  try {
    // Get the user data which now includes verification info
    const response = await axiosInstance.get(`/users/${userId}`);
    const userData = response.data;
    
    // Extract verification status
    const verificationStatus = {
      status: userData.verificationStatus || 'not_started',
      government_id: userData.government_id,
      business_img: userData.business_img,
      verify_business: userData.verify_business || false,
      verification_data: userData.verification_data || {}
    };
    
    console.log("Verification status fetched successfully:", verificationStatus);
    return verificationStatus;
  } catch (error) {
    console.error("Error fetching verification status:", error);
    throw error;
  }
};
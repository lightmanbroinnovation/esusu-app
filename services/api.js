import axios from "axios";

const API_BASE_URL = 'http://192.168.100.62:8082'; // Ensure this is the correct base URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const registerUser = async (userData) => {
  try {
    console.log("==== REGISTRATION PROCESS STARTED ====");
    console.log("API Base URL:", API_BASE_URL);
    
    // Check if a user with this phone number already exists
    const phoneNumber = userData.phone || userData.phonenumber;
    console.log(`Checking if user with phone number ${phoneNumber} already exists...`);
    
    try {
      const existingUserResponse = await axiosInstance.get(`/users?phonenumber=${phoneNumber}`);
      
      if (existingUserResponse.data && existingUserResponse.data.length > 0) {
        console.log(`User with phone number ${phoneNumber} already exists!`);
        console.log("Existing user:", existingUserResponse.data[0].id);
        return existingUserResponse.data[0]; // Return the existing user instead of creating a duplicate
      }
      
      console.log(`No existing user found with phone number ${phoneNumber}, proceeding with registration...`);
    } catch (checkError) {
      console.error("Error checking for existing user:", checkError.message);
      // Continue with registration if we couldn't check for existing user
    }
    
    // Check if verification data is included
    let verificationData = null;
    if (userData.verification_data) {
      verificationData = userData.verification_data;
      // Remove from main userData to avoid duplication
      delete userData.verification_data;
    }
    
    // Create empty transactions array
    const transactions = [];
    
    // Prepare the user data with standard fields
    const userPayload = {
      id: Math.random().toString(36).substring(2, 6), // Generate a random ID
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      phonenumber: phoneNumber,
      pin: userData.pin,
      business: userData.business,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      gender: userData.gender || "Not specified",
      dob: userData.dob,
      // Include BVN
      bvn: userData.bvn,
      // For verification images
      government_id: verificationData?.government_id || userData.idImage,
      business_img: verificationData?.business_document || userData.cacImage,
      // ID images
      idImage: userData.idImage || verificationData?.government_id,
      cacImage: userData.cacImage || verificationData?.business_document,
      // Set default verification status
      verificationStatus: 'pending',
      verify_business: true,
      // Include transactions array
      transactions: transactions
    };
    
    console.log("Registering user with data:", JSON.stringify(userPayload, null, 2));
    
    // Test the connection to JSON server
    try {
      console.log("Testing connection to JSON server...");
      const testResponse = await axiosInstance.get("/users?_limit=1");
      console.log("Connection test successful:", testResponse.status);
    } catch (connError) {
      console.error("CONNECTION TEST FAILED:", connError.message);
      console.error("Connection details:", {
        baseURL: axiosInstance.defaults.baseURL,
        timeout: axiosInstance.defaults.timeout
      });
    }
    
    // Send POST request to create user with more detailed tracking
    console.log(`Sending POST request to ${API_BASE_URL}/users...`);
    
    // Add a unique ID as a query parameter for tracking
    const requestId = Date.now().toString();
    const response = await axiosInstance.post(`/users?requestId=${requestId}`, userPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });
    
    console.log("User registered successfully. Status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
    console.log("==== REGISTRATION PROCESS COMPLETED ====");
    
    return response.data;
  } catch (error) {
    console.error("==== REGISTRATION FAILED ====");
    console.error("Error details:", error.message);
    
    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error request:", error.request);
      console.error("No response received. This may indicate a network connectivity issue or the JSON server is not running.");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
    }
    
    console.error("Config used:", JSON.stringify(error.config, null, 2));
    console.error("==== END OF ERROR DETAILS ====");
    
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

// Function to get user bank accounts
export const getUserBankAccounts = async (userId) => {
  try {
    console.log(`Fetching bank accounts for user: ${userId}`);
    const response = await axiosInstance.get(`/users/${userId}`);
    const userData = response.data;
    
    // Return the bank accounts or empty array if none exist
    return userData.bankAccounts || [];
  } catch (error) {
    console.error("Error fetching user bank accounts:", error);
    throw error;
  }
};

// Function to add a bank account to user profile
export const addBankAccount = async (userId, bankAccount) => {
  try {
    console.log(`Adding bank account for user: ${userId}`);
    
    // First get the current user data
    const userResponse = await axiosInstance.get(`/users/${userId}`);
    const userData = userResponse.data;
    
    // Create or update the bank accounts array
    let bankAccounts = userData.bankAccounts || [];
    
    // If this is set as primary, update all others to not primary
    if (bankAccount.isPrimary) {
      bankAccounts = bankAccounts.map(account => ({
        ...account,
        isPrimary: false
      }));
    }
    
    // If this is the first account, make it primary by default
    if (bankAccounts.length === 0 && bankAccount.isPrimary === undefined) {
      bankAccount.isPrimary = true;
    }
    
    // Add unique ID to the bank account
    const newBankAccount = {
      ...bankAccount,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    // Add the new bank account to the array
    bankAccounts.push(newBankAccount);
    
    // Update the user record with the bank accounts
    const response = await axiosInstance.patch(`/users/${userId}`, {
      bankAccounts
    });
    
    console.log("Bank account added successfully:", newBankAccount);
    return response.data.bankAccounts;
  } catch (error) {
    console.error("Error adding bank account:", error);
    throw error;
  }
};
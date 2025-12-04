import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { getCachedData, invalidateCache, clearAllCaches, clearAllData, clearDataByPatterns } from "../app/utils/dataCaching";
import { trackApiCall } from "../app/utils/performanceMonitor";
import { Storage, SECURE_KEYS, STORAGE_KEYS } from "../app/utils/secureStorage";
import { ENV } from "../config/environment";

const API_BASE_URL = ENV.API_BASE_URL;
const API_TIMEOUT = ENV.API_TIMEOUT;

// Safe AsyncStorage wrapper to handle module resolution errors
const safeAsyncStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
        console.error('💡 This may require clearing Metro bundler cache: npx expo start --clear');
        console.error('⚠️ Falling back to null - API calls may fail without token');
      } else {
        console.error('AsyncStorage.getItem error:', error);
      }
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
        console.error('💡 This may require clearing Metro bundler cache: npx expo start --clear');
      } else {
        console.error('AsyncStorage.setItem error:', error);
      }
      // Don't throw - allow app to continue even if storage fails
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
      } else {
        console.error('AsyncStorage.removeItem error:', error);
      }
      // Don't throw - allow app to continue
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
      } else {
        console.error('AsyncStorage.clear error:', error);
      }
      // Don't throw - allow app to continue
    }
  },
  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
      } else {
        console.error('AsyncStorage.getAllKeys error:', error);
      }
      return [];
    }
  },
  multiRemove: async (keys) => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('asyncrequire') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('Unable to resolve module')
      )) {
        console.error('⚠️ AsyncStorage module resolution error detected:', error.message);
      } else {
        console.error('AsyncStorage.multiRemove error:', error);
      }
      // Don't throw - allow app to continue
    }
  }
};

// Global API error handler
const handleApiError = (error, endpoint) => {
  console.error(`API Error for ${endpoint}:`, error);

  if (error.name === 'AbortError') {
    return new Error('Request timeout - server took too long to respond');
  } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
    return new Error('Server connection failed - please check your internet connection');
  } else if (error.message.includes('HTTP error')) {
    return new Error(`Server error: ${error.message}`);
  } else if (error.message.includes('Network Error')) {
    return new Error('Network error - please check your internet connection');
  } else {
    return new Error(`Failed to fetch data from ${endpoint} - please try again later`);
  }
};

// Enhanced fetch wrapper with timeout and error handling
const enhancedFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to track performance and include token
axiosInstance.interceptors.request.use(async request => { // Made async to await secure storage
  request.metadata = { startTime: new Date().getTime() };
  const token = await safeAsyncStorage.getItem('auth_token'); // Get token from AsyncStorage using safe wrapper

  // Debug logging for authentication issues
  console.log(`🔐 API Request to: ${request.url}`);
  console.log(`🔑 Token present: ${!!token}`);
  if (token) {
    console.log(`🔑 Token length: ${token.length}`);
    console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
  }

  if (token && request.headers) {
    request.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log(`⚠️ No token found for request to: ${request.url}`);
  }
  return request;
});

// Add response interceptor to track performance
axiosInstance.interceptors.response.use(response => {
  const endTime = new Date().getTime();
  const duration = endTime - response.config.metadata.startTime;
  console.log(`Request to ${response.config.url} took ${duration}ms`);

  // Track API call performance
  trackApiCall(response.config.metadata.startTime);

  return response;
}, error => {
  // Global error handling for API responses
  if (error.response) {
    console.error(`API Error Response: ${error.response.status}`, error.response.data);
  } else if (error.request) {
    console.error("API Error Request: No response received", error.request);
  } else {
    console.error("API Error:", error.message);
  }
  return Promise.reject(error);
});

// Function to generate cache keys
const getCacheKey = (endpoint, id) => `${endpoint}_${id}`;

// NEW: Step 1: Check Phone Number & Send Verification Code
export const checkPhoneNumberAvailability = async (phoneNumber, email) => {
  try {
    console.log("API: Checking phone number availability:", phoneNumber, "and Email:", email);

    // Ensure we have valid values
    if (!phoneNumber || !email) {
      throw new Error("Phone number and email are required");
    }

    const payload = {
      phoneNumber: phoneNumber.trim(),
      email: email.trim()
    };

    console.log("API: Sending payload to /checkAvailable:", JSON.stringify(payload, null, 2));

    const response = await axiosInstance.post('/checkAvailable', payload);
    console.log("API Response - checkAvailable:", response.data);
    return response.data;

  } catch (error) {
    console.error("Error checking phone number availability:", error);
    throw error;
  }
};

// NEW: Step 2: Complete Basic Signup
export const completeBasicSignup = async (phoneNumber, email, passCode) => {
  try {
    console.log("API: Completing basic signup for phone:", phoneNumber, "and Email:", email);
    const response = await axiosInstance.post('/completeSignUp', {
      phoneNumber,
      email,
      passCode: Number(passCode)
    });
    console.log("API Response - completeSignUp:", response.data);
    // Assuming the token is returned here and needs to be stored
    if (response.data.data && response.data.data.token) {
      await safeAsyncStorage.setItem('auth_token', response.data.data.token);
      console.log("Auth token stored.");
    }
    return response.data;
  } catch (error) {
    console.error("Error completing basic signup:", error);
    throw error;
  }
};

// NEW: Step 3: Complete Full Registration (Placeholder, not fully used in current flow)
export const completeFullRegistration = async (registrationData) => {
  try {
    console.log("API: Completing full registration for user:", registrationData.email);
    // This endpoint requires a token, which should be handled by the interceptor
    const response = await axiosInstance.post('/completeRegistration', registrationData);
    console.log("API Response - completeRegistration:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error completing full registration:", error);
    throw error;
  }
};

// OLD `registerUser` function - commented out for refactoring
/*
export const registerUser = async (userData) => {
  try {
    console.log("==== REGISTRATION PROCESS STARTED ====");
    console.log("API Base URL:", API_BASE_URL);
    
    // Format phone number to ensure consistency
    let phoneNumber = userData.phone;
    if (phoneNumber.startsWith('+234')) {
      phoneNumber = phoneNumber.replace('+234', '0');
    }
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
    
    // Create empty transactions array
    const transactions = [];
    
    // Prepare the user data with only the fields we collect in our flow
    const userPayload = {
      id: Math.random().toString(36).substring(2, 6), // Generate a random ID
      phonenumber: phoneNumber,
      phone: phoneNumber, // Add both fields for compatibility
      pin: userData.pin,
      hasBiometric: userData.hasBiometric === 'true',
      // Set default values for required fields
      firstname: '',
      lastname: '',
      email: '',
      business: '',
      address: '',
      city: '',
      state: '',
      gender: "Not specified",
      dob: '',
      bvn: '',
      // Set default verification status
      verificationStatus: 'pending',
      verify_business: false,
      // Include transactions array
      transactions: transactions,
      // Add registration timestamp
      registeredAt: new Date().toISOString()
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
    
    // Send POST request to create user
    console.log(`Sending POST request to ${API_BASE_URL}/users...`);
    
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
    
    // After successful registration, we should invalidate any related caches
    await invalidateCache('users');
    
    return response.data;
  } catch (error) {
    console.error("==== REGISTRATION FAILED ====");
    console.error("Error details:", error.message);
    
    // Log more detailed error information
    if (error.response) {
      console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error("Error request:", error.request);
      console.error("No response received. This may indicate a network connectivity issue or the JSON server is not running.");
    } else {
      console.error("Error message:", error.message);
    }
    
    console.error("Config used:", JSON.stringify(error.config, null, 2));
    console.error("==== END OF ERROR DETAILS ====");
    
    throw error;
  }
};
*/

// Login user and fetch token and user data
export const loginUser = async (phoneNumber, passCodeOrFingerprint) => {
  try {
    let payload;
    if (typeof passCodeOrFingerprint === 'object' && passCodeOrFingerprint.fingerprint) {
      payload = { phoneNumber, fingerprint: true };
    } else {
      payload = { phoneNumber, passCode: passCodeOrFingerprint };
    }
    console.log('Attempting login with:', payload);
    const response = await axiosInstance.post('/login', payload);
    console.log('Login response:', response.data);

    if (response.data.data && response.data.data.token) {
      await safeAsyncStorage.setItem('auth_token', response.data.data.token);
      // Store user data if available
      if (response.data.data.user) {
        await safeAsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        await safeAsyncStorage.setItem('userId', response.data.data.user._id); // FIXED: use _id
      }
      await safeAsyncStorage.setItem('isLoggedIn', 'true');
    }
    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Fetch user by phone now logs in and returns user and token
export const fetchUserByPhone = async (phoneNumber, passCode) => {
  return loginUser(phoneNumber, passCode);
};

// Fetch current user details using token
export const fetchUser = async () => {
  try {
    const response = await axiosInstance.get('/userDetails');
    console.log('Fetched user details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
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

    // Invalidate contributor cache for the agent
    await invalidateCache(getCacheKey('contributors', contributorData.agentId));

    return response.data;
  } catch (error) {
    console.error("Error adding contributor:", error);
    throw error;
  }
};

// Updated function to fetch contributors based on agentId
export const fetchContributors = async (agentId) => {
  return getCachedData(
    getCacheKey('contributors', agentId),
    async () => {
      try {
        const response = await axiosInstance.get(`/contributors?agentId=${agentId}`);
        console.log("Contributors fetched successfully:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching contributors:", error);
        throw error;
      }
    },
    // Cache contributor list for 2 minutes
    1000 * 60 * 2
  );
};

// Function to fetch transactions for a user by userId
export const fetchTransactions = async (userId) => {
  return getCachedData(
    getCacheKey('transactions', userId),
    async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}`);
        console.log("User fetched successfully for transactions");

        // Check if the user has transactions data
        if (response.data && response.data.transactions) {
          return response.data.transactions;
        } else {
          console.log("No transactions found for this user");
          return [];
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
    },
    // Cache transactions for 2 minutes
    1000 * 60 * 2
  );
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

// Update user profile
export const updateUser = async (userId, updateData) => {
  try {
    const response = await axiosInstance.patch('/updateUser', {
      email: updateData.email,
      password: updateData.password,
      city: updateData.city,
      address: updateData.address,
      picture: updateData.picture
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
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
export const getUserBankAccounts = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/account/settlement-accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    // If the endpoint returns 404, treat as no accounts
    if (response.status === 404) {
      console.log('[api.js] No bank accounts found (404 response), returning empty array');
      return [];
    }
    const data = await response.json();
    console.log('[api.js] getUserBankAccounts response:', data);
    // Handle different response structures
    if ((data.status === 'Success' || data.status === 'Successfully gotten the settlement accounts') && Array.isArray(data.data)) {
      console.log('[api.js] Returning data array directly:', data.data);
      return data.data;
    } else if ((data.status === 'Success' || data.status === 'Successfully gotten the settlement accounts') && data.data && Array.isArray(data.data.settlementAccounts)) {
      console.log('[api.js] Returning settlementAccounts array:', data.data.settlementAccounts);
      return data.data.settlementAccounts;
    } else if (data.status === 'Failed' && data.message === 'No accounts found') {
      console.log('[api.js] No accounts or user found, returning empty array');
      return [];
    } else {
      console.log('[api.js] No valid data found, returning empty array');
      return [];
    }
  } catch (error) {
    console.error('Error fetching user bank accounts:', error);
    return [];
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

// Function to fetch contributor by phone number for a specific agent
export const fetchContributorByPhone = async (agentId, phoneNumber) => {
  try {
    console.log(`Looking for contributor with phone ${phoneNumber} for agent ${agentId}`);

    // First fetch all contributors for this agent
    const contributors = await fetchContributors(agentId);

    // Make sure contributors is an array before using find
    if (!Array.isArray(contributors)) {
      console.warn("No contributors array returned for agent:", agentId);
      throw new Error(`No contributors found for agent`);
    }

    console.log(`Found ${contributors.length} total contributors for agent ${agentId}`);

    // Format phone number to remove country code if present
    let formattedPhoneNumber = phoneNumber;
    if (phoneNumber.startsWith('+234')) {
      formattedPhoneNumber = phoneNumber.replace('+234', '0');
    }

    console.log("Searching with formatted phone:", formattedPhoneNumber);

    // Find the contributor with matching phone number
    const contributor = contributors.find(c =>
      c.phonenumber === formattedPhoneNumber ||
      c.phoneNumber === formattedPhoneNumber ||
      c.phone === formattedPhoneNumber
    );

    // Log all contributor phone numbers for debugging
    console.log("Available phone numbers:", contributors.map(c => c.phonenumber || c.phoneNumber || c.phone));

    if (!contributor) {
      console.warn(`No contributor found with phone number ${formattedPhoneNumber} among ${contributors.length} contributors`);
      throw new Error(`No contributor found with phone number ${phoneNumber}`);
    }

    console.log("Contributor found:", contributor);
    return contributor;
  } catch (error) {
    console.error("Error fetching contributor by phone:", error);
    throw error;
  }
};

// Complete full registration
export const completeRegistration = async (userData) => {
  try {
    const response = await axiosInstance.post('/completeRegistration', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName || '',
      email: userData.email,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender
    });
    return response.data;
  } catch (error) {
    console.error('Error completing registration:', error);
    throw error;
  }
};

// Initiate identity verification
export const initiateIdentityVerification = async (identityData) => {
  try {
    // Send the identityData object as-is
    const response = await axiosInstance.post('/initiate-identity', identityData);
    return response.data;
  } catch (error) {
    console.error('Error initiating identity verification:', error);
    throw error;
  }
};

// Validate identity and create sub-account
export const validateIdentity = async (otp) => {
  try {
    const response = await axiosInstance.post('/validate-identity', {
      otp: otp
    });
    return response.data;
  } catch (error) {
    console.error('Error validating identity:', error);
    throw error;
  }
};

// Get customers with pagination
export const getCustomers = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get('/getCustomers', {
      params: {
        page,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get user's bank account details
export const getBankAccount = async (userId) => {
  try {
    const response = await axiosInstance.get(`/getBankAccount/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bank account:', error);
    throw error;
  }
};

// Fetch contributor by id
export const fetchContributorById = async (id) => {
  const response = await axiosInstance.get(`/contributors/${id}`);
  return response.data;
};

// Fetch grouped contributors
export const fetchGroupedContributors = async () => {
  try {
    const response = await axiosInstance.get('/contributors/group');
    if (response.data && response.data.status === 'Success') {
      return response.data.data || [];
    } else {
      console.error('Error fetching grouped contributors:', response.data);
      throw new Error(response.data.message || 'Failed to fetch grouped contributors');
    }
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
};

// Fetch grouped contributor photos for daily, weekly, monthly using fetch directly
export const fetchGroupedContributorPhotos = async () => {
  try {
    // Get token from AsyncStorage
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/contributor-account/group', {
      headers
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching grouped contributor photos:', errorData);
      throw new Error(errorData.message || 'Failed to fetch grouped contributor photos');
    }
    const data = await response.json();
    console.log(data)
    if (data && data.status === 'Success') {
      return data.data || [];
    } else {
      console.error('Error fetching grouped contributor photos:', data);
      throw new Error(data.message || 'Failed to fetch grouped contributor photos');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// Fetch merchant dashboard account directly (not using baseURL or axiosInstance)
export const fetchMerchantDashboardAccount = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('https://esusu-server.onrender.com/api/account/dashboard', { headers });
    const data = await res.json();
    console.log('Merchant Dashboard Account Response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching merchant dashboard account:', error);
    throw error;
  }
};

// Fetch user's settlement accounts (bank accounts)
export const fetchSettlementAccounts = async () => {
  try {
    let token = '';
    try {
      token = await safeAsyncStorage.getItem('auth_token') || '';
    } catch (e) {
      console.log('Could not get token from AsyncStorage:', e);
    }
    const response = await fetch('https://esusu-server.onrender.com/api/account/settlement-accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    console.log('[api.js] Settlement accounts response:', data);
    if (data.status === 'Success' && data.data && Array.isArray(data.data.settlementAccounts)) {
      return data.data.settlementAccounts;
    } else {
      throw new Error(data.message || 'Failed to fetch bank accounts');
    }
  } catch (err) {
    console.error('Error fetching settlement accounts:', err);
    throw err;
  }
};

// Fetch transaction history
export const fetchTransactionHistory = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/account/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    const data = await response.json();
    console.log('[api.js] Transaction history response:', data);

    if (data.status === 'Success' && data.data) {
      // Ensure we return an array
      if (Array.isArray(data.data)) {
        return data.data;
      } else if (data.data.transactions && Array.isArray(data.data.transactions)) {
        return data.data.transactions;
      } else {
        console.log('[api.js] Transaction history data is not in expected format, returning empty array');
        return [];
      }
    } else {
      console.log('[api.js] No valid transaction history data found, returning empty array');
      return [];
    }
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

// Function to fetch contributor details for deposit
export const fetchContributorDetailsForDeposit = async (phoneNumber) => {
  try {
    console.log(`Fetching contributor details for deposit with phone: ${phoneNumber}`);

    // Get token from AsyncStorage
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/contributor-account/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        type: 'deposit',
        phoneNumber: phoneNumber
      })
    });

    const data = await response.json();
    console.log("Contributor details response:", data);

    if (data && data.status === 'Success') {
      return data.data;
    } else {
      throw new Error(data?.message || 'Failed to fetch contributor details');
    }
  } catch (error) {
    console.error("Error fetching contributor details for deposit:", error);
    throw error;
  }
};

// Function to credit contributor account
export const creditContributorAccount = async (phoneNumber, amount) => {
  try {
    console.log(`Crediting contributor account with phone: ${phoneNumber}, amount: ${amount}`);

    // Get token from AsyncStorage
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/contributor-account/credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        amount: amount
      })
    });

    const data = await response.json();
    console.log("Credit contributor account response:", data);

    if (data && data.status === 'Success') {
      return data;
    } else {
      throw new Error(data?.message || 'Failed to credit contributor account');
    }
  } catch (error) {
    console.error("Error crediting contributor account:", error);
    throw error;
  }
};

// Function to fetch contributor details for withdrawal
export const fetchContributorDetailsForWithdrawal = async (phoneNumber) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/contributor-account/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        type: 'withraw',
        phoneNumber: phoneNumber
      })
    });
    const data = await response.json();
    if (data && data.status === 'Success') {
      return data.data;
    } else {
      throw new Error(data?.message || 'Failed to fetch contributor details');
    }
  } catch (error) {
    throw error;
  }
};

// Fetch public bank list with token
export const fetchBankList = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/verification/safehaven/banks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

// Function to set transaction pin
export const setTransactionPin = async (transactionPin) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/account/set-transaction-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ transactionPin })
    });
    const data = await response.json();
    if (data && data.status === 'Success') {
      return data;
    } else {
      throw new Error(data?.message || 'Failed to set transaction pin');
    }
  } catch (error) {
    console.error('Error setting transaction pin:', error);
    throw error;
  }
};

// Function to transfer to bank
export const transferToBank = async (payload) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    // Log the full body data
    console.log('transferToBank body:', payload);
    const response = await fetch('https://esusu-server.onrender.com/api/account/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Transfer to Bank API Response:', data);
    return data;
  } catch (error) {
    console.error('Error transferring to bank:', error);
    throw error;
  }
};

// Request withdrawal code
export const requestWithdrawalCode = async (phoneNumber) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/account/withdrawal-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ phoneNumber })
    });
    const data = await response.json();
    console.log('Withdrawal Code API Response:', data);
    return data;
  } catch (error) {
    console.error('Error requesting withdrawal code:', error);
    throw error;
  }
};

// Verify withdrawal code
export const verifyWithdrawalCode = async (phoneNumber, code) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch('https://esusu-server.onrender.com/api/account/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ phoneNumber, code })
    });
    const data = await response.json();
    console.log('Verify Withdrawal Code API Response:', data);
    return data;
  } catch (error) {
    console.error('Error verifying withdrawal code:', error);
    throw error;
  }
};

// Logout user: call backend and clear all local storage
export const logoutUser = async () => {
  try {
    await axiosInstance.post('/logout');
    await forceClearAllData();
    console.log('User logged out and ALL local storage/caches cleared.');
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if backend logout fails, clear local data
    await forceClearAllData();
    throw error;
  }
};

// Force clear ALL data stored on the device
export const forceClearAllData = async () => {
  try {
    console.log('Starting force clear of all device data...');

    // 1. Use the comprehensive clearAllData function first
    await clearAllData();
    console.log('✓ All data cleared via clearAllData');

    // 2. Clear all caches as backup
    await clearAllCaches();
    console.log('✓ All caches cleared');

    // 3. Clear user and cache data specifically
    await clearDataByPatterns([
      'user',
      'auth',
      'token',
      'cache',
      'settings',
      'contributor',
      'transaction',
      'commission',
      'dashboard',
      'account',
      'bank',
      'settlement',
      'biometric',
      'pin',
      'session',
      'login',
      'logout',
      'tier',
      'withdraw',
      'data'
    ]);
    console.log('✓ User and cache data cleared by patterns');

    // 4. Clear specific known keys (in case they were missed)
    const specificKeys = [
      'auth_token',
      'userId',
      'userData',
      'merchantDashboardAccount',
      'transactionHistory',
      'contributors_data',
      'contributor_list_daily',
      'contributor_list_weekly',
      'contributor_list_monthly',
      'settlementAccounts',
      'bankAccounts',
      'commissionData',
      'notificationSettings',
      'appSettings',
      'theme',
      'language',
      'onboardingComplete',
      'lastSyncTime',
      'userPreferences',
      'biometricEnabled',
      'transactionPin',
      'lastLoginTime',
      'sessionData',
      'tempData',
      'uploadCache',
      'imageCache',
      'documentCache',
      // Add all the cache keys used in the app
      'settings_user',
      'tier_user',
      'dashboard_user',
      'account_user',
      'commission_withdraw',
      'commission_transactions',
      'commission_data',
      'settlement_accounts',
      'bank_list',
      'contributor_list',
      'cache_settings_user',
      'cache_tier_user',
      'cache_dashboard_user',
      'cache_account_user',
      'cache_commission_withdraw',
      'cache_commission_transactions',
      'cache_commission_data',
      'cache_settlement_accounts',
      'cache_bank_list',
      'cache_contributor_list',
      'cache_contributors_data',
      // Additional keys from clearAllData.ts
      'userPhone',
      'isLoggedIn',
      'merchantDashboardAccount',
      'transactionHistory',
      'contributors_data',
      'contributor_list_daily',
      'contributor_list_weekly',
      'contributor_list_monthly',
      'settlementAccounts',
      'bankAccounts',
      'commissionData'
    ];

    for (const key of specificKeys) {
      try {
        await safeAsyncStorage.removeItem(key);
        await safeAsyncStorage.removeItem(`cache_${key}`);
      } catch (e) {
        // Ignore errors for individual key removal
      }
    }
    console.log('✓ Specific keys cleared');

    // 4. Clear any potential cache keys with patterns
    try {
      const allKeys = await safeAsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith('cache_') ||
        key.includes('contributor') ||
        key.includes('transaction') ||
        key.includes('user') ||
        key.includes('auth') ||
        key.includes('data') ||
        key.includes('settings') ||
        key.includes('tier') ||
        key.includes('commission') ||
        key.includes('dashboard') ||
        key.includes('account') ||
        key.includes('bank') ||
        key.includes('settlement') ||
        key.includes('withdraw')
      );

      if (cacheKeys.length > 0) {
        await safeAsyncStorage.multiRemove(cacheKeys);
        console.log(`✓ Cleared ${cacheKeys.length} additional cache keys`);
      }
    } catch (e) {
      console.log('Error clearing pattern-based keys:', e);
    }

    // 5. Clear any potential file system cache (if using expo-file-system)
    try {
      const FileSystem = await import('expo-file-system');
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        for (const file of files) {
          try {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
          } catch (e) {
            // Ignore individual file deletion errors
          }
        }
        console.log('✓ File system cache cleared');
      }
    } catch (e) {
      console.log('File system cache clear skipped (expo-file-system not available)');
    }

    // 6. Clear any potential image cache
    try {
      const ImageCache = await import('expo-image');
      if (ImageCache.clearMemoryCache) {
        await ImageCache.clearMemoryCache();
        console.log('✓ Image memory cache cleared');
      }
    } catch (e) {
      console.log('Image cache clear skipped (expo-image not available)');
    }

    // 7. Clear any potential web cache (if running on web)
    if (typeof window !== 'undefined' && window.caches) {
      try {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        console.log('✓ Web caches cleared');
      } catch (e) {
        console.log('Web cache clear failed:', e);
      }
    }

    // 8. Clear any potential SQLite databases (if using expo-sqlite)
    try {
      // Check if expo-sqlite is available before importing
      const SQLite = require('expo-sqlite');
      if (SQLite && SQLite.openDatabase) {
        const db = SQLite.openDatabase('app.db');
        if (db) {
          await new Promise((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql('DELETE FROM sqlite_sequence', [], resolve, reject);
            });
          });
          console.log('✓ SQLite database cleared');
        }
      }
    } catch (e) {
      console.log('SQLite clear skipped (expo-sqlite not available)');
    }

    // 9. MMKV storage - REMOVED (package uninstalled for 16KB compatibility)
    // MMKV caused Metro bundler errors and had 16KB alignment issues
    // Using AsyncStorage exclusively instead
    console.log('MMKV not available - using AsyncStorage only');


    // 10. Clear any potential SecureStore (if using expo-secure-store)
    try {
      // Check if expo-secure-store is available before importing
      const SecureStore = require('expo-secure-store');
      if (SecureStore && SecureStore.deleteItemAsync) {
        const secureKeys = [
          'auth_token',
          'userId',
          'transactionPin',
          'biometricKey',
          'encryptionKey',
          'sessionToken'
        ];

        for (const key of secureKeys) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (e) {
            // Ignore individual key deletion errors
          }
        }
        console.log('✓ SecureStore cleared');
      }
    } catch (e) {
      console.log('SecureStore clear skipped (expo-secure-store not available)');
    }

    console.log('🎉 ALL DEVICE DATA CLEARED SUCCESSFULLY!');

  } catch (error) {
    console.error('Error during force clear:', error);
    // Try to clear at least AsyncStorage as fallback
    try {
      await safeAsyncStorage.clear();
      console.log('Fallback: AsyncStorage cleared');
    } catch (fallbackError) {
      console.error('Even fallback clear failed:', fallbackError);
    }
  }
};

// Fetch and log current user details (for debugging after login)
export const logCurrentUserDetails = async () => {
  try {
    const user = await fetchUser();
    console.log('Current user details after login:', user);
    return user;
  } catch (error) {
    console.error('Error fetching current user details:', error);
    throw error;
  }
};

export const uploadCacDocument = async ({ identityType, businessAddress, regNumber, document, businessName }) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('identityType', identityType);
    formData.append('businessAddress', businessAddress);
    formData.append('regNumber', regNumber);
    formData.append('businessName', businessName);
    // document: for web, a File object; for mobile, { uri, name, type }
    if (document) {
      formData.append('document', document);
    }
    const response = await fetch('https://esusu-server.onrender.com/api/account/upload/cac-document', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        // Do NOT set Content-Type, let fetch set it for FormData
      },
      body: formData,
    });
    const data = await response.json();
    console.log('CAC upload response:', data);
    if ((data && data.status === 'Success') || data.success === true) {
      return data;
    }
    throw new Error(data?.message || 'Failed to upload CAC document');
  } catch (error) {
    console.error('Error uploading CAC document:', error);
    throw error;
  }
};

export const uploadBusinessLocation = async ({ locationImage, longitude, latitude, city, state, notes }) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const formData = new FormData();
    if (locationImage) formData.append('locationImage', locationImage);
    if (longitude) formData.append('longitude', longitude);
    if (latitude) formData.append('latitude', latitude);
    if (city) formData.append('city', city);
    if (state) formData.append('state', state);
    if (notes) formData.append('notes', notes);
    const response = await fetch('https://esusu-server.onrender.com/api/merchant/business-location', {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: formData,
    });
    const data = await response.json();
    console.log('Business location upload response:', data);
    if ((data && data.status === 'Success') || data.success === true) {
      return data;
    }
    throw new Error(data?.message || 'Failed to upload business location');
  } catch (error) {
    console.error('Error uploading business location:', error);
    throw error;
  }
};

export const saveBankAccount = async ({ accountNumber, accountName, bankCode, sessionId, isPrimary, bankName }) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const response = await fetch('https://esusu-server.onrender.com/api/account/settlement-accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ accountNumber, accountName, bankCode, sessionId, isPrimary, bankName })
    });
    const data = await response.json();
    if ((data && data.status === 'Success') || data.success === true) {
      return data;
    }
    throw new Error(data?.message || 'Failed to save bank account');
  } catch (error) {
    console.error('Error saving bank account:', error);
    throw error;
  }
};

// Fetch commission and history for the current user
export const fetchAccountCommission = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await enhancedFetch('https://esusu-server.onrender.com/api/account/commission', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    const data = await response.json();
    console.log('Account commission:', data);
    return data;
  } catch (error) {
    throw handleApiError(error, 'commission endpoint');
  }
};

// Send GET request to getOtp endpoint for password reset
export const getOtpByPhone = async (phoneNumber) => {
  try {
    const url = `https://esususerver.onrender.com/api/merchant/getOtp/${encodeURIComponent(phoneNumber)}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to request OTP');
    }
    const data = await response.json();
    console.log('OTP request response:', data);
    return data;
  } catch (error) {
    console.error('Error requesting OTP:', error);
    throw error;
  }
};

// Send POST request to verify-otp endpoint for OTP verification
export const verifyOtp = async (phoneNumber, otp) => {
  try {
    const response = await axiosInstance.post('/verify-otp', { phoneNumber, otp });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'OTP verification failed');
  }
};

// Send POST request to updatePasscode endpoint for passcode reset
export const updatePasscode = async (newPassCode) => {
  try {
    const url = 'https://esususerver.onrender.com/api/merchant/updatePasscode';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassCode })
    });
    if (!response.ok) {
      throw new Error('Failed to update passcode');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating passcode:', error);
    throw error;
  }
};

// Get referral data for the current merchant
export const getReferrals = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/merchant/get-referral', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    const data = await response.json();
    console.log('Referrals response:', data);

    if (data && data.status === 'Success') {
      return data.data;
    } else {
      throw new Error(data?.message || 'Failed to fetch referrals');
    }
  } catch (error) {
    console.error('Error fetching referrals:', error);
    throw error;
  }
};

// Save referral code (can only be done once by a user)
export const saveReferral = async (referralCode) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/merchant/save-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ referralCode })
    });

    const data = await response.json();
    console.log('Save referral response:', data);

    if (data && data.status === 'Success') {
      return data;
    } else {
      throw new Error(data?.message || 'Failed to save referral code');
    }
  } catch (error) {
    console.error('Error saving referral code:', error);
    throw error;
  }
};

// Withdraw referral bonus
export const withdrawBonus = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/account/withraw-bonus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
      // No body data needed, just authentication
    });

    const data = await response.json();
    console.log('Withdraw bonus response:', data);

    if (data && data.status === 'Success') {
      return data;
    } else {
      throw new Error(data?.message || 'Failed to withdraw bonus');
    }
  } catch (error) {
    console.error('Error withdrawing bonus:', error);
    throw error;
  }
};

// Function to check current authentication status
export const checkAuthStatus = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const tokenExists = !!token;

    console.log('🔍 Authentication Status Check:');
    console.log(`🔑 Token exists: ${tokenExists}`);

    if (token) {
      console.log(`🔑 Token length: ${token.length}`);
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);

      // Try to decode the token to check if it's expired
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const isExpired = currentTime > expirationTime;

          console.log(`⏰ Token expiration: ${new Date(expirationTime).toISOString()}`);
          console.log(`⏰ Current time: ${new Date(currentTime).toISOString()}`);
          console.log(`⏰ Token expired: ${isExpired}`);

          if (isExpired) {
            console.log('❌ Token is expired! This could be causing 403 errors.');
            // Clear expired token
            await safeAsyncStorage.removeItem('auth_token');
            console.log('🗑️ Expired token cleared');
          }
        }
      } catch (decodeError) {
        console.log('⚠️ Could not decode token payload:', decodeError.message);
      }
    } else {
      console.log('❌ No authentication token found!');
    }

    return {
      hasToken: tokenExists,
      token: token
    };
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return {
      hasToken: false,
      token: null,
      error: error.message
    };
  }
};

// Function to register/update device information
export const registerDevice = async (deviceData) => {
  try {
    console.log('📱 Registering device information:', deviceData);

    const response = await axiosInstance.post('https://esusu-server.onrender.com/api/merchant/register-device', deviceData);
    console.log('✅ Device registered successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error registering device:', error);

    // Don't throw error for device registration failures to avoid breaking app flow
    if (error.response) {
      console.error('Device registration failed with status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received for device registration');
    } else {
      console.error('Device registration error:', error.message);
    }

    // Return a success indicator even if registration fails
    return { success: false, error: error.message };
  }
};

// Fetch merchant notification settings
export const fetchMerchantNotificationSettings = async () => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/merchant/notification-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    const data = await response.json();
    console.log('Merchant notification settings response:', data);

    if (data && data.status === 'Success') {
      return data.data;
    } else {
      throw new Error(data?.message || 'Failed to fetch notification settings');
    }
  } catch (error) {
    console.error('Error fetching merchant notification settings:', error);
    throw error;
  }
};

// Update merchant notification settings
export const updateMerchantNotificationSettings = async (settings) => {
  try {
    const token = await safeAsyncStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('https://esusu-server.onrender.com/api/merchant/notification-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(settings)
    });

    const data = await response.json();
    console.log('Update merchant notification settings response:', data);

    if (data && data.status === 'Success') {
      return data;
    } else {
      throw new Error(data?.message || 'Failed to update notification settings');
    }
  } catch (error) {
    console.error('Error updating merchant notification settings:', error);
    throw error;
  }
};
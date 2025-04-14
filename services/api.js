import axios from "axios";
const API_BASE_URL = 'http://172.20.10.5:3001';


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
    const response = await axiosInstance.post("/contributors", contributorData);
    console.log("Contributor added successfully:", response.data);
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
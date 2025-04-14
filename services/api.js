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
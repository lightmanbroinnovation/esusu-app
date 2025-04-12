import axios from "axios";

const API_BASE_URL = 'http://192.168.100.62:8082'; // Ensure this is the correct base URL

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

export const fetchUser = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    console.log("User details fetched successfully:", response.data);
    return response.data; // Ensure this returns the user data directly
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
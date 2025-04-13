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
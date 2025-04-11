import axios from "axios";
// Define base URL directly instead of using dotenv
const API_BASE_URL = 'http://192.168.100.20:8082'; // Direct value instead of using .env

const axiosInstance = axios.create({
  baseURL: "http://192.168.100.20:8082", // Use the environment variable
  timeout: 5000, // Timeout increased to 5 seconds (you can adjust as needed)
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
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};
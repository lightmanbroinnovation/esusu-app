import axios from "axios";
import { API_BASE_URL } from "@env"; // Import the environment variable

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // Use the environment variable
  timeout: 5000, // Timeout increased to 5 seconds (you can adjust as needed)
});

export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/users", userData);
    console.log("User registered successfully:", response.data);
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
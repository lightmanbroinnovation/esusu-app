import axios from "axios";

const axiosInstance = axios.create({
  baseURL: 'http://192.168.0.116:8082', // Ensure this is your correct server URL
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

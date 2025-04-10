import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialIcons, FontAwesome, Entypo, FontAwesome6, Fontisto   } from "@expo/vector-icons"; // Import icons from @expo/vector-icons

const Footer = () => {
  const [activePage, setActivePage] = useState("Home"); // Default active page is Home

  const handlePress = (page: string) => {
    setActivePage(page);
    console.log(`Navigating to ${page}`); // Replace with navigation logic
  };

  return (
    <View className="flex-row justify-around bg-white py-3 border-t border-gray-200">
      {/* Home Button */}
      <TouchableOpacity
        className={`items-center ${
          activePage === "Home" ? "" : ""
        }`}
        onPress={() => handlePress("Home")}
      >
        <Entypo 
          name="home"
          size={24}
          className={`${
            activePage === "Home" ? "bg-[#E5F1FF] rounded-lg p-1 w-full text-center" : ""
          }`}
          color={activePage === "Home" ? "#0072CE" : "#000"}
        />
        <Text className="text-xs mt-1 text-gray-500">Home</Text>
      </TouchableOpacity>

      {/* Contributor Button */}
      <TouchableOpacity
        className={`items-center ${
          activePage === "Contributor" ? " " : ""
        }`}
        onPress={() => handlePress("Contributor")}
      >
        <FontAwesome6 
          name="users"
          size={24}
          className={`${
            activePage === "Contributor" ? "bg-[#E5F1FF] rounded-lg p-1 w-full text-center" : ""
          }`}
          color={activePage === "Contributor" ? "#0072CE" : "#000"}
        />
        <Text className="text-xs mt-1 text-gray-500">Contributor</Text>
      </TouchableOpacity>

      {/* Commission Button */}
      <TouchableOpacity
        className={`items-center ${
          activePage === "Commission" ? "" : ""
        }`}
        onPress={() => handlePress("Commission")}
      >
        <Fontisto 
          name="wallet"
          size={24}
          className={`${
            activePage === "Commission" ? "bg-[#E5F1FF] rounded-lg p-1 w-full text-center" : ""
          }`}
          color={activePage === "Commission" ? "#0072CE" : "#000"}
        />
        <Text className="text-xs mt-1 text-gray-500">Commission</Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        className={`items-center ${
          activePage === "Profile" ? "" : ""
        }`}
        onPress={() => handlePress("Profile")}
      >
        <FontAwesome
          name="user"
          size={24}
          className={`${
            activePage === "Profile" ? "bg-[#E5F1FF] rounded-lg p-1 w-full text-center" : ""
          }`}
          color={activePage === "Profile" ? "#0072CE" : "#000"}
        />
        <Text className="text-xs mt-1 text-gray-500">Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;

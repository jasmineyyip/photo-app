import React, { useState } from "react";
import { View, Button, Image, StyleSheet, ActivityIndicator, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function App() {
  const [image, setImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // Track upload state

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Camera access is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // Save the photo URI
      console.log("Photo taken:", result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (!image) {
      alert("Please take a photo first!");
      return;
    }

    setIsUploading(true); // Start the loading spinner

    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const fileName = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setUploadedImageUrl(downloadURL); // Save the download URL
      alert("Photo uploaded successfully!");
      console.log("Uploaded photo URL:", downloadURL);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    } finally {
      setIsUploading(false); // Stop the loading spinner
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Take Photo" onPress={takePhoto} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {isUploading ? (
        <ActivityIndicator size="large" color="#0000ff" /> // Show spinner during upload
      ) : (
        <Button title="Upload Photo" onPress={uploadPhoto} />
      )}
      {uploadedImageUrl && (
        <View>
          <Text>Uploaded Image URL:</Text>
          <Text>{uploadedImageUrl}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: 200, height: 200, marginTop: 20 },
});
import React, { useState } from "react";
import {
  View,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage, db } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore"; // Firestore functions
import * as ImageManipulator from "expo-image-manipulator";

export default function App() {
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const resizeImage = async (uri) => {
    const resizedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return resizedImage.uri;
  };

  const uploadPhotoAndSaveUser = async () => {
    if (!username.trim()) {
      alert("Please enter a username!");
      return;
    }

    if (!image) {
      alert("Please take a photo!");
      return;
    }

    setIsUploading(true);

    try {
      // Resize and upload the image
      const resizedUri = await resizeImage(image);
      const response = await fetch(resizedUri);
      const blob = await response.blob();

      const fileName = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save user document to Firestore
      const usersCollection = collection(db, "users");
      await addDoc(usersCollection, {
        username: username,
        photo: fileName, // Save the image's storage path, not the full URL
      });

      alert("User saved successfully!");
      console.log("User saved:", { username, photo: fileName });

      // Reset the form
      setUsername("");
      setImage(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={username}
        onChangeText={setUsername}
      />
      <Button title="Take Photo" onPress={takePhoto} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {isUploading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Submit" onPress={uploadPhotoAndSaveUser} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', justifyContent: "center", alignItems: "center", padding: 16 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 16 },
  image: { width: 200, height: 200, marginTop: 20 },
});
import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  TextInput,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage, db } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs } from "firebase/firestore"; // Firestore functions
import * as ImageManipulator from "expo-image-manipulator";

export default function App() {
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]); // State for storing users

  useEffect(() => {
    // Fetch users from Firestore when the app loads
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const snapshot = await getDocs(usersCollection);
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

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
      setImage(result.assets[0].uri);
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
      const resizedUri = await resizeImage(image);
      const response = await fetch(resizedUri);
      const blob = await response.blob();
  
      const fileName = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
  
      // Get the full download URL
      const downloadURL = await getDownloadURL(storageRef);
  
      // Save user document to Firestore
      const usersCollection = collection(db, "users");
      await addDoc(usersCollection, {
        username: username,
        photo: downloadURL, // Save the full download URL
      });
  
      alert("User saved successfully!");
      console.log("User saved:", { username, photo: downloadURL });
  
      // Refresh the user list
      const snapshot = await getDocs(usersCollection);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
  
      setUsername("");
      setImage(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user.");
    } finally {
      setIsUploading(false);
    }
  };  

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.username}>{item.username}</Text>
      <Image source={{ uri: item.photo }} style={styles.userPhoto} />
    </View>
  );  

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
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        style={styles.userList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingVertical: 100, paddingHorizontal: 20 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 16 },
  image: { width: 200, height: 200, marginTop: 20 },
  userList: { marginTop: 20 },
  userCard: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  username: { fontSize: 16, marginRight: 10 },
  userPhoto: { width: 100, height: 100 },
});
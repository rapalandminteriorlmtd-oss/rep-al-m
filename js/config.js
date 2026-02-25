// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "drhrpjelf";
const CLOUDINARY_UPLOAD_PRESET = "repalandm";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPLxcA5osXADb5enwKSoEulyhgnGGzIUg",
    authDomain: "rep-alandm.firebaseapp.com",
    projectId: "rep-alandm",
    storageBucket: "rep-alandm.firebasestorage.app",
    messagingSenderId: "362634556700",
    appId: "1:362634556700:web:3edf371ba928553eda36d9",
    measurementId: "G-6QDD4ZH26K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Export common Firestore helpers
const collectionsRef = db.collection('collections');
const furnitureRef = db.collection('furniture');
const inquiriesRef = db.collection('inquiries');
const settingsRef = db.collection('settings');

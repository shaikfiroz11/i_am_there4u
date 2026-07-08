import { initializeApp, deleteApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ==========================================
// 1. HARDCODE YOUR FIREBASE DETAILS HERE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAhK1HgPvFDHnYeSvwIvud0ANYkJmjJQa0",
  authDomain: "mobilealarm-49e9f.firebaseapp.com",
  databaseURL: "https://mobilealarm-49e9f-default-rtdb.firebaseio.com/",
  projectId: "mobilealarm-49e9f",
  storageBucket: "mobilealarm-49e9f.firebasestorage.app",
  messagingSenderId: "37148310619",
  appId: "1:37148310619:web:791d73bf123c97906f137e"
};

// DOM Elements
const triggerBtn = document.getElementById('triggerBtn');
const btnText = document.getElementById('btnText');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

let db = null;
let databaseRef = null;
let isRinging = false;

// 2. Initialize Firebase connection
function connectToFirebase() {
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    statusText.innerText = "Setup Required: Edit web/app.js";
    statusIndicator.className = "status-indicator";
    triggerBtn.disabled = true;
    return;
  }

  try {
    statusText.innerText = "Connecting...";
    statusIndicator.className = "status-indicator";
    triggerBtn.disabled = true;

    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    databaseRef = ref(db, 'alarm');

    // Attach real-time listener for two-way synchronization
    onValue(databaseRef, (snapshot) => {
      const data = snapshot.val();
      
      statusIndicator.classList.add('connected');
      statusText.innerText = "Connected to Firebase";
      triggerBtn.disabled = false;

      if (data && data.status === 'ringing') {
        isRinging = true;
        triggerBtn.classList.add('ringing');
        btnText.innerText = "RINGING...";
      } else {
        isRinging = false;
        triggerBtn.classList.remove('ringing');
        btnText.innerText = "TRIGGER ALARM";
      }
    }, (error) => {
      console.error(error);
      statusText.innerText = "Firebase Connection Error";
      statusIndicator.className = "status-indicator";
      triggerBtn.disabled = true;
    });

  } catch (err) {
    console.error(err);
    statusText.innerText = "Init Failed (Check Credentials)";
    statusIndicator.className = "status-indicator";
    triggerBtn.disabled = true;
  }
}

// 3. Trigger/Stop Click Action
triggerBtn.addEventListener('click', () => {
  if (!db || !databaseRef) return;

  if (isRinging) {
    // If it's ringing, click to turn it off
    set(databaseRef, {
      status: 'idle',
      triggeredAt: Date.now()
    }).catch(err => {
      console.error("Failed to write to DB:", err);
    });
  } else {
    // If idle, trigger alarm
    set(databaseRef, {
      status: 'ringing',
      triggeredAt: Date.now()
    }).catch(err => {
      console.error("Failed to write to DB:", err);
    });
  }
});

// Auto-run on load
connectToFirebase();

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

// ==========================================
// 4. STARRY SKY BACKGROUND ANIMATION
// ==========================================
function initStarrySky() {
  const canvas = document.getElementById('starryCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];
  let shootingStar = null;
  let nextShootingStarTime = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initializeStars();
  }

  function initializeStars() {
    stars = [];
    const numStars = Math.floor((width * height) / 15000) || 50;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.02 + 0.005,
        fading: Math.random() > 0.5
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw Stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
      if (star.fading) {
        star.alpha -= star.speed;
        if (star.alpha <= 0.1) {
          star.alpha = 0.1;
          star.fading = false;
        }
      } else {
        star.alpha += star.speed;
        if (star.alpha >= 0.8) {
          star.alpha = 0.8;
          star.fading = true;
        }
      }

      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Shooting Star
    const now = Date.now();
    if (!shootingStar) {
      if (now >= nextShootingStarTime && width > 0 && height > 0) {
        const angle = (135 + (Math.random() * 30 - 15)) * Math.PI / 180;
        shootingStar = {
          startX: Math.random() * (width * 0.7) + (width * 0.3),
          startY: Math.random() * (height * 0.3),
          angle: angle,
          length: Math.random() * 150 + 100,
          speed: Math.random() * 0.04 + 0.02,
          progress: 0,
          thickness: Math.random() * 2 + 1
        };
        nextShootingStarTime = now + Math.random() * 6000 + 4000;
      }
    } else {
      shootingStar.progress += shootingStar.speed;
      if (shootingStar.progress >= 1.2) {
        shootingStar = null;
      } else {
        const headX = shootingStar.startX + (shootingStar.progress * shootingStar.length * Math.cos(shootingStar.angle));
        const headY = shootingStar.startY + (shootingStar.progress * shootingStar.length * Math.sin(shootingStar.angle));

        const trailLength = shootingStar.length * 0.4;
        const tailX = headX - (trailLength * Math.cos(shootingStar.angle));
        const tailY = headY - (trailLength * Math.sin(shootingStar.angle));

        const fade = shootingStar.progress < 0.8 ? 1.0 : (1.2 - shootingStar.progress) / 0.4;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = shootingStar.thickness;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, fade * 0.6);

        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        grad.addColorStop(1, `rgba(255, 255, 255, ${fade})`);

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  nextShootingStarTime = Date.now() + 2000;
  requestAnimationFrame(draw);
}

initStarrySky();

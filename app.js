import { initializeApp, deleteApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
let fcmToken = null; // Store the mobile device token retrieved from DB
let currentSong = 'tenuchadke'; // Track current active/default song
let localAudio = null; // HTML5 Audio instance for web playback
let localSoundEnabled = false; // Toggle state (disabled by default)

// ==========================================
// 1.5. SERVICE ACCOUNT CONFIGURATION (FCM V1)
// Paste the contents of your downloaded Service Account JSON key here.
// ==========================================
const serviceAccount = {
  project_id: "mobilealarm-49e9f",
  client_email: "firebase-adminsdk-fbsvc@mobilealarm-49e9f.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDSN11gJDLkcU5E\nuvMKR/HSLM+xVCeNK3XNwsMl+G7U4X7HpRxbn+pq6MyZrXavlB2vEEUnw/3pbLAe\n+jpLTzSEU6w4NIuFiuZzgOR756jee3bozXGJXslxIlqYwp618KWA/dwp05sQpHpS\nxxUpJbV3VSeP7cd7PTh/WvXX/8omP+HvjUkaPGcSm0cLl8urCfFNV13e6+49ddD+\nyCRkWgQwEBsRnNfQrxkJQDy8Cq++0901I5u7O0OI0w9hSvETai+oI+MUd3/5xhpE\nkT4jWjb+/qQxnH0gZN1OTK7QYsi90zBkCJ27j9MQ09PN862I3mOB/QHm8M3DXkFf\no4/hSlebAgMBAAECggEAAIQA+MJvdcFREePtOdSdI1HUkFu1bbt8l+svL2H+6XYv\niLGH//ZTp6fICwX+eSa8OAtaKTC6hdIRgv4IoIyMG02L5AeLA0d8MAqNZas/F86R\nm0xfelRgjXHCABYKxvI9b4yNoWKKqvWtoHvde+w6ADPIg9DUpkJ+oy5EEOE19wUk\nfdOJttoN51rRNneUu9wE0H5GItmfDn4RhninPcKCl7vElrZtZcrcxTCzenf275NJ\nsRR4EPD300q+FtIpUQNnS1bP3Xuytgzg7TXqFsCHQE54AkGjIHPKJicWDzyfs3CD\n1qc0AlPiA2FZhZyGgCPr3RYR+05AO7DlUSeY/5XTDQKBgQDuYnICX4FtU3Mu6/Zp\nRCkXK7aMK00ek0DiJP5FD9OnKMpSNbhlwLmscIQVLQ9PsTHfPP7OSFuwCUX34uD9\n3LgjxeYrVBwj4CuEiraOMQlpjaPfM3dF3uIVSVx76MnBxje/dT8p3lVq9nSymTfi\n7IqnMD+7/f4Vrnpnbb3BRuBgJwKBgQDhwA5S3fw7CPKQjQZornPJaN8EF9BwC9C6\nEaqz6ooikhO88kXIDtdKG597Cp6Nd8TS0AUzo8c6M6I5WmzEn7646Sn3y5H0KAiw\nED/VKQOP6fobjcXVsci1HM1+N9sCrnQq/CCFcYTlOv6357gmgbsvUUVI51ZMVH6y\noG2qIRzBbQKBgQCgacS4jhYlQGOhLo35ljFkczj7J+RUb9jYlPY5+QV/VfaXzaiR\naFhJjsmDCnhkMyQRShVZMN3qHsNjpNusWQvcnr5dZ9Mr3RzLqyBfnOXtjq+4cgSQ\nEwTmOCCxDRw/dihrgPWJMiEewkwTJwGxhWVkThaFZczGQEwEL5fiaNRyPwKBgG/y\nYGgBgtn3lunNtTbmA68GHUmXUZqukUQkDKWJkhSQoc8ZyTbq/SHXzt8iJfv7P5RW\n6a1w8xPOlQyh5bwfh2GE5nXl8ivESoKcnDrlSsnr+kX9qPROZDxD2zdTFX0f66WB\nP9NMtt1BwxyJgQ0/Wgad46DCb04MvINyAM/T+cGFAoGAc/A/HogCMJSr2Gco2KJw\nxrRZhmPaQCvPKM7K2W9j0eXRymQcj6CtGWl9S61sV9Hb0+v1zcGAA4vWmLfQCtvK\nQofTU+aT/YNovOU4hAoO5rPTJboJzLIzZCdQbywpW/XnlAk3iKMJnzcKHF/3Bua3\nCZ+W2oSlv9VAirsAqe1RRC0=\n-----END PRIVATE KEY-----\n"
};

/**
 * Generates a signed JWT and exchanges it for a Google OAuth2 access token
 * using the service account credentials.
 */
async function generateAccessToken() {
  if (!serviceAccount.private_key || serviceAccount.private_key.startsWith("PASTE_YOUR_")) {
    console.error("FCM V1 Error: Service Account credentials not configured.");
    return null;
  }

  try {
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    const sHeader = JSON.stringify(header);
    const sClaim = JSON.stringify(claim);

    // Sign the JWT using the imported jsrsasign library (loaded via CDN in index.html)
    const signedJwt = KJUR.jws.JWS.sign("RS256", sHeader, sClaim, serviceAccount.private_key);

    // Exchange the signed JWT for an access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error generating access token:", error);
    return null;
  }
}

/**
 * Sends a high-priority FCM V1 data message to the registered device
 */
async function sendFcmNotification(status, song = "song") {
  if (!fcmToken) {
    console.warn("FCM V1 Trigger: No mobile device token available in DB.");
    return;
  }

  const token = await generateAccessToken();
  if (!token) {
    console.error("FCM V1 Trigger: Failed to generate OAuth2 token. Check your service account key.");
    return;
  }

  console.log(`FCM V1: Sending status="${status}" trigger...`);
  try {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          data: {
            status: status,
            song: song
          },
          android: {
            priority: "high" // Bypasses Doze Mode / App Standby limits immediately
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FCM V1 send failed: ${errText}`);
    }

    const resData = await response.json();
    console.log("FCM V1 Success:", resData);
  } catch (error) {
    console.error("Error sending FCM notification:", error);
  }
}

// Synced Lyrics Configuration & Logic
const tenuchadkeLyrics = [
  { time: 1000, text: "Tenu chadd ke kitthe jawaan" },
  { time: 5000, text: "Tu mera parchanwa" },
  { time: 9000, text: "Tere mukhde vich hi main taan" },
  { time: 13000, text: "Rabb nu apni pawaan" },
  { time: 17000, text: "Meri dua haye, sajda tera, karti sada" },
  { time: 26000, text: "Tu sun ekraar mera" },
  { time: 30000, text: "Main karoon intezar tera" },
  { time: 34000, text: "Tu dil, tunhion jaan meri" }
];

const arzkiyahaiLyrics = [
  { time: 1000, text: "Inn fizaaon mein chhaye ho, haaye" },
  { time: 6000, text: "Aur waise hum toh tere hi ghulaam hain" },
  { time: 11000, text: "Aur waise hum toh tere hi ghulaam hain" },
  { time: 17000, text: "Baadshah dil ke, teri baazi mein jo tu chaahe toh" },
  { time: 29000, text: "Doobе dilo ki kya naav banoon?" },
  { time: 32000, text: "Main khud tair paaoon na aankhon mein" },
];

let lyrics = tenuchadkeLyrics;
let loopDuration = 38000;

const lyricsLayout = document.getElementById('lyricsLayout');
const lyricsContainer = document.getElementById('lyricsContainer');
let lyricsTimer = null;
let playbackStartTime = null;

function populateLyrics() {
  if (!lyricsLayout) return;
  lyricsLayout.innerHTML = '';
  lyrics.forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'lyric-line';
    if (index === 0) div.classList.add('active');
    div.innerText = line.text;
    div.id = `lyric-${index}`;
    lyricsLayout.appendChild(div);
  });
}

function startLyricsSync(triggeredAt) {
  stopLyricsSync();

  const now = Date.now();
  // If triggeredAt is within 38 seconds, sync to it, otherwise start from now
  if (triggeredAt && now - triggeredAt > 0 && now - triggeredAt < 38000) {
    playbackStartTime = triggeredAt;
  } else {
    playbackStartTime = now;
  }

  // Only play local audio and show synced scrolling lyrics if unmuted/listening
  if (localSoundEnabled) {
    if (lyricsContainer) {
      lyricsContainer.classList.add('visible');
    }
    playLocalAudio(playbackStartTime);
    updateLyricsScroll();
    lyricsTimer = setInterval(updateLyricsScroll, 100);
  }
}

function stopLyricsSync() {
  if (lyricsTimer) {
    clearInterval(lyricsTimer);
    lyricsTimer = null;
  }
  if (lyricsContainer) {
    lyricsContainer.classList.remove('visible');
  }
  
  // Stop local audio
  if (localAudio) {
    try {
      localAudio.pause();
    } catch (e) {
      console.error(e);
    }
    localAudio = null;
  }

  populateLyrics();
  if (lyricsLayout) {
    lyricsLayout.style.transform = 'translateY(0)';
  }
}

function updateLyricsScroll() {
  if (!lyricsLayout || !playbackStartTime) return;
  // Loop lyrics scroll cycle dynamically based on selected song length
  const elapsed = (Date.now() - playbackStartTime) % loopDuration;

  // Find active line index
  let activeIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= elapsed) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Update visual state of lyric lines
  const lines = lyricsLayout.children;
  for (let i = 0; i < lines.length; i++) {
    if (i === activeIndex) {
      lines[i].classList.add('active');
    } else {
      lines[i].classList.remove('active');
    }
  }

  // Scroll active line to the center of the lyrics container
  const activeElement = document.getElementById(`lyric-${activeIndex}`);
  if (activeElement) {
    const containerHeight = lyricsContainer.clientHeight;
    const elementHeight = activeElement.clientHeight;
    const elementTop = activeElement.offsetTop;
    const scrollOffset = -(elementTop - (containerHeight / 2) + (elementHeight / 2));
    lyricsLayout.style.transform = `translateY(${scrollOffset}px)`;
  }
}

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

      if (data) {
        // Retrieve the FCM registration token from the DB
        fcmToken = data.fcmToken || null;

        // Sync active song and lyrics dynamically
        const selectedSong = data.song || 'tenuchadke';
        if (currentSong !== selectedSong) {
          currentSong = selectedSong;
          if (selectedSong === 'arzkiyahai') {
            lyrics = arzkiyahaiLyrics;
            loopDuration = 38000;
          } else {
            lyrics = tenuchadkeLyrics;
            loopDuration = 38000;
          }
          populateLyrics();
        }

        // Update mobile device listening status
        const isListening = data.mobileState ? data.mobileState.isListening : false;
        const deviceStatus = document.getElementById('deviceStatus');
        const deviceStatusText = document.getElementById('deviceStatusText');
        if (deviceStatus && deviceStatusText) {
          if (isListening) {
            deviceStatus.style.display = 'inline-flex';
            deviceStatusText.innerText = 'Listening';
            
            // Resume local audio and lyrics if it is ringing and local sound is enabled
            if (isRinging && localSoundEnabled && !localAudio) {
              if (lyricsContainer) {
                lyricsContainer.classList.add('visible');
              }
              playLocalAudio(playbackStartTime || data.triggeredAt || Date.now());
              if (!lyricsTimer) {
                updateLyricsScroll();
                lyricsTimer = setInterval(updateLyricsScroll, 100);
              }
            }
          } else {
            deviceStatus.style.display = 'none';
            
            // If phone goes offline, stop local audio and close lyrics immediately
            if (localAudio) {
              try {
                localAudio.pause();
              } catch (e) {}
              localAudio = null;
            }
            if (lyricsTimer) {
              clearInterval(lyricsTimer);
              lyricsTimer = null;
            }
            if (lyricsContainer) {
              lyricsContainer.classList.remove('visible');
            }
          }
        }

        if (data.status === 'ringing') {
          const soundToggle = document.getElementById('soundToggle');
          if (soundToggle) {
            soundToggle.style.display = 'inline-flex';
          }
          if (!isRinging) {
            isRinging = true;
            triggerBtn.classList.add('ringing');
            btnText.innerText = "RINGING...";
            startLyricsSync(data.triggeredAt);
          }
        } else {
          const soundToggle = document.getElementById('soundToggle');
          if (soundToggle) {
            soundToggle.style.display = 'none';
          }
          // Reset local sound to disabled by default
          localSoundEnabled = false;
          const soundToggleIcon = document.getElementById('soundToggleIcon');
          if (soundToggle && soundToggleIcon) {
            const volumeOffPath = "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";
            soundToggle.classList.remove('active');
            soundToggleIcon.querySelector('path').setAttribute('d', volumeOffPath);
          }
          if (isRinging || lyricsTimer === null) {
            isRinging = false;
            triggerBtn.classList.remove('ringing');
            btnText.innerText = "TRIGGER ALARM";
            stopLyricsSync();
          }
        }
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
    update(databaseRef, {
      status: 'idle',
      song: currentSong,
      triggeredAt: Date.now()
    }).then(() => {
      sendFcmNotification('idle', currentSong);
    }).catch(err => {
      console.error("Failed to write to DB:", err);
    });
  } else {
    // If idle, trigger alarm with currently active song
    update(databaseRef, {
      status: 'ringing',
      song: currentSong,
      triggeredAt: Date.now()
    }).then(() => {
      sendFcmNotification('ringing', currentSong);
    }).catch(err => {
      console.error("Failed to write to DB:", err);
    });
  }
});

function playLocalAudio(startTime) {
  try {
    if (localAudio) {
      localAudio.pause();
    }
    localAudio = new Audio(currentSong === 'arzkiyahai' ? 'arzkiyahai.mp3' : 'tenuchadke.mp3');
    localAudio.loop = true;
    localAudio.volume = 0.5;

    const offsetMs = Date.now() - startTime;
    if (offsetMs > 0 && offsetMs < 38000) {
      localAudio.currentTime = offsetMs / 1000;
    }
    localAudio.play().catch(err => console.log("Audio playback blocked by browser:", err));
  } catch (e) {
    console.error("Local audio playback error:", e);
  }
}

function setupLocalSoundToggle() {
  const soundToggle = document.getElementById('soundToggle');
  const soundToggleIcon = document.getElementById('soundToggleIcon');
  if (!soundToggle || !soundToggleIcon) return;

  const volumeOnPath = "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";
  const volumeOffPath = "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";

  soundToggle.classList.remove('active');
  soundToggleIcon.querySelector('path').setAttribute('d', volumeOffPath);

  soundToggle.addEventListener('click', () => {
    localSoundEnabled = !localSoundEnabled;

    if (localSoundEnabled) {
      soundToggle.classList.add('active');
      soundToggleIcon.querySelector('path').setAttribute('d', volumeOnPath);
      
      // Start audio and open lyrics if alarm is currently ringing
      if (isRinging && playbackStartTime) {
        if (lyricsContainer) {
          lyricsContainer.classList.add('visible');
        }
        playLocalAudio(playbackStartTime);
        if (!lyricsTimer) {
          updateLyricsScroll();
          lyricsTimer = setInterval(updateLyricsScroll, 100);
        }
      }
    } else {
      soundToggle.classList.remove('active');
      soundToggleIcon.querySelector('path').setAttribute('d', volumeOffPath);
      
      // Stop audio and hide lyrics card immediately
      if (localAudio) {
        try {
          localAudio.pause();
        } catch (e) {}
        localAudio = null;
      }
      if (lyricsTimer) {
        clearInterval(lyricsTimer);
        lyricsTimer = null;
      }
      if (lyricsContainer) {
        lyricsContainer.classList.remove('visible');
      }
      populateLyrics();
      if (lyricsLayout) {
        lyricsLayout.style.transform = 'translateY(0)';
      }
    }
  });
}

// Auto-run on load
populateLyrics();
connectToFirebase();
setupLocalSoundToggle();

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

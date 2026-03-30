// User feedback system

function showMessage(type, text) {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = text;

  container.appendChild(toast);

  // Audio feedback based on type
  if (type === 'success') {
    playSuccessSound();
  } else if (type === 'error' || text.toLowerCase().includes('cooldown') || text.toLowerCase().includes('duplicate')) {
    playErrorBeep();
  }

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

let globalAudioCtx = null;

function unlockAudio() {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
}

function playErrorBeep() {
  try {
    unlockAudio();
    const audioCtx = globalAudioCtx;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (err) {
    console.error('Audio failed:', err);
  }
}

function playSuccessSound() {
  try {
    unlockAudio();
    const audioCtx = globalAudioCtx;
    
    // Tone 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Tone 2
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.error('Audio failed:', err);
  }
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function checkAuthAndInjectUI() {
    const isLoginPage = window.location.pathname.indexOf('login.html') !== -1;
    if (isLoginPage) return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Role-based rendering
    const sidebar = document.querySelector(".sidebar");
    const nav = document.querySelector(".sidebar-nav");
    
    if (nav && role && role.toLowerCase() === "admin") {
      const adminLink = document.createElement("a");
      adminLink.href = "admin.html";
      adminLink.className = "nav-link";
      adminLink.style.borderColor = "var(--primary)";
      adminLink.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Analytics (Admin)`;
      nav.appendChild(adminLink);
    }

    if (sidebar) {
      const isMobile = window.innerWidth <= 768;
      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.className = "nav-link";
      logoutLink.style.color = "var(--danger)";
      logoutLink.onclick = logout;
      logoutLink.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout`;

      if (isMobile && nav) {
        // Add to mobile bottom nav
        nav.appendChild(logoutLink);
      } else {
        // Standard sidebar footer
        let footer = sidebar.querySelector(".sidebar-footer");
        if (!footer) {
          footer = document.createElement("div");
          footer.className = "sidebar-footer";
          sidebar.appendChild(footer);
        }
        footer.appendChild(logoutLink);
      }
  }
}

// Ensure active nav link
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInjectUI();

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if(href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Firebase Configuration
// Secret Story Fan App

const firebaseConfig = {
    apiKey: "AIzaSyDhLsFf02lCuSB1i6Wd-Jb-c28KcGVNDro",
    authDomain: "tvi-reality-b2cf7.firebaseapp.com",
    projectId: "tvi-reality-b2cf7",
    storageBucket: "tvi-reality-b2cf7.firebasestorage.app",
    messagingSenderId: "956824114157",
    appId: "1:956824114157:web:5205bcb8140875efeacde4"
};

// Inicializar Firebase se não estiver já
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportar referências
const db = firebase.firestore();
const auth = firebase.auth();

// Device ID para tracking anónimo
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
}

// Helper: escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: show toast notification
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// Helper: format date
function formatDate(date) {
    if (!date) return 'Data desconhecida';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-PT');
}

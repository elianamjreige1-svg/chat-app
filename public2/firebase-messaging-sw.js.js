importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyCgbKfCIwMBN79nCNOAnNpf-wfXiqcitjI",
  authDomain: "karimchattingapp.firebaseapp.com",
  projectId: "karimchattingapp",
  
  messagingSenderId: "493999533297",
  appId: "1:493999533297:web:8a6dfaacbb2de95390cd50",
  
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
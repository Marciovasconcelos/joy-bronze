importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBk1LVCSXr2nVpT_6e2zLlSlxNY-2TIWeM",
  authDomain: "joy-bronze.firebaseapp.com",
  databaseURL: "https://joy-bronze-default-rtdb.firebaseio.com",
  projectId: "joy-bronze",
  storageBucket: "joy-bronze.firebasestorage.app",
  messagingSenderId: "215149975913",
  appId: "1:215149975913:web:cb8981d3fe8ef02ac585f8",
  measurementId: "G-TX462B85LF"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  const title=payload.notification?.title||"Joy Bronze";
  const options={
    body:payload.notification?.body||"Você recebeu uma nova atualização.",
    icon:"./icon-admin.svg",
    badge:"./icon-admin.svg",
    data:{url:"./admin.html"}
  };
  self.registration.showNotification(title,options);
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification.data?.url||"./admin.html";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if("focus" in client)return client.focus();}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});
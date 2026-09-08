import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const msg=document.querySelector("#msg");
document.querySelector("#loginBtn").onclick=async()=>{
  const email=document.querySelector("#email").value.trim();
  const password=document.querySelector("#password").value;
  try{
    const cred=await signInWithEmailAndPassword(auth,email,password);
    const perfil=await getDoc(doc(db,"usuarios",cred.user.uid));
    if(!perfil.exists() || perfil.data().tipo!=="admin"){
      msg.textContent="Esta conta não possui acesso administrativo.";
      return;
    }
    location.href="admin.html";
  }catch(e){ msg.textContent="Firebase: "+e.message; }
};
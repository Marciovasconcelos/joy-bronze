import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {doc,getDoc,setDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);

async function carregar(){
  const c=await getDoc(doc(db,"configuracoes","salao"));
  if(!c.exists())return;
  const x=c.data();
  $("#nomeSalao").value=x.nome||"";
  $("#abertura").value=x.abertura||"09:00";
  $("#fechamento").value=x.fechamento||"18:00";
  $("#intervalo").value=x.intervalo||60;
  const l=x.lembretes||{};
  $("#lembrete24").checked=l.h24!==false;
  $("#lembrete2").checked=!!l.h2;
  $("#lembrete1").checked=!!l.h1;
  $("#lembrete30").checked=!!l.m30;
}

$("#salvarConfig").onclick=async()=>{
  await setDoc(doc(db,"configuracoes","salao"),{
    nome:$("#nomeSalao").value.trim(),
    abertura:$("#abertura").value,
    fechamento:$("#fechamento").value,
    intervalo:Number($("#intervalo").value||60),
    lembretes:{h24:$("#lembrete24").checked,h2:$("#lembrete2").checked,h1:$("#lembrete1").checked,m30:$("#lembrete30").checked}
  });
  $("#msg").textContent="Configurações salvas com sucesso!";
};

$("#logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,async u=>{
  if(!u){location.href="admin-login.html";return}
  const p=await getDoc(doc(db,"usuarios",u.uid));
  if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}
  carregar();
});
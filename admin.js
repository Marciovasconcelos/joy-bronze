import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,addDoc,doc,getDoc,query,where,updateDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);

async function agenda(){
  const data=$("#filtroData").value;
  const q=data?query(collection(db,"agendamentos"),where("data","==",data)):collection(db,"agendamentos");
  const s=await getDocs(q);
  $("#agenda").innerHTML=s.empty?"Nenhum agendamento.":s.docs.map(x=>{const a=x.data();return `<div class="appointment"><b>${a.data} ${a.horario}</b><br>${a.nome||"Cliente"}<br>📱 ${a.telefone||""}<br>${a.servico}<br><select data-status="${x.id}"><option ${a.status==="pendente"?"selected":""}>pendente</option><option ${a.status==="confirmado"?"selected":""}>confirmado</option><option ${a.status==="concluido"?"selected":""}>concluido</option><option ${a.status==="cancelado"?"selected":""}>cancelado</option></select></div>`}).join("");
  document.querySelectorAll("[data-status]").forEach(el=>el.onchange=()=>updateDoc(doc(db,"agendamentos",el.dataset.status),{status:el.value}));
}

async function servicos(){
  const s=await getDocs(collection(db,"servicos"));
  $("#servicos").innerHTML=s.docs.map(x=>`<div class="appointment"><b>${x.data().nome}</b> — ${x.data().duracao} min — R$ ${Number(x.data().preco||0).toFixed(2)}</div>`).join("");
}

$("#filtroData").onchange=agenda;
$("#addServico").onclick=async()=>{if(!$("#novoServico").value)return;await addDoc(collection(db,"servicos"),{nome:$("#novoServico").value,duracao:Number($("#duracao").value||60),preco:Number($("#preco").value||0),ativo:true});$("#novoServico").value="";servicos()};
$("#logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,async u=>{
  if(!u){location.href="admin-login.html";return}
  const p=await getDoc(doc(db,"usuarios",u.uid));
  if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}
  agenda();servicos();
});
import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,addDoc,getDocs,query,where,orderBy,doc,getDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $=s=>document.querySelector(s);
let user, config={abertura:"09:00",fechamento:"18:00",intervalo:60};

function horas(){
 const out=[], d=$("#data").value;
 if(!d) return out;
 let [h,m]=config.abertura.split(":").map(Number), [fh,fm]=config.fechamento.split(":").map(Number);
 let start=h*60+m,end=fh*60+fm;
 for(let x=start;x<end;x+=Number(config.intervalo||60)){
   out.push(String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0"));
 }
 return out;
}
async function carregarServicos(){
 const snap=await getDocs(collection(db,"servicos"));
 $("#servico").innerHTML=snap.docs.map(d=>`<option value="${d.id}">${d.data().nome} — R$ ${Number(d.data().preco||0).toFixed(2)}</option>`).join("");
}
async function carregarConfig(){
 const s=await getDoc(doc(db,"configuracoes","salao")); if(s.exists()) config={...config,...s.data()};
}
async function carregarHorarios(){
 $("#horario").innerHTML="<option>Carregando...</option>";
 const d=$("#data").value;if(!d)return;
 const q=query(collection(db,"agendamentos"),where("data","==",d),where("status","in",["pendente","confirmado"]));
 const snap=await getDocs(q), ocupados=new Set(snap.docs.map(x=>x.data().horario));
 const livres=horas().filter(x=>!ocupados.has(x));
 $("#horario").innerHTML=livres.length?livres.map(x=>`<option>${x}</option>`).join(""):"<option>Nenhum horário disponível</option>";
}
async function listar(){
 const q=query(collection(db,"agendamentos"),where("clienteId","==",user.uid));
 const snap=await getDocs(q);
 $("#lista").innerHTML=snap.empty?"Nenhum agendamento.":snap.docs.map(d=>{
  const a=d.data();return `<div class="appointment"><b>${a.data} às ${a.horario}</b><br><small>${a.status}</small><br><button data-id="${d.id}">Cancelar</button></div>`
 }).join("");
 document.querySelectorAll("[data-id]").forEach(b=>b.onclick=async()=>{await deleteDoc(doc(db,"agendamentos",b.dataset.id));listar();carregarHorarios()});
}
$("#data").min=new Date().toISOString().slice(0,10);
$("#data").onchange=carregarHorarios;
$("#reservar").onclick=async()=>{
 if(!$("#data").value||!$("#horario").value||$("#horario").value.includes("Nenhum"))return alert("Escolha data e horário.");
 const service= $("#servico").selectedOptions[0]?.textContent||"Sessão";
 await addDoc(collection(db,"agendamentos"),{clienteId:user.uid,clienteEmail:user.email,servicoId:$("#servico").value,servico:service,data:$("#data").value,horario:$("#horario").value,status:"pendente",criadoEm:new Date().toISOString()});
 if(navigator.vibrate)navigator.vibrate([100,80,100]);
 alert("Reserva realizada com sucesso! 🔔");listar();carregarHorarios();
};
$("#ativarNotif").onclick=async()=>{if("Notification" in window){const p=await Notification.requestPermission();alert(p==="granted"?"Notificações ativadas!":"Permissão não concedida.");}};
$("#logout").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{
 if(!u){location.href="index.html";return} user=u;
 const perfil=await getDoc(doc(db,"usuarios",u.uid)); $("#nome").textContent=perfil.exists()?perfil.data().nome||u.email:u.email;
 await carregarConfig();await carregarServicos();await listar();
});
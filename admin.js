import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,addDoc,doc,getDoc,setDoc,query,where} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);
async function agenda(){
 const data=$("#filtroData").value;let q=data?query(collection(db,"agendamentos"),where("data","==",data)):collection(db,"agendamentos");
 const s=await getDocs(q);$("#agenda").innerHTML=s.empty?"Nenhum agendamento.":s.docs.map(x=>{let a=x.data();return `<div class="appointment"><b>${a.data} ${a.horario}</b><br>${a.clienteEmail}<br>${a.servico}<br><small>${a.status}</small></div>`}).join("");
}
async function servicos(){const s=await getDocs(collection(db,"servicos"));$("#servicos").innerHTML=s.docs.map(x=>`<div class="appointment"><b>${x.data().nome}</b> — ${x.data().duracao} min — R$ ${Number(x.data().preco||0).toFixed(2)}</div>`).join("")}
$("#filtroData").onchange=agenda;
$("#addServico").onclick=async()=>{if(!$("#novoServico").value)return;await addDoc(collection(db,"servicos"),{nome:$("#novoServico").value,duracao:Number($("#duracao").value||60),preco:Number($("#preco").value||0),ativo:true});$("#novoServico").value="";servicos()};
$("#salvarConfig").onclick=async()=>{await setDoc(doc(db,"configuracoes","salao"),{nome:$("#nomeSalao").value,abertura:$("#abertura").value,fechamento:$("#fechamento").value,intervalo:Number($("#intervalo").value),lembretes:{h24:$("#lembrete24").checked,h2:$("#lembrete2").checked,h1:$("#lembrete1").checked,m30:$("#lembrete30").checked}});alert("Configurações salvas!")};
$("#logout").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{if(!u){location.href="index.html";return}const p=await getDoc(doc(db,"usuarios",u.uid));if(!p.exists()||p.data().tipo!=="admin"){location.href="cliente.html";return}const c=await getDoc(doc(db,"configuracoes","salao"));if(c.exists()){let x=c.data();$("#nomeSalao").value=x.nome||"";$("#abertura").value=x.abertura||"09:00";$("#fechamento").value=x.fechamento||"18:00";$("#intervalo").value=x.intervalo||60}agenda();servicos()});
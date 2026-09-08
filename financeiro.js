import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,doc,getDoc,updateDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);
let uid="";
let despesas=[];
let receitas=[];
const hoje=new Date();
$("#mes").value=hoje.toISOString().slice(0,7);
$("#dataDespesa").value=hoje.toISOString().slice(0,10);
const dinheiro=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

async function carregar(){
  const [ag,perfil]=await Promise.all([getDocs(collection(db,"agendamentos")),getDoc(doc(db,"usuarios",uid))]);
  despesas=perfil.exists()&&Array.isArray(perfil.data().despesasFinanceiro)?perfil.data().despesasFinanceiro:[];
  receitas=ag.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.status==="concluido" && a.data && a.data.startsWith($("#mes").value));
  render();
}
function render(){
  const mes=$("#mes").value;
  const ds=despesas.filter(d=>(d.data||"").startsWith(mes));
  const totalR=receitas.reduce((s,a)=>s+Number(a.valor||0),0);
  const totalD=ds.reduce((s,d)=>s+Number(d.valor||0),0);
  $("#receitas").textContent=dinheiro(totalR);
  $("#despesas").textContent=dinheiro(totalD);
  $("#resultado").textContent=dinheiro(totalR-totalD);
  $("#atendimentos").textContent=receitas.length;
  $("#listaDespesas").innerHTML=ds.length?ds.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(d=>`<div class="appointment"><b>${escapeHtml(d.descricao)}</b><br>📅 ${d.data} · <strong>${dinheiro(d.valor)}</strong><br><button data-del="${d.id}">Excluir</button></div>`).join(""):"Nenhuma despesa neste mês.";
  $("#listaReceitas").innerHTML=receitas.length?receitas.sort((a,b)=>(b.data+a.horario).localeCompare(b.data+a.horario)).map(a=>`<div class="appointment"><b>${escapeHtml(a.servico||"Serviço")}</b><br>📅 ${a.data} às ${a.horario} · ${escapeHtml(a.nome||"Cliente")}<br><strong>${dinheiro(a.valor)}</strong></div>`).join(""):"Nenhuma receita concluída neste mês.";
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>excluirDespesa(b.dataset.del));
}
async function excluirDespesa(id){
  if(!confirm("Excluir esta despesa?"))return;
  despesas=despesas.filter(d=>d.id!==id);
  await updateDoc(doc(db,"usuarios",uid),{despesasFinanceiro:despesas});
  render();
}
$("#mes").onchange=carregar;
$("#addDespesa").onclick=async()=>{
  const descricao=$("#descricao").value.trim();const valor=Number($("#valor").value);const data=$("#dataDespesa").value;
  if(!descricao||!valor||valor<0||!data){$("#msg").textContent="Preencha descrição, valor e data.";return}
  despesas.push({id:crypto.randomUUID(),descricao,valor,data,criadoEm:new Date().toISOString()});
  await updateDoc(doc(db,"usuarios",uid),{despesasFinanceiro:despesas});
  $("#descricao").value="";$("#valor").value="";$("#msg").textContent="Despesa lançada com sucesso.";await carregar();
};
$("#logout").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{if(!u){location.href="admin-login.html";return}const p=await getDoc(doc(db,"usuarios",u.uid));if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}uid=u.uid;await carregar();});
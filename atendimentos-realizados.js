import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,onSnapshot,query,orderBy} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const formaNome={pix:"PIX",dinheiro:"Dinheiro",credito:"Cartão de crédito",debito:"Cartão de débito"};
function dataTexto(v){if(!v)return "";if(typeof v==="string"){const m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return `${m[3]}/${m[2]}/${m[1]}`;return v;}if(v?.toDate)return v.toDate().toLocaleDateString("pt-BR");return "";}
function card(a){const valor=Number(a.valorPago??a.valor??0);const forma=formaNome[a.formaPagamento]||"Não informado";return `<div class="appointment"><b>✅ ${escapeHtml(dataTexto(a.data))} — ${escapeHtml(a.horario||"")}</b><br>👤 ${escapeHtml(a.nome||"Cliente")}<br>📱 ${escapeHtml(a.telefone||"")}<br>💆 ${escapeHtml(a.servico||"")}<br>💰 <b>R$ ${valor.toFixed(2).replace(".",",")}</b> · ${forma}</div>`;}
onAuthStateChanged(auth,(u)=>{if(!u){location.href="admin-login.html";return}$("#logout").onclick=()=>signOut(auth);const q=query(collection(db,"agendamentos"),orderBy("data","desc"));onSnapshot(q,snap=>{const itens=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.status==="concluido").sort((a,b)=>{const da=`${a.data||""} ${a.horario||""}`,dbb=`${b.data||""} ${b.horario||""}`;return dbb.localeCompare(da);});$("#realizados").innerHTML=itens.length?itens.map(card).join(""):"Nenhum atendimento realizado.";},err=>{$("#realizados").textContent="Não foi possível carregar os atendimentos realizados.";console.error(err);});});
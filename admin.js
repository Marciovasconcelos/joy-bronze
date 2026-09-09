import {auth,db,app} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,doc,getDoc,updateDoc,arrayUnion,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getMessaging,getToken} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const VAPID_KEY="BP3qhXATurSOCG7iPV8iMq6L2rczVCc_xhcFsbV9Pl7Fy-VOjkSsXgu_V45pwrLyiVu5-KsFHqedaAoIXAB6iCY";
const $=s=>document.querySelector(s);
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

async function ativarNotificacoes(u){
  try{
    if(!("Notification" in window)||!("serviceWorker" in navigator)) return;
    const permissao=Notification.permission==="granted"?"granted":await Notification.requestPermission();
    if(permissao!=="granted") return;
    const registro=await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    const messaging=getMessaging(app);
    const token=await getToken(messaging,{vapidKey:VAPID_KEY,serviceWorkerRegistration:registro});
    if(token){
      await updateDoc(doc(db,"usuarios",u.uid),{fcmTokens:arrayUnion(token)});
      console.log("Notificações ativadas para este dispositivo.");
    }
  }catch(e){console.warn("Não foi possível ativar as notificações:",e);}
}

function relogio(){
  const agora=new Date();
  const hora=agora.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  const data=agora.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
  const h=agora.getHours();
  const saudacao=h<12?"Bom dia ☀️":h<18?"Boa tarde ☀️":"Boa noite 🌙";
  const horaEl=$("#horaAtual"), dataEl=$("#dataHoraCard"), saudacaoEl=$("#saudacao"), hiddenData=$("#dataAtual");
  if(horaEl) horaEl.textContent=hora;
  if(dataEl) dataEl.textContent=data.charAt(0).toUpperCase()+data.slice(1);
  if(saudacaoEl) saudacaoEl.textContent=saudacao;
  if(hiddenData) hiddenData.textContent=data;
}
function dataHoje(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function cardPagamento(a){return `<div style="margin-top:12px;padding:12px;border-radius:12px;background:#fff7ef;border:1px solid #ead7c4"><b>💰 Pagamento do atendimento</b><label>Valor pago</label><input data-valor-pago="${a.id}" type="number" step="0.01" min="0" value="${Number(a.valorPago??a.valor??0)||""}" placeholder="0,00"><label>Forma de pagamento</label><select data-pagamento="${a.id}"><option value="">Selecione</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="credito">Cartão de crédito</option><option value="debito">Cartão de débito</option></select><button data-save-pagamento="${a.id}">💾 Salvar pagamento e concluir</button></div>`}
async function salvarPagamento(id){const valor=Number(document.querySelector(`[data-valor-pago="${id}"]`)?.value||0);const forma=document.querySelector(`[data-pagamento="${id}"]`)?.value||"";if(!valor||valor<0||!forma){alert("Informe o valor pago e a forma de pagamento.");return}await updateDoc(doc(db,"agendamentos",id),{valor,valorPago:valor,formaPagamento:forma,status:"concluido",pagamentoRegistradoEm:new Date().toISOString()});agenda()}
function cardAgendamento(a){return `<div class="appointment"><b>🕐 ${escapeHtml(a.horario||"")}</b> — ${escapeHtml(a.nome||"Cliente")}<br>📱 ${escapeHtml(a.telefone||"")}<br>💆 ${escapeHtml(a.servico||"")}<br><select data-status="${a.id}"><option ${a.status==="pendente"?"selected":""}>pendente</option><option ${a.status==="confirmado"?"selected":""}>confirmado</option><option ${a.status==="concluido"?"selected":""}>concluido</option><option ${a.status==="cancelado"?"selected":""}>cancelado</option></select>${a.status==="confirmado"?cardPagamento(a):""}</div>`}
function cardRealizado(a){const forma={pix:"PIX",dinheiro:"Dinheiro",credito:"Cartão de crédito",debito:"Cartão de débito"}[a.formaPagamento]||"Não informado";return `<div class="appointment"><b>✅ ${escapeHtml(a.horario||"")}</b> — ${escapeHtml(a.nome||"Cliente")}<br>📱 ${escapeHtml(a.telefone||"")}<br>💆 ${escapeHtml(a.servico||"")}<br>💰 <b>R$ ${Number(a.valorPago??a.valor??0).toFixed(2).replace(".",",")}</b> · ${forma}</div>`}
function normalizarDataAgendamento(v){
  if(!v) return "";
  if(typeof v==="string"){
    if(/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0,10);
    const br=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(br) return `${br[3]}-${br[2]}-${br[1]}`;
  }
  if(v?.toDate){
    const d=v.toDate();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  return "";
}

let todosAgendamentos=[];
let agendaListenerAtivo=false;
let adminCalendarioAtual=new Date();

function renderCalendarioAdmin(){
  const grid=$("#adminDiasCalendario"), titulo=$("#adminMesCalendario");
  if(!grid || !titulo) return;
  const ano=adminCalendarioAtual.getFullYear(), mes=adminCalendarioAtual.getMonth();
  titulo.textContent=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date(ano,mes,1));
  const primeiro=new Date(ano,mes,1).getDay();
  const ultimo=new Date(ano,mes+1,0).getDate();
  const selecionada=$("#filtroData")?.value||"";
  const contagem={};
  todosAgendamentos.forEach(a=>{
    if(a.status==="cancelado") return;
    const d=normalizarDataAgendamento(a.data);
    if(d) contagem[d]=(contagem[d]||0)+1;
  });
  let html="";
  for(let i=0;i<primeiro;i++) html+='<span class="calendar-empty"></span>';
  for(let dia=1;dia<=ultimo;dia++){
    const iso=`${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
    const qtd=contagem[iso]||0;
    html+=`<button type="button" class="calendar-day ${qtd?"has-booking":""} ${selecionada===iso?"is-selected":""}" data-admin-date="${iso}">
      <span>${dia}</span>${qtd?`<small>${qtd}</small>`:""}
    </button>`;
  }
  grid.innerHTML=html;
  grid.querySelectorAll("[data-admin-date]").forEach(btn=>btn.onclick=()=>{
    $("#filtroData").value=btn.dataset.adminDate;
    renderCalendarioAdmin();
    renderAgenda();
  });
}

function configurarCalendarioAdmin(){
  $("#adminMesAnterior").onclick=()=>{
    adminCalendarioAtual=new Date(adminCalendarioAtual.getFullYear(),adminCalendarioAtual.getMonth()-1,1);
    renderCalendarioAdmin();
  };
  $("#adminProximoMes").onclick=()=>{
    adminCalendarioAtual=new Date(adminCalendarioAtual.getFullYear(),adminCalendarioAtual.getMonth()+1,1);
    renderCalendarioAdmin();
  };
}

function renderAgenda(){
  const data=$("#filtroData").value||dataHoje();
  const lista=todosAgendamentos
    .filter(a=>normalizarDataAgendamento(a.data)===data)
    .sort((a,b)=>(a.horario||"").localeCompare(b.horario||""));

  const ativos=lista.filter(a=>a.status!=="concluido"&&a.status!=="cancelado");
  const realizados=lista.filter(a=>a.status==="concluido");
  const totalHojeEl=$("#agendamentosHoje");
  if(totalHojeEl) totalHojeEl.textContent=lista.filter(a=>normalizarDataAgendamento(a.data)===dataHoje()&&a.status!=="cancelado").length;
  renderCalendarioAdmin();

  $("#agenda").innerHTML=ativos.length
    ? ativos.map(cardAgendamento).join("")
    : "Nenhum agendamento pendente ou confirmado para esta data.";
  $("#realizados").innerHTML=realizados.length
    ? realizados.map(cardRealizado).join("")
    : "Nenhum atendimento realizado nesta data.";

  document.querySelectorAll("[data-status]").forEach(el=>el.onchange=async()=>{
    const id=el.dataset.status;
    if(el.value==="confirmado"){
      await updateDoc(doc(db,"agendamentos",id),{status:"confirmado"});
    }else if(el.value==="concluido"){
      alert("O pagamento precisa ser informado antes de concluir. Selecione Confirmado para abrir o pagamento.");
    }else{
      await updateDoc(doc(db,"agendamentos",id),{status:el.value});
    }
  });
  document.querySelectorAll("[data-save-pagamento]").forEach(b=>b.onclick=()=>salvarPagamento(b.dataset.savePagamento));
}

async function agenda(){
  try{
    const s=await getDocs(collection(db,"agendamentos"));
    todosAgendamentos=s.docs.map(x=>({id:x.id,...x.data()}));
    renderAgenda();
  }catch(e){
    console.error("Erro ao carregar agendamentos:",e);
    $("#agenda").textContent="Não foi possível carregar os agendamentos. Verifique a conexão e as permissões do Firebase.";
  }
}

function acompanharAgenda(){
  if(agendaListenerAtivo) return;
  agendaListenerAtivo=true;
  onSnapshot(collection(db,"agendamentos"),snap=>{
    todosAgendamentos=snap.docs.map(x=>({id:x.id,...x.data()}));
    renderAgenda();
  },err=>{
    console.warn("Atualização automática indisponível:",err);
    agenda();
  });
}

$("#filtroData").value=dataHoje();
configurarCalendarioAdmin();
$("#filtroData").onchange=()=>{
  const v=$("#filtroData").value;
  if(v){
    const [a,m]=v.split("-").map(Number);
    adminCalendarioAtual=new Date(a,m-1,1);
  }
  renderAgenda();
};const logoutBtn=$("#logout");if(logoutBtn) logoutBtn.onclick=()=>signOut(auth);relogio();setInterval(relogio,1000);
onAuthStateChanged(auth,async u=>{if(!u){location.href="admin-login.html";return}const p=await getDoc(doc(db,"usuarios",u.uid));if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}agenda();acompanharAgenda();ativarNotificacoes(u)});
import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, where, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);
let config = { abertura:"09:00", fechamento:"18:00", intervalo:60 };
const WHATSAPP_SALAO = "5519995044272";

function normalizarTelefone(v){ return v.replace(/\D/g,""); }

function gerarHorarios(){
  const data = $("#data").value;
  if(!data) return [];
  const [h,m] = config.abertura.split(":").map(Number);
  const [fh,fm] = config.fechamento.split(":").map(Number);
  const inicio = h*60+m, fim = fh*60+fm;
  const lista = [];
  for(let x=inicio; x<fim; x+=Number(config.intervalo||60)){
    lista.push(String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0"));
  }
  return lista;
}

async function carregarConfig(){
  const s = await getDoc(doc(db,"configuracoes","salao"));
  if(s.exists()) config = {...config,...s.data()};
}

async function carregarServicos(){
  const s = await getDocs(collection(db,"servicos"));
  $("#servico").innerHTML = s.empty
    ? '<option value="">Nenhum serviço cadastrado</option>'
    : s.docs.filter(d=>d.data().ativo!==false).map(d =>
      `<option value="${d.id}">${d.data().nome} — R$ ${Number(d.data().preco||0).toFixed(2)}</option>`
    ).join("");
}

async function carregarHorarios(){
  $("#horario").innerHTML = "<option>Carregando...</option>";
  const data = $("#data").value;
  if(!data) return;
  const s = await getDocs(query(collection(db,"agendamentos"),where("data","==",data)));
  const ocupados = new Set(
    s.docs.filter(d=>["pendente","confirmado"].includes(d.data().status)).map(d=>d.data().horario)
  );
  const livres = gerarHorarios().filter(h=>!ocupados.has(h));
  $("#horario").innerHTML = livres.length
    ? livres.map(h=>`<option>${h}</option>`).join("")
    : "<option>Nenhum horário disponível</option>";
}

function criarLembreteAgenda({nome,servicoTexto,data,horario}){
  const inicio = new Date(`${data}T${horario}:00`);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const pad = n => String(n).padStart(2,"0");
  const utc = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const agora = utc(new Date());
  const uid = `joy-bronze-${Date.now()}@joybronze`;
  const titulo = `☀️ Joy Bronze — ${servicoTexto.replace(/\s+—\s+R\$.*$/i,"")}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Joy Bronze//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${agora}`,
    `DTSTART:${utc(inicio)}`,
    `DTEND:${utc(fim)}`,
    `SUMMARY:${titulo.replace(/[,;\\]/g," ")}`,
    `DESCRIPTION:Cliente: ${nome}\\nServiço: ${servicoTexto}\\nJoy Bronze` ,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: seu horário na Joy Bronze é daqui a 30 minutos.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `joy-bronze-${data}-${horario.replace(":","h")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function consultar(){
  const telefone = normalizarTelefone($("#consultaTelefone").value);
  if(!telefone){ alert("Digite seu telefone."); return; }
  const s = await getDocs(query(collection(db,"agendamentos"),where("telefone","==",telefone)));
  $("#lista").innerHTML = s.empty ? "Nenhum agendamento encontrado." : s.docs.map(d=>{
    const a=d.data();
    return `<div class="appointment"><b>${a.data} às ${a.horario}</b><br>${a.servico}<br><small>${a.status}</small><br><button data-cancelar="${d.id}">Cancelar reserva</button></div>`;
  }).join("");
  document.querySelectorAll("[data-cancelar]").forEach(b=>b.onclick=async()=>{
    if(confirm("Deseja cancelar esta reserva?")){
      await deleteDoc(doc(db,"agendamentos",b.dataset.cancelar));
      consultar();
    }
  });
}

$("#data").min = new Date().toISOString().slice(0,10);
$("#data").onchange = carregarHorarios;
$("#consultar").onclick = consultar;

$("#reservar").onclick = async ()=>{
  const nome = $("#nome").value.trim();
  const telefone = normalizarTelefone($("#telefone").value);
  const data = $("#data").value;
  const horario = $("#horario").value;

  if(!nome || !telefone){ alert("Informe nome e telefone."); return; }
  if(telefone.length < 10){ alert("Digite um telefone válido."); return; }
  if(!data || !horario || horario.includes("Nenhum")){ alert("Escolha data e horário."); return; }

  const servicoTexto = $("#servico").selectedOptions[0]?.textContent || "Sessão";

  const existentes = await getDocs(query(collection(db,"agendamentos"),where("data","==",data),where("horario","==",horario)));
  if(existentes.docs.some(d=>["pendente","confirmado"].includes(d.data().status))){
    alert("Este horário acabou de ser reservado. Escolha outro.");
    carregarHorarios();
    return;
  }

  await addDoc(collection(db,"agendamentos"),{
    nome, telefone,
    servicoId: $("#servico").value,
    servico: servicoTexto,
    data, horario,
    status:"pendente",
    criadoEm:new Date().toISOString()
  });

  if(navigator.vibrate) navigator.vibrate([100,80,100]);

  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
  const mensagem = `☀️ *Novo agendamento — Joy Bronze*\n\n👤 Cliente: ${nome}\n📱 Telefone: ${$("#telefone").value}\n💆 Serviço: ${servicoTexto}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${horario}\n\n✅ Reserva realizada pelo site.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_SALAO}?text=${encodeURIComponent(mensagem)}`;

  const adicionarAgenda = confirm(`Reserva realizada com sucesso! ☀️\n\nDeseja adicionar o agendamento à agenda do seu celular?\n\nSerá criado um lembrete para avisar 30 minutos antes.`);
  if(adicionarAgenda) criarLembreteAgenda({nome,servicoTexto,data,horario});

  alert("Reserva realizada com sucesso! ☀️\n\nAbrindo o WhatsApp para enviar a confirmação.");
  window.open(whatsappUrl,"_blank","noopener,noreferrer");
  $("#consultaTelefone").value = $("#telefone").value;
  consultar();
  carregarHorarios();
};

await carregarConfig();
await carregarServicos();
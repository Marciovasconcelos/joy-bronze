import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,addDoc,doc,getDoc,updateDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);

const listaJoyBronze=[
  {nome:"JOY BRONZE AVULSOS - SESSÃO 20 MINUTOS",duracao:20,preco:80},
  {nome:"JOY BRONZE AVULSOS - SESSÃO 30 MINUTOS",duracao:30,preco:90},
  {nome:"JOY BRONZE AVULSOS - SESSÃO 40 MINUTOS",duracao:40,preco:100},
  {nome:"JOY BRONZE AVULSOS - SESSÃO 50 MINUTOS",duracao:50,preco:120},
  {nome:"JOY BRONZE AVULSOS - BRONZE A JATO",duracao:60,preco:120},
  {nome:"JOY BRONZE PACOTES - 3 SESSÕES 20 MINUTOS",duracao:20,preco:225},
  {nome:"JOY BRONZE PACOTES - 3 SESSÕES 30 MINUTOS",duracao:30,preco:255},
  {nome:"JOY BRONZE PACOTES - 3 SESSÕES 40 MINUTOS",duracao:40,preco:285},
  {nome:"JOY BRONZE PACOTES - 3 SESSÕES 50 MINUTOS",duracao:50,preco:315},
  {nome:"JOY BRONZE PACOTES - 3 SESSÕES BRONZE A JATO",duracao:60,preco:345},
  {nome:"JOY BRONZE COMBO AMIGAS - 2 PESSOAS - 30 MINUTOS",duracao:30,preco:140},
  {nome:"JOY BRONZE BANHO DE LUA",duracao:60,preco:65},
  {nome:"JOY BRONZE COMBO BANHO DE LUA - 2 PESSOAS",duracao:60,preco:100}
];

async function servicos(){
  const s=await getDocs(collection(db,"servicos"));
  $("#servicos").innerHTML=s.empty?"Nenhum serviço cadastrado.":s.docs.map(x=>{const a=x.data();return `<div class="appointment"><b>${a.nome}</b> — ${a.duracao||60} min — R$ ${Number(a.preco||0).toFixed(2)} <button data-edit="${x.id}">Editar</button> <button data-delete="${x.id}">Excluir</button></div>`}).join("");
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Excluir este serviço?")){await deleteDoc(doc(db,"servicos",b.dataset.delete));servicos()}});
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=async()=>{const id=b.dataset.edit;const s=await getDoc(doc(db,"servicos",id));const a=s.data();const nome=prompt("Nome do serviço:",a.nome||"");if(nome===null)return;const duracao=prompt("Duração em minutos:",a.duracao||60);if(duracao===null)return;const preco=prompt("Preço:",a.preco||0);if(preco===null)return;await updateDoc(doc(db,"servicos",id),{nome:nome.trim(),duracao:Number(duracao)||60,preco:Number(preco)||0});servicos()});
}

$("#addServico").onclick=async()=>{const nome=$("#novoServico").value.trim();if(!nome){alert("Informe o nome do serviço.");return}await addDoc(collection(db,"servicos"),{nome,duracao:Number($("#duracao").value||60),preco:Number($("#preco").value||0),ativo:true});$("#novoServico").value="";$("#preco").value="";servicos()};

$("#instalarLista").onclick=async()=>{
  if(!confirm("Deseja adicionar a lista completa Joy Bronze Concept? Serviços com o mesmo nome não serão duplicados."))return;
  const atuais=await getDocs(collection(db,"servicos"));
  const nomes=new Set(atuais.docs.map(d=>String(d.data().nome||"").trim().toLowerCase()));
  let adicionados=0;
  for(const item of listaJoyBronze){
    if(!nomes.has(item.nome.toLowerCase())){
      await addDoc(collection(db,"servicos"),{...item,ativo:true});
      adicionados++;
    }
  }
  alert(adicionados? `${adicionados} serviços adicionados com sucesso!`:"Todos os serviços da lista já estão cadastrados.");
  servicos();
};

$("#logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,async u=>{if(!u){location.href="admin-login.html";return}const p=await getDoc(doc(db,"usuarios",u.uid));if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}servicos()});
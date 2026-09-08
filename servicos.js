import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,addDoc,doc,getDoc,updateDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);

async function servicos(){
  const s=await getDocs(collection(db,"servicos"));
  $("#servicos").innerHTML=s.empty?"Nenhum serviço cadastrado.":s.docs.map(x=>{const a=x.data();return `<div class="appointment"><b>${a.nome}</b> — ${a.duracao||60} min — R$ ${Number(a.preco||0).toFixed(2)} <button data-edit="${x.id}">Editar</button> <button data-delete="${x.id}">Excluir</button></div>`}).join("");
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Excluir este serviço?")){await deleteDoc(doc(db,"servicos",b.dataset.delete));servicos()}});
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=async()=>{const id=b.dataset.edit;const s=await getDoc(doc(db,"servicos",id));const a=s.data();const nome=prompt("Nome do serviço:",a.nome||"");if(nome===null)return;const duracao=prompt("Duração em minutos:",a.duracao||60);if(duracao===null)return;const preco=prompt("Preço:",a.preco||0);if(preco===null)return;await updateDoc(doc(db,"servicos",id),{nome:nome.trim(),duracao:Number(duracao)||60,preco:Number(preco)||0});servicos()});
}

$("#addServico").onclick=async()=>{const nome=$("#novoServico").value.trim();if(!nome){alert("Informe o nome do serviço.");return}await addDoc(collection(db,"servicos"),{nome,duracao:Number($("#duracao").value||60),preco:Number($("#preco").value||0),ativo:true});$("#novoServico").value="";$("#preco").value="";servicos()};
$("#logout").onclick=()=>signOut(auth);

onAuthStateChanged(auth,async u=>{if(!u){location.href="admin-login.html";return}const p=await getDoc(doc(db,"usuarios",u.uid));if(!p.exists()||p.data().tipo!=="admin"){location.href="index.html";return}servicos()});
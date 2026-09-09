import { db } from "./firebase-config.js";
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function normalizar(v){ return String(v||"").replace(/\D/g,""); }
async function salvarClienteAutomaticamente(){
  const nome=document.querySelector("#nome")?.value.trim();
  const telefoneOriginal=document.querySelector("#telefone")?.value.trim();
  const telefone=normalizar(telefoneOriginal);
  if(!nome || telefone.length<10) return;
  try{
    const q=query(collection(db,"clientes"),where("telefone","==",telefone));
    const snap=await getDocs(q);
    const dados={nome,telefone,telefoneFormatado:telefoneOriginal,atualizadoEm:new Date().toISOString()};
    if(snap.empty){
      await addDoc(collection(db,"clientes"),{...dados,criadoEm:new Date().toISOString(),email:"",endereco:"",numero:"",bairro:"",cidade:"",cep:"",observacoes:""});
    }else{
      await updateDoc(doc(db,"clientes",snap.docs[0].id),dados);
    }
  }catch(e){ console.warn("Não foi possível salvar a cliente automaticamente:",e); }
}

window.addEventListener("load",()=>{
  const botao=document.querySelector("#reservar");
  if(!botao) return;
  botao.addEventListener("click",()=>setTimeout(salvarClienteAutomaticamente,500),true);
});
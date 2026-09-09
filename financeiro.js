```javascript
import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,getDocs,doc,getDoc,updateDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $=s=>document.querySelector(s);

let uid="",despesas=[],receitas=[];

const hoje=new Date();

$("#mes").value=hoje.toISOString().slice(0,7);
$("#dataDespesa").value=hoje.toISOString().slice(0,10);

const dinheiro=v=>Number(v||0).toLocaleString("pt-BR",{
  style:"currency",
  currency:"BRL"
});

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  "\"":"&quot;",
  "'":"&#039;"
}[c]));

/* ================================
   PROTEÇÃO DOS RELATÓRIOS
   Senha inicial: 1234
================================ */

async function protegerRelatorios(){

  const config=await getDoc(
    doc(db,"configuracoes","salao")
  );

  const senhaConfigurada=
    config.exists() && config.data().senhaRelatorios
      ? String(config.data().senhaRelatorios)
      : "1234";

  const jaLiberado=
    sessionStorage.getItem(
      "joyBronzeRelatoriosLiberado"
    );

  if(jaLiberado==="1"){
    return true;
  }

  const senha=prompt(
    "🔒 RELATÓRIOS PROTEGIDOS\n\nDigite a senha:"
  );

  if(senha===null){
    location.href="admin.html";
    return false;
  }

  if(String(senha)!==senhaConfigurada){

    alert("❌ Senha incorreta.");

    location.href="admin.html";

    return false;
  }

  sessionStorage.setItem(
    "joyBronzeRelatoriosLiberado",
    "1"
  );

  return true;
}

/* ================================
   CARREGAR DADOS
================================ */

async function carregar(){

  const [
    ag,
    sv,
    perfil
  ]=await Promise.all([

    getDocs(
      collection(db,"agendamentos")
    ),

    getDocs(
      collection(db,"servicos")
    ),

    getDoc(
      doc(db,"usuarios",uid)
    )

  ]);

  const precos={};

  sv.docs.forEach(d=>{
    precos[d.id]=Number(
      d.data().preco||0
    );
  });

  despesas=
    perfil.exists() &&
    Array.isArray(
      perfil.data().despesasFinanceiro
    )
      ? perfil.data().despesasFinanceiro
      : [];

  receitas=ag.docs
    .map(d=>{

      const a=d.data();

      return {
        id:d.id,
        ...a,
        valor:
          precos[a.servicoId] ??
          Number(a.valor||0)
      };

    })
    .filter(a=>
      a.status==="concluido" &&
      a.data &&
      (a.data||"").startsWith(
        $("#mes").value
      )
    );

  render();
}

/* ================================
   RENDERIZAR
================================ */

function render(){

  const mes=$("#mes").value;

  const ds=despesas.filter(d=>
    (d.data||"").startsWith(mes)
  );

  const totalR=
    receitas.reduce(
      (s,a)=>s+a.valor,
      0
    );

  const totalD=
    ds.reduce(
      (s,d)=>s+Number(d.valor||0),
      0
    );

  $("#receitas").textContent=
    dinheiro(totalR);

  $("#despesas").textContent=
    dinheiro(totalD);

  $("#resultado").textContent=
    dinheiro(totalR-totalD);

  $("#atendimentos").textContent=
    receitas.length;

  $("#listaDespesas").innerHTML=
    ds.length

      ? ds
          .sort((a,b)=>
            (b.data||"")
              .localeCompare(
                a.data||""
              )
          )
          .map(d=>`

            <div class="appointment">

              <b>${esc(d.descricao)}</b>

              <br>

              📅 ${d.data} ·
              <strong>
                ${dinheiro(d.valor)}
              </strong>

              <br>

              <button data-del="${d.id}">
                Excluir
              </button>

            </div>

          `)
          .join("")

      : "Nenhuma despesa neste mês.";

  $("#listaReceitas").innerHTML=
    receitas.length

      ? receitas
          .sort((a,b)=>
            (b.data+a.horario)
              .localeCompare(
                a.data+a.horario
              )
          )
          .map(a=>`

            <div class="appointment">

              <b>
                ${esc(a.servico||"Serviço")}
              </b>

              <br>

              📅 ${a.data} às ${a.horario}
              · ${esc(a.nome||"Cliente")}

              <br>

              <strong>
                ${dinheiro(a.valor)}
              </strong>

            </div>

          `)
          .join("")

      : "Nenhuma receita concluída neste mês.";

  document
    .querySelectorAll("[data-del]")
    .forEach(b=>
      b.onclick=()=>
        excluirDespesa(
          b.dataset.del
        )
    );
}

/* ================================
   EXCLUIR DESPESA
================================ */

async function excluirDespesa(id){

  if(!confirm("Excluir esta despesa?"))
    return;

  despesas=
    despesas.filter(
      d=>d.id!==id
    );

  await updateDoc(
    doc(db,"usuarios",uid),
    {
      despesasFinanceiro:
        despesas
    }
  );

  render();
}

/* ================================
   FILTRO DE MÊS
================================ */

$("#mes").onchange=carregar;

/* ================================
   ADICIONAR DESPESA
================================ */

$("#addDespesa").onclick=async()=>{

  const descricao=
    $("#descricao").value.trim();

  const valor=
    Number($("#valor").value);

  const data=
    $("#dataDespesa").value;

  if(
    !descricao ||
    !valor ||
    valor<0 ||
    !data
  ){

    $("#msg").textContent=
      "Preencha descrição, valor e data.";

    return;
  }

  despesas.push({

    id:crypto.randomUUID(),

    descricao,

    valor,

    data,

    criadoEm:
      new Date().toISOString()

  });

  await updateDoc(
    doc(db,"usuarios",uid),
    {
      despesasFinanceiro:
        despesas
    }
  );

  $("#descricao").value="";
  $("#valor").value="";

  $("#msg").textContent=
    "Despesa lançada com sucesso.";

  await carregar();
};

/* ================================
   SAIR
================================ */

$("#logout").onclick=()=>{

  sessionStorage.removeItem(
    "joyBronzeRelatoriosLiberado"
  );

  signOut(auth);
};

/* ================================
   AUTENTICAÇÃO
================================ */

onAuthStateChanged(
  auth,
  async u=>{

    if(!u){

      location.href=
        "admin-login.html";

      return;
    }

    const p=
      await getDoc(
        doc(db,"usuarios",u.uid)
      );

    if(
      !p.exists() ||
      p.data().tipo!=="admin"
    ){

      location.href="index.html";

      return;
    }

    uid=u.uid;

    /* Só depois de confirmar que é administrador */
    const liberado=
      await protegerRelatorios();

    if(!liberado)
      return;

    await carregar();

  }
);
```

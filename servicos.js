import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);


/* ==========================================
   LISTA PADRÃO JOY BRONZE
========================================== */

const listaJoyBronze = [

  {
    nome: "JOY BRONZE AVULSOS - SESSÃO 20 MINUTOS",
    duracao: 20,
    preco: 80,
    categoria: "avulso"
  },

  {
    nome: "JOY BRONZE AVULSOS - SESSÃO 30 MINUTOS",
    duracao: 30,
    preco: 90,
    categoria: "avulso"
  },

  {
    nome: "JOY BRONZE AVULSOS - SESSÃO 40 MINUTOS",
    duracao: 40,
    preco: 100,
    categoria: "avulso"
  },

  {
    nome: "JOY BRONZE AVULSOS - SESSÃO 50 MINUTOS",
    duracao: 50,
    preco: 120,
    categoria: "avulso"
  },

  {
    nome: "JOY BRONZE AVULSOS - BRONZE A JATO",
    duracao: 60,
    preco: 120,
    categoria: "avulso"
  },


  /* ==========================================
     PACOTES
  ========================================== */

  {
    nome: "JOY BRONZE PACOTES - 3 SESSÕES 20 MINUTOS",
    duracao: 20,
    preco: 225,
    categoria: "pacote"
  },

  {
    nome: "JOY BRONZE PACOTES - 3 SESSÕES 30 MINUTOS",
    duracao: 30,
    preco: 255,
    categoria: "pacote"
  },

  {
    nome: "JOY BRONZE PACOTES - 3 SESSÕES 40 MINUTOS",
    duracao: 40,
    preco: 285,
    categoria: "pacote"
  },

  {
    nome: "JOY BRONZE PACOTES - 3 SESSÕES 50 MINUTOS",
    duracao: 50,
    preco: 315,
    categoria: "pacote"
  },

  {
    nome: "JOY BRONZE PACOTES - 3 SESSÕES BRONZE A JATO",
    duracao: 60,
    preco: 345,
    categoria: "pacote"
  },


  /* ==========================================
     COMBOS
  ========================================== */

  {
    nome: "JOY BRONZE COMBO AMIGAS - 2 PESSOAS - 30 MINUTOS",
    duracao: 30,
    preco: 140,
    categoria: "pacote"
  },

  {
    nome: "JOY BRONZE BANHO DE LUA",
    duracao: 60,
    preco: 65,
    categoria: "avulso"
  },

  {
    nome: "JOY BRONZE COMBO BANHO DE LUA - 2 PESSOAS",
    duracao: 60,
    preco: 100,
    categoria: "pacote"
  }

];


/* ==========================================
   MOSTRAR SERVIÇOS
========================================== */

async function servicos() {

  const s = await getDocs(
    collection(db, "servicos")
  );

  $("#servicos").innerHTML =
    s.empty
      ? "Nenhum serviço cadastrado."
      : s.docs
          .map(x => {

            const a = x.data();

            const categoria =
              a.categoria === "pacote"
                ? "🎁 Pacote / Combo"
                : "💅 Avulso";

            return `
              <div class="appointment">

                <b>
                  ${a.nome}
                </b>

                <br>

                ${categoria}

                <br>

                ⏱️ ${a.duracao || 60} min

                —

                💰 R$
                ${Number(
                  a.preco || 0
                ).toFixed(2)}

                <br><br>

                <button
                  data-edit="${x.id}"
                >
                  Editar
                </button>

                <button
                  data-delete="${x.id}"
                >
                  Excluir
                </button>

              </div>
            `;

          })
          .join("");


  /* EXCLUIR */

  document
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      b => {

        b.onclick =
          async () => {

            if (
              confirm(
                "Excluir este serviço?"
              )
            ) {

              await deleteDoc(
                doc(
                  db,
                  "servicos",
                  b.dataset.delete
                )
              );

              servicos();

            }

          };

      }
    );


  /* EDITAR */

  document
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(
      b => {

        b.onclick =
          async () => {

            const id =
              b.dataset.edit;

            const s =
              await getDoc(
                doc(
                  db,
                  "servicos",
                  id
                )
              );

            const a =
              s.data();


            const nome =
              prompt(
                "Nome do serviço:",
                a.nome || ""
              );

            if (
              nome === null
            ) return;


            const duracao =
              prompt(
                "Duração em minutos:",
                a.duracao || 60
              );

            if (
              duracao === null
            ) return;


            const preco =
              prompt(
                "Preço:",
                a.preco || 0
              );

            if (
              preco === null
            ) return;


            const categoriaAtual =
              a.categoria === "pacote"
                ? "pacote"
                : "avulso";


            const categoria =
              prompt(
                "Categoria: digite avulso ou pacote",
                categoriaAtual
              );

            if (
              categoria === null
            ) return;


            const categoriaFinal =
              categoria
                .trim()
                .toLowerCase() === "pacote"
                  ? "pacote"
                  : "avulso";


            await updateDoc(
              doc(
                db,
                "servicos",
                id
              ),
              {

                nome:
                  nome.trim(),

                duracao:
                  Number(
                    duracao
                  ) || 60,

                preco:
                  Number(
                    preco
                  ) || 0,

                categoria:
                  categoriaFinal

              }
            );


            servicos();

          };

      }
    );

}


/* ==========================================
   ADICIONAR NOVO SERVIÇO
========================================== */

$("#addServico").onclick =
  async () => {

    const nome =
      $("#novoServico")
        .value
        .trim();


    if (!nome) {

      alert(
        "Informe o nome do serviço."
      );

      return;

    }


    const categoriaDigitada =
      prompt(
        "Categoria do serviço: digite avulso ou pacote",
        "avulso"
      );


    if (
      categoriaDigitada === null
    ) return;


    const categoria =
      categoriaDigitada
        .trim()
        .toLowerCase() === "pacote"
          ? "pacote"
          : "avulso";


    await addDoc(
      collection(
        db,
        "servicos"
      ),
      {

        nome,

        duracao:
          Number(
            $("#duracao").value || 60
          ),

        preco:
          Number(
            $("#preco").value || 0
          ),

        categoria,

        ativo: true

      }
    );


    $("#novoServico").value =
      "";

    $("#preco").value =
      "";


    servicos();

  };


/* ==========================================
   INSTALAR LISTA PADRÃO
========================================== */

$("#instalarLista").onclick =
  async () => {

    if (
      !confirm(
        "Deseja adicionar ou atualizar a lista completa Joy Bronze Concept?"
      )
    ) return;


    const atuais =
      await getDocs(
        collection(
          db,
          "servicos"
        )
      );


    const existentes =
      new Map(
        atuais.docs.map(
          d => [

            String(
              d.data().nome || ""
            )
              .trim()
              .toLowerCase(),

            d

          ]
        )
      );


    let adicionados = 0;
    let atualizados = 0;


    for (
      const item
      of listaJoyBronze
    ) {

      const chave =
        item.nome
          .trim()
          .toLowerCase();


      const existente =
        existentes.get(
          chave
        );


      if (existente) {

        await updateDoc(
          doc(
            db,
            "servicos",
            existente.id
          ),
          {

            nome:
              item.nome,

            duracao:
              item.duracao,

            preco:
              item.preco,

            categoria:
              item.categoria,

            ativo: true

          }
        );

        atualizados++;

      } else {

        await addDoc(
          collection(
            db,
            "servicos"
          ),
          {

            ...item,

            ativo: true

          }
        );

        adicionados++;

      }

    }


    alert(
      `${adicionados} serviços adicionados.\n` +
      `${atualizados} serviços atualizados com categoria.`
    );


    servicos();

  };


/* ==========================================
   LOGOUT
========================================== */

$("#logout").onclick =
  () =>
    signOut(auth);


/* ==========================================
   AUTENTICAÇÃO
========================================== */

onAuthStateChanged(
  auth,
  async u => {

    if (!u) {

      location.href =
        "admin-login.html";

      return;

    }


    const p =
      await getDoc(
        doc(
          db,
          "usuarios",
          u.uid
        )
      );


    if (
      !p.exists() ||
      p.data().tipo !== "admin"
    ) {

      location.href =
        "index.html";

      return;

    }


    servicos();

  }
);

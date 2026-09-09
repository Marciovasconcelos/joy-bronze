import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);

let config = {
  abertura: "09:00",
  fechamento: "18:00",
  intervalo: 60
};

const WHATSAPP_SALAO = "5519996788649";
/* ==========================================
   MÚLTIPLOS PROCEDIMENTOS
========================================== */

const servicosSelecionados = new Set();
const dadosServicos = [];

function obterServicosSelecionados() {
  return dadosServicos.filter(
    s => servicosSelecionados.has(s.id)
  );
}

function textoServicosSelecionados() {
  return obterServicosSelecionados()
    .map(s => s.nome)
    .join(" + ");
}

function duracaoServicoMinutos(servico) {

  const texto = String(
    servico.nome || ""
  );

  const match = texto.match(
    /(\d+)\s*MINUTOS?/i
  );

  if (match) {
    return Number(match[1]);
  }

  return Number(config.intervalo || 60);
}

function duracaoTotalServicos() {

  return obterServicosSelecionados()
    .reduce(
      (total, servico) =>
        total + duracaoServicoMinutos(servico),
      0
    );

}
function normalizarTelefone(v) {
  return v.replace(/\D/g, "");
}

function saudacaoAtual() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function gerarHorarios() {

  const data = $("#data").value;

  if (!data) return [];

  const [h, m] = config.abertura.split(":").map(Number);
  const [fh, fm] = config.fechamento.split(":").map(Number);

  const inicio = h * 60 + m;
  const fim = fh * 60 + fm;

  const lista = [];

  for (
    let x = inicio;
    x < fim;
    x += Number(config.intervalo || 60)
  ) {

    lista.push(
      String(Math.floor(x / 60)).padStart(2, "0") +
      ":" +
      String(x % 60).padStart(2, "0")
    );

  }

  return lista;
}

async function carregarConfig() {

  const s = await getDoc(
    doc(db, "configuracoes", "salao")
  );

  if (s.exists()) {
    config = {
      ...config,
      ...s.data()
    };
  }

}

function duracaoDoServico(nome) {

  const n = (nome || "").toUpperCase();

  const m = n.match(
    /(20|30|40|50)\s*MINUTOS?/
  );

  if (m) {
    return `${m[1]} minutos`;
  }

  if (n.includes("BANHO DE LUA")) {
    return "Sessão especial";
  }

  return "Horário personalizado";

}

function fecharListaServicos() {

  const lista = $("#servicoLista");
  const trigger = $("#servicoTrigger");

  if (!lista || lista.hidden) return;

  lista.hidden = true;

  trigger?.setAttribute(
    "aria-expanded",
    "false"
  );

  document
    .querySelector(".service-picker")
    ?.classList.remove("is-open");

}

function renderListaServicos() {

  const select =
    $("#servico");

  const lista =
    $("#servicoLista");

  const resumo =
    $("#servicoResumo");

  if (
    !select ||
    !lista ||
    !resumo
  ) return;

  const selecionados =
    obterServicosSelecionados();

  resumo.textContent =
    selecionados.length === 0
      ? "Escolha um ou mais procedimentos"
      : selecionados.length === 1
        ? selecionados[0].nome
        : `${selecionados.length} procedimentos selecionados`;

  lista.innerHTML =
    dadosServicos
      .map(servico => {

        const ativo =
          servicosSelecionados.has(
            servico.id
          );

        return `
          <button
            type="button"
            class="service-option ${
              ativo
                ? "is-selected"
                : ""
            }"
            data-value="${servico.id}"
          >

            <span class="service-option-icon">
              ♧
            </span>

            <span class="service-option-copy">

              <strong>
                ${servico.nome}
              </strong>

              <small>
                ◷ ${duracaoServicoMinutos(
                  servico
                )} minutos
              </small>

            </span>

            <span class="service-price">
              R$ ${Number(
                servico.preco || 0
              ).toFixed(2)}
            </span>

            <span class="service-check">
              ${ativo ? "✓" : ""}
            </span>

          </button>
        `;

      })
      .join("");

  lista
    .querySelectorAll(
      ".service-option"
    )
    .forEach(btn => {

      btn.onclick = () => {

        const id =
          btn.dataset.value;

        if (
          servicosSelecionados.has(
            id
          )
        ) {

          servicosSelecionados.delete(
            id
          );

        } else {

          servicosSelecionados.add(
            id
          );

        }

        const primeiro =
          obterServicosSelecionados()[0];

        if (primeiro) {

          select.value =
            primeiro.id;

        }

        renderListaServicos();

      };

    });

}

function configurarListaServicos() {

  const trigger =
    $("#servicoTrigger");

  const lista =
    $("#servicoLista");

  if (!trigger || !lista) return;

  trigger.onclick = e => {

    e.stopPropagation();

    const abrir =
      lista.hidden;

    lista.hidden =
      !abrir;

    trigger.setAttribute(
      "aria-expanded",
      String(abrir)
    );

    document
      .querySelector(".service-picker")
      ?.classList.toggle(
        "is-open",
        abrir
      );

  };

  document.addEventListener(
    "click",
    e => {

      if (
        !e.target.closest(".service-picker") &&
        !e.target.closest("#servicoLista")
      ) {

        fecharListaServicos();

      }

    }
  );

}

async function carregarServicos() {

  const s =
    await getDocs(
      collection(db, "servicos")
    );

  const select =
    $("#servico");

  dadosServicos.length = 0;

  s.docs
    .filter(
      d => d.data().ativo !== false
    )
    .forEach(d => {

      const dados =
        d.data();

      dadosServicos.push({
        id: d.id,
        nome: dados.nome || "Procedimento",
        preco: Number(
          dados.preco || 0
        )
      });

    });

  select.innerHTML =
    dadosServicos.length
      ? dadosServicos
          .map(
            servico =>
              `<option value="${servico.id}">
                ${servico.nome}
              </option>`
          )
          .join("")
      : `
        <option value="">
          Nenhum serviço cadastrado
        </option>
      `;

  renderListaServicos();

  configurarListaServicos();

}

let calendarioAtual =
  new Date();

let agendamentosCalendario =
  [];

function dataLocalISO(
  ano,
  mes,
  dia
) {

  return (
    `${ano}-` +
    `${String(mes + 1).padStart(2, "0")}-` +
    `${String(dia).padStart(2, "0")}`
  );

}

function hojeISO() {

  const d =
    new Date();

  return dataLocalISO(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );

}

async function carregarAgendamentosCalendario() {

  const s =
    await getDocs(
      collection(
        db,
        "agendamentos"
      )
    );

  agendamentosCalendario =
    s.docs
      .map(
        d => d.data()
      )
      .filter(
        a =>
          [
            "pendente",
            "confirmado"
          ].includes(
            String(
              a.status || ""
            ).toLowerCase()
          )
      );

}

function renderCalendarioCliente() {

  const grid =
    $("#diasCalendario");

  const titulo =
    $("#mesCalendario");

  if (!grid || !titulo) return;

  const ano =
    calendarioAtual.getFullYear();

  const mes =
    calendarioAtual.getMonth();

  titulo.textContent =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date(
        ano,
        mes,
        1
      )
    );

  const primeiro =
    new Date(
      ano,
      mes,
      1
    ).getDay();

  const ultimo =
    new Date(
      ano,
      mes + 1,
      0
    ).getDate();

  const min =
    hojeISO();

  const selecionada =
    $("#data")?.value ||
    "";

  const ocupados =
    {};

  agendamentosCalendario.forEach(a => {

    if (
      a.data?.startsWith(
        `${ano}-${String(
          mes + 1
        ).padStart(2, "0")}`
      )
    ) {

      ocupados[a.data] =
        (ocupados[a.data] || 0) + 1;

    }

  });

  let html = "";

  for (
    let i = 0;
    i < primeiro;
    i++
  ) {

    html +=
      '<span class="calendar-empty"></span>';

  }

  for (
    let dia = 1;
    dia <= ultimo;
    dia++
  ) {

    const iso =
      dataLocalISO(
        ano,
        mes,
        dia
      );

    const passado =
      iso < min;

    const qtd =
      ocupados[iso] || 0;

    html += `
      <button
        type="button"
        class="calendar-day
          ${passado ? "is-past" : ""}
          ${qtd ? "has-booking" : ""}
          ${selecionada === iso ? "is-selected" : ""}
        "
        data-date="${iso}"
        ${passado ? "disabled" : ""}
      >
        <span>${dia}</span>
        ${qtd ? `<small>${qtd}</small>` : ""}
      </button>
    `;

  }

  grid.innerHTML =
    html;

  grid
    .querySelectorAll(
      ".calendar-day:not(:disabled)"
    )
    .forEach(
      b => b.onclick =
        async () => {

          const iso =
            b.dataset.date;

          $("#data").value =
            iso;

          $("#dataResumo").textContent =
            new Date(
              iso +
              "T12:00:00"
            ).toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "long",
                year: "numeric"
              }
            );

          fecharCalendario();

          renderCalendarioCliente();

          await carregarHorarios();

        }
    );

}

function fecharCalendario() {

  const cal =
    $("#calendarioCliente");

  const trigger =
    $("#dataTrigger");

  if (!cal) return;

  cal.hidden =
    true;

  trigger?.setAttribute(
    "aria-expanded",
    "false"
  );

  document
    .querySelector(".date-picker")
    ?.classList.remove(
      "is-open"
    );

}

function configurarCalendarioCliente() {

  const trigger =
    $("#dataTrigger");

  const cal =
    $("#calendarioCliente");

  trigger.onclick =
    async e => {

      e.preventDefault();

      e.stopPropagation();

      const abrir =
        cal.hidden;

      if (!abrir) {

        fecharCalendario();

        return;

      }

      const selecionada =
        $("#data")?.value;

      if (selecionada) {

        const [
          a,
          m
        ] =
          selecionada
            .split("-")
            .map(Number);

        calendarioAtual =
          new Date(
            a,
            m - 1,
            1
          );

      }

      cal.hidden =
        false;

      trigger.setAttribute(
        "aria-expanded",
        "true"
      );

      document
        .querySelector(".date-picker")
        ?.classList.add(
          "is-open"
        );

      renderCalendarioCliente();

      try {

        await carregarAgendamentosCalendario();

        renderCalendarioCliente();

      } catch (err) {

        console.warn(
          "Não foi possível carregar os indicadores de agendamento no calendário:",
          err
        );

      }

    };

  $("#mesAnterior").onclick =
    () => {

      const hoje =
        new Date();

      hoje.setDate(1);

      const teste =
        new Date(
          calendarioAtual.getFullYear(),
          calendarioAtual.getMonth() - 1,
          1
        );

      if (
        teste >=
        new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          1
        )
      ) {

        calendarioAtual =
          teste;

        renderCalendarioCliente();

      }

    };

  $("#proximoMes").onclick =
    () => {

      calendarioAtual =
        new Date(
          calendarioAtual.getFullYear(),
          calendarioAtual.getMonth() + 1,
          1
        );

      renderCalendarioCliente();

    };

  document.addEventListener(
    "click",
    e => {

      if (
        !e.target.closest(".date-picker") &&
        !e.target.closest("#calendarioCliente")
      ) {

        fecharCalendario();

      }

    }
  );

}

async function carregarHorarios() {

  $("#horario").innerHTML =
    "<option>Carregando...</option>";

  const data =
    $("#data").value;

  if (!data) return;

  const s =
    await getDocs(
      query(
        collection(
          db,
          "agendamentos"
        ),
        where(
          "data",
          "==",
          data
        )
      )
    );

  const ocupados =
    new Set(
      s.docs
        .filter(
          d =>
            [
              "pendente",
              "confirmado"
            ].includes(
              String(
                d.data().status || ""
              ).toLowerCase()
            )
        )
        .map(
          d =>
            d.data().horario
        )
    );

  const livres =
    gerarHorarios()
      .filter(
        h =>
          !ocupados.has(h)
      );

  $("#horario").innerHTML =
    livres.length
      ? livres
          .map(
            h =>
              `<option>${h}</option>`
          )
          .join("")
      : "<option>Nenhum horário disponível</option>";

}

/* ==========================================
   CONSULTAR AGENDAMENTOS DO CLIENTE
   MOSTRA APENAS PENDENTE E CONFIRMADO
========================================== */

async function consultar() {

  const telefone =
    normalizarTelefone(
      $("#consultaTelefone").value
    );

  if (!telefone) {

    alert(
      "Digite seu telefone."
    );

    return;

  }

  const s =
    await getDocs(
      query(
        collection(
          db,
          "agendamentos"
        ),
        where(
          "telefone",
          "==",
          telefone
        )
      )
    );

  /*
    Filtra os agendamentos.

    APARECEM:
    - pendente
    - confirmado

    NÃO APARECEM:
    - concluído
    - concluido
    - cancelado
    - cancelada
  */

  const agendamentosAtivos =
    s.docs.filter(
      d => {

        const status =
          String(
            d.data().status ||
            ""
          )
          .toLowerCase()
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          );

        return [
          "pendente",
          "confirmado"
        ].includes(
          status
        );

      }
    );

  $("#lista").innerHTML =
    agendamentosAtivos.length === 0
      ? `
        Nenhum agendamento
        ativo encontrado.
      `
      : agendamentosAtivos
          .map(
            d => {

              const a =
                d.data();

              return `
                <div class="appointment">

                  <b>
                    ${a.data}
                    às
                    ${a.horario}
                  </b>

                  <br>

                  ${a.servico || ""}

                  <br>

                  <small>
                    ${a.status}
                  </small>

                  <br>

                  <button
                    data-cancelar="${d.id}"
                  >
                    Cancelar reserva
                  </button>

                </div>
              `;

            }
          )
          .join("");

  document
    .querySelectorAll(
      "[data-cancelar]"
    )
    .forEach(
      b => {

        b.onclick =
          async () => {

            if (
              confirm(
                "Deseja cancelar esta reserva?"
              )
            ) {

              await deleteDoc(
                doc(
                  db,
                  "agendamentos",
                  b.dataset.cancelar
                )
              );

              consultar();

            }

          };

      }
    );

}

/* ==========================================
   EVENTOS
========================================== */

$("#data").min =
  hojeISO();

$("#data").onchange =
  async () => {

    const v =
      $("#data").value;

    if (v) {

      $("#dataResumo").textContent =
        new Date(
          v +
          "T12:00:00"
        ).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        );

    }

    await carregarHorarios();

  };

$("#consultar").onclick =
  consultar;

/* ==========================================
   FAZER NOVO AGENDAMENTO
========================================== */

$("#reservar").onclick =
  async () => {

    const nome =
      $("#nome")
        .value
        .trim();

    const telefoneOriginal =
      $("#telefone")
        .value
        .trim();

    const telefone =
      normalizarTelefone(
        telefoneOriginal
      );

    const data =
      $("#data").value;

    const horario =
      $("#horario").value;

    if (
      !nome ||
      !telefone
    ) {

      alert(
        "Informe nome e telefone."
      );

      return;

    }

    if (
      telefone.length < 10
    ) {

      alert(
        "Digite um telefone válido."
      );

      return;

    }

    if (
      !data ||
      !horario ||
      horario.includes(
        "Nenhum"
      )
    ) {

      alert(
        "Escolha data e horário."
      );

      return;

    }

   const servicos =
  obterServicosSelecionados();

if (!servicos.length) {

  alert(
    "Selecione pelo menos um procedimento."
  );

  return;

}

const servicoTexto =
  textoServicosSelecionados();

const duracaoTotal =
  duracaoTotalServicos(); 

    const existentes =
      await getDocs(
        query(
          collection(
            db,
            "agendamentos"
          ),
          where(
            "data",
            "==",
            data
          ),
          where(
            "horario",
            "==",
            horario
          )
        )
      );

    if (
      existentes.docs.some(
        d =>
          [
            "pendente",
            "confirmado"
          ].includes(
            String(
              d.data().status ||
              ""
            ).toLowerCase()
          )
      )
    ) {

      alert(
        "Este horário acabou de ser reservado. Escolha outro."
      );

      carregarHorarios();

      return;

    }

    await addDoc(
      collection(
        db,
        "agendamentos"
      ),
      {
        nome,
        telefone,
        servicoId:
  servicos[0].id,

servicoIds:
  servicos.map(
    s => s.id
  ),

servicos:
  servicos.map(
    s => ({
      id: s.id,
      nome: s.nome,
      preco: s.preco,
      duracaoMinutos:
        duracaoServicoMinutos(s)
    })
  ),

servico:
  servicoTexto,

duracaoTotalMinutos:
  duracaoTotal,
        data,
        horario,
        status:
          "pendente",
        criadoEm:
          new Date().toISOString()
      }
    );

    if (
      navigator.vibrate
    ) {

      navigator.vibrate(
        [
          100,
          80,
          100
        ]
      );

    }

    const dataFormatada =
      new Date(
        data +
        "T12:00:00"
      ).toLocaleDateString(
        "pt-BR"
      );

    const mensagem = [

      `${saudacaoAtual()}, ${nome}!`,

      "",

      "Seu agendamento na Joy Bronze foi realizado com sucesso! 💖",

      "",

      `Serviço: ${servicoTexto}`,

      `Data: ${dataFormatada}`,

      `Horário: ${horario}`,

      "",

      "Aguardamos você! ✨"

    ].join(
      "\n"
    );

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_SALAO}?text=${encodeURIComponent(
        mensagem
      )}`;

    alert(
      "Reserva realizada com sucesso!\n\nAbrindo o WhatsApp para enviar a confirmação."
    );

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

    $("#consultaTelefone").value =
      telefoneOriginal;

    consultar();

    carregarHorarios();

  };

/* ==========================================
   INICIALIZAÇÃO
========================================== */

await carregarConfig();

await carregarServicos();

configurarCalendarioCliente();

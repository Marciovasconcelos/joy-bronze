const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();
setGlobalOptions({region: "southamerica-east1", maxInstances: 1});

exports.notificarNovoAgendamento = onDocumentCreated("agendamentos/{agendamentoId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const agendamento = snapshot.data();
  const db = getFirestore();
  const usuarios = await db.collection("usuarios").where("tipo", "==", "admin").get();

  const tokens = [];
  usuarios.forEach((doc) => {
    const data = doc.data() || {};
    const lista = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
    for (const token of lista) {
      if (typeof token === "string" && token.trim()) tokens.push(token.trim());
    }
  });

  const uniqueTokens = [...new Set(tokens)];
  if (!uniqueTokens.length) return;

  const response = await getMessaging().sendEachForMulticast({
    tokens: uniqueTokens,
    notification: {
      title: "☀️ Novo agendamento!",
      body: `${agendamento.nome || "Cliente"} • ${agendamento.data || ""} às ${agendamento.horario || ""} • ${agendamento.servico || "Serviço"}`
    },
    data: {
      url: "./admin.html",
      agendamentoId: event.params.agendamentoId
    },
    webpush: {
      fcmOptions: {
        link: "./admin.html"
      },
      notification: {
        icon: "./icon-admin.svg",
        badge: "./icon-admin.svg"
      }
    }
  });

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error?.code || "";
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        invalidTokens.push(uniqueTokens[index]);
      }
    }
  });

  if (invalidTokens.length) {
    const batch = db.batch();
    usuarios.forEach((doc) => {
      const data = doc.data() || {};
      const lista = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
      const atualizada = lista.filter((token) => !invalidTokens.includes(token));
      if (atualizada.length !== lista.length) {
        batch.update(doc.ref, {fcmTokens: atualizada});
      }
    });
    await batch.commit();
  }
});

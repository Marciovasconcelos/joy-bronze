# Bronze Agenda

## Passos
1. Abra `firebase-config.js` e cole sua configuração do Firebase.
2. No Firebase Authentication, habilite **E-mail/Senha**.
3. Crie no Firestore o primeiro usuário administrador:
   - Crie uma conta normalmente.
   - Em `usuarios/{UID}`, altere `tipo` de `cliente` para `admin`.
4. Publique os arquivos no GitHub Pages ou Firebase Hosting.

## Lembretes
Esta versão inclui:
- pedido de permissão para notificações;
- alerta e vibração na confirmação;
- configurações de lembrete no painel Admin.

Para lembretes garantidos mesmo com o navegador fechado, a próxima etapa é integrar Firebase Cloud Messaging e um backend/Cloud Function para disparar as notificações no horário correto.

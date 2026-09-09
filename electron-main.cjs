const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let win;

function criarJanela() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f8f3ee',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'admin.html'));
  win.once('ready-to-show', () => win.show());
}

function configurarAtualizacao() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    if (win) win.setTitle('Joy Bronze - Administrador | Atualização encontrada');
  });

  autoUpdater.on('update-downloaded', () => {
    if (!win) return;
    const resposta = dialog.showMessageBoxSync(win, {
      type: 'info',
      title: 'Joy Bronze atualizado',
      message: 'Uma nova versão do Joy Bronze está pronta.',
      detail: 'Deseja reiniciar agora para instalar a atualização?',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1
    });

    if (resposta === 0) autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on('error', (erro) => {
    console.log('Atualização automática:', erro.message);
  });

  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}

app.whenReady().then(() => {
  criarJanela();
  configurarAtualizacao();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

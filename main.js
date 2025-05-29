const { app, BrowserWindow } = require('electron')

let mainWindow

function createWindow() {
  // Путь к странице, которую вы хотите открыть
  const urlToOpen = 'https://nekto.me/chat/#/'

  const iconPath = './assets/app.png';

  // Создаем окно без рамок и панели управления
  mainWindow = new BrowserWindow({
    width: 654,
    height: 1036,
    frame: true,         // Убирает заголовок и рамку окна
    fullscreen: false,     // Можно убрать, если не нужен полноэкранный режим
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Загружаем URL
  mainWindow.loadURL(urlToOpen)

  // Опционально: открывать DevTools
  // mainWindow.webContents.openDevTools()

  // Удаляем ссылку на окно при закрытии
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// Запуск приложения
app.on('ready', createWindow)

// Закрываем приложение, когда все окна закрыты (кроме macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

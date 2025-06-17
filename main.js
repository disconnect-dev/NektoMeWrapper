const { app, BrowserWindow, session } = require('electron')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const fetch = require('cross-fetch')

let mainWindow
let blocker

// AGGRESSIVE FIX
app.commandLine.appendSwitch('--disable-gpu')
app.commandLine.appendSwitch('--disable-gpu-compositing')
app.commandLine.appendSwitch('--disable-gpu-rasterization')
app.commandLine.appendSwitch('--disable-gpu-sandbox')
app.commandLine.appendSwitch('--disable-software-rasterizer')
app.commandLine.appendSwitch('--disable-background-timer-throttling')
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('--disable-renderer-backgrounding')
app.commandLine.appendSwitch('--disable-features=TranslateUI,VizDisplayCompositor')
app.commandLine.appendSwitch('--disable-3d-apis')
app.commandLine.appendSwitch('--disable-accelerated-2d-canvas')
app.commandLine.appendSwitch('--disable-accelerated-jpeg-decoding')
app.commandLine.appendSwitch('--disable-accelerated-mjpeg-decode')
app.commandLine.appendSwitch('--disable-accelerated-video-decode')
app.commandLine.appendSwitch('--use-gl=disabled')

async function setupAdBlocker() {
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    blocker.enableBlockingInSession(session.defaultSession)
    console.log('AdBlocker - done!\n')
  } catch (error) {
    console.error('AdBlocker ERROR:', error)
  }
}

function createWindow() {
  const urlToOpen = 'https://nekto.me/chat/#/'
  const iconPath = './assets/app.png'
  
  mainWindow = new BrowserWindow({
    width: 654,
    height: 1036,
    frame: true,
    fullscreen: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      hardwareAcceleration: false,
      backgroundThrottling: false,
      experimentalFeatures: false,
      offscreen: false
    }
  })

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Renderer process crashed:', { killed })
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload()
    }
  })

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Window became unresponsive')
  })

  mainWindow.webContents.on('responsive', () => {
    console.log('Window became responsive again')
  })

  mainWindow.webContents.on('dom-ready', () => {
    const nektoAdBlockCSS = `
      .ad, .ads, .advertisement, .banner, .popup,
      [class*="ad-"], [id*="ad-"], [class*="ads-"], [id*="ads-"],
      .google-ads, .yandex-ad, .vk-ads,
      iframe[src*="ads"], iframe[src*="advertising"],
      div[style*="z-index: 999"], div[style*="z-index: 9999"],
      .modal-ad, .overlay-ad, .popup-overlay,
      [data-testid*="ad"], [data-cy*="ad"]
      {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        width: 0 !important;
        height: 0 !important;
      }
     
      body {
        overflow-x: hidden !important;
      }
    `
   
    mainWindow.webContents.insertCSS(nektoAdBlockCSS)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' }
  })

  if (blocker) {
    blocker.on('request-blocked', (request) => {
    })
   
    blocker.on('request-redirected', (request) => {
    })
  }

  mainWindow.loadURL(urlToOpen)
  
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await setupAdBlocker()
 
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const deniedPermissions = ['notifications', 'geolocation']
   
    if (deniedPermissions.includes(permission)) {
      return callback(false)
    }
   
    callback(true)
  })

  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent().replace(/Electron\/[\d.]+\s/, '')
  )

  createWindow()
})

app.on('gpu-process-crashed', (event, killed) => {
  console.error('GPU process crashed:', { killed })
})

app.on('child-process-gone', (event, details) => {
  console.error('Child process gone:', details)
  if (details.type === 'GPU') {
    console.log('GPU process crashed - running in software mode')
    event.preventDefault()
  }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

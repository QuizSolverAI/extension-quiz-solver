
class QuizSolverService {
  async fetchWithAuth(url, options = {}, user = null) {
    // get version of extension
    const manifest = chrome.runtime.getManifest();
    // get chrome or firefox or edge
    // check if edge 
    let browserName = "chrome";;
    if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Edg") != -1) {
      browserName = "edge";
    }

    //  add to options body if is exist
    if (options.body) {
      options.body = JSON.stringify({ ...JSON.parse(options.body), version: manifest.version, browser: browserName });
    } else {
      options.body = JSON.stringify({ version: manifest.version, browser: browserName });
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${user?.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        return response.json();
      } else
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  async fetchWithCredentials(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return response.json();
      } else
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}
class QuizConstants {
  static ERROR_LOGIN_WITH_EXTENSION = 'your extension is not connected to your account please login';
  static ERROR_CANNOT_READ_IMAGE = 'We can not read this image please try again';
  static ERROR_NO_ANSWER_FOUND = 'No answer found';
  static ERROR_CONTACT_ADMIN = 'Error! please contact admin.';
  static URL = "https://quizsolverai.com";
  // static URL = "http://127.0.0.1:8000";
  static GET_ANSWER = "/api/get-answer";
  static VERIFY = "/api/verify";
  static DEMO = "/api/demonstration";
  static LIKE_ANSWER = "/api/trakings-like";
  static OCR = "/api/ocr";
  static GET_IMAGE_URL = "/api/get-image-url";
  static ERROR = "/api/error";
  static BROWSER_NAME = "chrome";
}
class QuizSolverRequest {
  constructor(text, type, prompt, source, user_id, tool, details = null) {
    this.text = text;
    this.type = type;
    this.prompt = prompt;
    this.source = source;
    this.user_id = user_id;
    this.tool = tool;
    this.details = details;
  }
}
class QuizSolverSettings {
  constructor(data = null) {
    if (data) {
      this.smart = data.smart === true ? true : false;
      this.active = data.active === true ? true : false;
      this.auto = data.auto === true ? true : false;
      this.select = data.select === true ? true : false;
      this.screen = data.screen === true ? true : false;
      this.log = data.log === true ? true : false;
      this.question = data.question === true ? true : false;
      this.lang = data.lang ? data.lang : 'eng';
    } else {
      this.smart = true;
      this.active = true;
      this.auto = true;
      this.select = true;
      this.screen = true;
      this.log = true;
      this.question = true;
      this.lang = 'eng';
    }
  }
}
class QuizSolverUser {
  constructor() {
    (async () => {
      this.id = null;
      this.token = null;
      this.settings = { smart: false, active: false };
      this.service = new QuizSolverService();
      // this.data = await this.load();
    })();
  }
  async load() {
    let user = await this.loadAndHandleUser();
    let set = await this.loadAndHandleSetting();
    return true;
  }
  setSettings(settings) {
    if (settings) {
      this.settings = new QuizSolverSettings(settings);
    } else {
      this.settings = new QuizSolverSettings();
    }
    chrome.storage.sync.set({ settings: this.settings });
  }
  async isLoggedIn() {
    if (this.id !== null && this.token !== null) {
      try {
        const isValidSession = await this.verifySession();
        return isValidSession;
      } catch (error) {
        console.log("Error during session verification:", error);
        return false;
      }
    } else {
      return false;
    }
  }
  async verifySession() {
    const result = await this.service.fetchWithCredentials(`${QuizConstants.URL}${QuizConstants.VERIFY}`, { method: 'GET' });
    if (result && result.user) {
      Object.keys(result.user).forEach(key => {
        if (key !== 'AccessToken' && key !== 'settings')
          this[key] = result.user[key];
      });
      this.token = result.AccessToken;
      chrome.storage.sync.set({ user: this });
      return true;
    }
    return false;
  }
  async loadAndHandleUser() {
    try {
      const { user } = await chrome.storage.sync.get('user');
      if (user) {
        this.id = user.id;
        this.token = user.token;
      }
      return user;
    } catch (error) {
      console.log("Error loading user from storage:", error);
    }
  }
  async loadAndHandleSetting() {
    try {
      const { settings } = await chrome.storage.sync.get('settings');
      if (settings) {
        this.setSettings(settings);
      }
      else {
        this.setSettings(null);
      }
      return settings;
    } catch (error) {
      console.log("Error loading settings from storage:", error);
    }
  }
  handleStorageChanges(changes) {
    if (changes.user) {
      this.loadAndHandleUser();
    }
    if (changes.settings) {
      this.loadAndHandleSetting();
    }
  }
}
class QuizSolver {
  constructor() {
    this.user = new QuizSolverUser();
    this.contextMenuIds = [];
    this.service = new QuizSolverService();
    this.contextMenuId = "addAskQuizSolverToContextMenu";
    this.boundHandleContextMenuClick = this.handleContextMenuClick.bind(this);
    this.user.load().then(() => {
      this.ensureContextMenu();
    }).catch(error => console.log("Failed to load user or settings:", error));
    this.setupGlobalErrorHandlers();
    this.initializeStorageListener();
  }
  initializeStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.settings) {
        this.user.loadAndHandleSetting().then(() => {
          this.ensureContextMenu();
        });
      }
    });
  }
  async getAnswer(request) {
    return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.GET_ANSWER}`, {
      method: 'POST',
      body: JSON.stringify(request)
    }, this.user);
  }
  async processOCR(dataUrl) {
    const response = await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.OCR}`, {
      method: 'POST',
      body: JSON.stringify({ image: dataUrl })
    }, this.user);
    return response.text;
  }
  async likeOrDislikeAnswer(trackingId, like) {
    return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.LIKE_ANSWER}`, {
      method: 'POST',
      body: JSON.stringify({ tracking_id: trackingId, like: like ? 1 : 0, user_id: this.user.id, dislike: like ? 0 : 1 })
    }, this.user);
  }
  async updateDemonstration() {
    return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.DEMO}`, {
      method: 'POST',
      body: JSON.stringify({ demo: 'updated' })
    }, this.user);
  }
  async pullErrorMessages(Error) {
    return this.service.fetchWithCredentials(`${QuizConstants.URL}${QuizConstants.ERROR}`, {
      method: 'POST',
      body: JSON.stringify({ message: Error })
    });
  }
  async processCaptureVisibleTab(dataUrl, params) {
    try {
      const data = await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.GET_IMAGE_URL}`, {
        method: 'POST',
        body: JSON.stringify({ dataUrl: dataUrl, ...params })
      }, this.user);
      if (data.error) {
        return { error: true, errorMsg: data.message || QuizConstants.ERROR_CANNOT_READ_IMAGE };
      }
      return { error: false, text: data.text, image_id: data.id };
    } catch (error) {
      console.log("Error in processCaptureVisibleTab:", error);
      return { error: true, errorMsg: QuizConstants.ERROR_CANNOT_READ_IMAGE };
    }
  }
  ensureContextMenu() {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.log('Error removing context menus:', chrome.runtime.lastError);
      }
      if (this.user.settings && this.user.settings.smart === true && this.user.settings.active === true) {
        this.createContextMenu();
      }
    });
  }
  createContextMenu() {
    chrome.contextMenus.create({
      id: this.contextMenuId,
      title: "Ask QuizSolver",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.log("Error creating context menu:", chrome.runtime.lastError.message);
      } else {
      }
    });
    chrome.contextMenus.onClicked.removeListener(this.boundHandleContextMenuClick);
    chrome.contextMenus.onClicked.addListener(this.boundHandleContextMenuClick);
  }
  async handleContextMenuClick(info, tab) {
    if (info.menuItemId !== "addAskQuizSolverToContextMenu") return;
    try {
      const responseHead = await this.sendMessageToTab(tab.id, { action: "qs24_findSelectedElement" });
      let selectedTextHTML = responseHead.selectedElement || '';
      const isLoggedIn = await this.user.verifySession();
      if (!isLoggedIn) {
        this.sendMessageToTab(tab.id, { action: "qs24_selectionText_prompt", errorMsg: QuizConstants.ERROR_LOGIN_WITH_EXTENSION });
        return;
      }
      this.sendMessageToTab(tab.id, { action: "qs24_spinner_selectionText_prompt" });
      const selectedText = info.selectionText;
      if (!selectedText) {
        this.sendMessageToTab(tab.id, { action: "qs24_selectionText_prompt", errorMsg: "Please select text first" });
        return;
      }
      const newItem = { text: selectedText, url: tab.url, title: tab.title };
      const request = new QuizSolverRequest(selectedTextHTML, "Text", selectedText, tab.url, this.user.id, 'SELECT');
      const response = await this.getAnswer(request);
      if (response.error) {
        this.sendMessageToTab(tab.id, { action: "qs24_selectionText_prompt", errorMsg: response.error || QuizConstants.ERROR_CONTACT_ADMIN });
        return;
      }
      this.sendMessageToTab(tab.id, { action: "qs24_selectionText_prompt", newItem, answer: response.answer, tracking_id: response.tracking, selectedText: selectedText });
    } catch (error) {
      this.sendMessageToTab(tab.id, { action: "qs24_selectionText_prompt", errorMsg: QuizConstants.ERROR_CONTACT_ADMIN });
    }
  }
  async sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
  setupGlobalErrorHandlers() {
    self.addEventListener('unhandledrejection', (event) => {
      this.sendErrorToServer({
        error: { message: event.reason.message },
        type: 'unhandledrejection',
        user: this.user.id || null
      }).catch(console.log);
    });
  }
  async sendErrorToServer(data) {
    if (typeof data === 'string') {
      data = {
        user: this.user.id || null,
        error: { message: data },
        type: 'ExtensionError'
      }
    }
    if (data && data.stack) {
      data = {
        user: this.user.id || null,
        error: data.stack,
        type: 'ExtensionError'
      }
    }
    try {
      await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.ERROR}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, this.user);
    } catch (error) {
      console.log('Failed to send error to server:', error);
    }
  }
  callspinner(id, action) {
    chrome.tabs.sendMessage(id, { action: action });
  }
}
const quizSolver = new QuizSolver();
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === "install") {
      chrome.storage.sync.set({ settings: new QuizSolverSettings() }, function () { });
      await quizSolver.user.verifySession();
    }
    if (details.reason === "update") {
      chrome.storage.sync.get(['settings'], function (result) {
        let settings;
        if (typeof result.settings === 'string') {
          try {
            settings = JSON.parse(result.settings);
            chrome.storage.sync.set({ settings: new QuizSolverSettings(settings) });
          } catch (e) {
            console.log('Error parsing settings:', e);
          }
        }
        if (!result.settings) {
          chrome.storage.sync.set({ settings: new QuizSolverSettings() });
        }
      });
      await quizSolver.user.verifySession();
    }
  } catch (error) {
    console.log(error);
  }
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    quizSolver.user.handleStorageChanges(changes);
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case "qs24_verifySession":
          sendResponse({ isLoggedIn: await quizSolver.user.verifySession(), user: quizSolver.user });
          break;
        case "qs24_getAnswer":
          if (!quizSolver.user || !quizSolver.user.id || !quizSolver.user.token) {
            sendResponse({ error: true, errorMsg: QuizConstants.ERROR_LOGIN_WITH_EXTENSION });
            break;
          }
          let details = message.details || null;
          const request = new QuizSolverRequest(message.prompt, message.type, message.prompt, message.source, quizSolver.user.id, message.tool, details);
          sendResponse(await quizSolver.getAnswer(request));
          break;
        case "qs24_captureVisibleTab":
          const dataUrl = await new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          quizSolver.callspinner(sender.tab.id, "qs24_spinner_captureVisibleTab");
          const result = await quizSolver.processCaptureVisibleTab(dataUrl, {
            param: message.data,
            lang: message.lang,
            devicePixelRatio: message.devicePixelRatio
          });
          sendResponse(result);
          break;
        case "qs24_crappyCaptureVisibleTab":
          const result2 = await quizSolver.processCaptureVisibleTab(message.dataUrl, {
            param: message.data,
            lang: message.lang
          });
          sendResponse(result2);
          break;
        case "qs24_ocr":
          if (!quizSolver.user || !quizSolver.user.token) {
            sendResponse({ error: true, errorMsg: QuizConstants.ERROR_LOGIN_WITH_EXTENSION });
            break;
          }
          sendResponse({ text: await quizSolver.processOCR(message.dataUrl) });
          break;
        case "qs24_likeAnswer":
          if (!quizSolver.user || !quizSolver.user.token) {
            sendResponse({ error: true, errorMsg: QuizConstants.ERROR_LOGIN_WITH_EXTENSION });
            break;
          }
          sendResponse(await quizSolver.likeOrDislikeAnswer(message.tracking_id, message.like));
          break;
        case "qs24_updateDemonstration":
          sendResponse(await quizSolver.updateDemonstration());
          break;
        case "qs24_sendErrorToServer":
          sendResponse(await quizSolver.sendErrorToServer(message.data));
          break;
        default:
          console.log(`Unknown action: ${message.action}`);
          sendResponse({ error: true, errorMsg: "Unknown action" });
      }
    } catch (error) {
      quizSolver.sendErrorToServer(error);
      sendResponse({ error: true, errorMsg: QuizConstants.ERROR_CONTACT_ADMIN });
    }
  })();
  return true;
});
chrome.commands.onCommand.addListener((command) => {
  try {
    if (command === "run_quickSnapshot") {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tabId = tabs[0]?.id;
        if (!quizSolver.user.settings || !quizSolver.user.settings.active || !quizSolver.user.settings.screen) return;
        chrome.tabs.sendMessage(tabId, { action: "qs24_capture_action" });
      });
    }
  } catch (error) {
    quizSolver.sendErrorToServer(error);
  }
});
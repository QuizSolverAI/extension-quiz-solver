class QuizSolverService{async fetchWithAuth(e,t={},s=null){const i=chrome.runtime.getManifest();let r="chrome";navigator&&navigator.userAgent&&-1!=navigator.userAgent.indexOf("Edg")&&(r="edge");let o=navigator.language||navigator.userLanguage;o&&(o=o.split("-")[0]),t.body?t.body=JSON.stringify({...JSON.parse(t.body),version:i.version,browser:r,lang:o}):t.body=JSON.stringify({version:i.version,browser:r,lang:o});const n=await fetch(e,{...t,headers:{...t.headers,Authorization:`Bearer ${s?.token}`,Accept:"application/json","Content-Type":"application/json"}});if(!n.ok){if(400===n.status||401===n.status||403===n.status)return n.json();throw new Error(`HTTP error! status: ${n.status}`)}return n.json()}async fetchWithCredentials(e,t={}){const s=await fetch(e,{...t,credentials:"include"});if(!s.ok){if(401===s.status||403===s.status)return s.json();throw new Error(`HTTP error! status: ${s.status}`)}return s.json()}async fetchAndConvertImage(e){try{const t=await fetch(e,{mode:"cors",credentials:"omit"}),s=await t.blob();return new Promise(((e,t)=>{const i=new FileReader;i.onloadend=()=>e(i.result),i.onerror=t,i.readAsDataURL(s)}))}catch(e){throw console.error("Error fetching image:",e),e}}}class QuizConstants{static get ERROR_LOGIN_WITH_EXTENSION(){return chrome.i18n.getMessage("error_login")}static get ERROR_CANNOT_READ_IMAGE(){return chrome.i18n.getMessage("error_cannot_read_image")}static get ERROR_NO_ANSWER_FOUND(){return chrome.i18n.getMessage("error_no_answer_found")}static get ERROR_CONTACT_ADMIN(){return chrome.i18n.getMessage("error_contact_admin")}static get ERROR_UNKNOWN_ACTION(){return chrome.i18n.getMessage("error_unknown_action")}static URL="https://quizsolverai.com";static VERIFY="/api/verify";static DEMO="/api/demonstration";static LIKE_ANSWER="/api/trakings-like";static OCR="/api/ocr";static ERROR="/api/error";static BROWSER_NAME="chrome";static NOTIFICATION="/api/notifications";static GET_ANSWER_V2="/api/v2/get-answer"}class QuizSolverRequestImage{constructor(e,t,s){this.dataUrl=e,this.params=t,this.devicePixelRatio=s}}class QuizSolverRequest{constructor(e,t,s,i,r,o,n=null,a=null){this.text=e,this.type=t,this.prompt=s,this.source=i,this.user_id=r,this.tool=o,this.details=n,this.image=a}}class QuizSolverSettings{constructor(e=null){this.initializeDefaults(),e&&(this.isActive=!0===e.isActive,this.autoDetection=!0===e.autoDetection,this.smartHighlight=!0===e.smartHighlight,this.quickSnapMode=!0===e.quickSnapMode,this.language=e.language||"eng",this.imageSolver=!0===e.imageSolver,this.notifications=!0===e.notifications,this.ghostMode=!0===e.ghostMode,e.popup&&(this.popup.showQuestion=!0===e.popup.showQuestion,this.popup.position=e.popup.position||"centerRight",this.popup.showCapturedImage=!0===e.popup.showCapturedImage),e.customStyle&&(this.customStyle.enabled=!0===e.customStyle.enabled,this.customStyle.background=e.customStyle.background||"#FFFFFF",this.customStyle.textColor=e.customStyle.textColor||"#000000",this.customStyle.opacity=e.customStyle.opacity||100,this.customStyle.border=!0===e.customStyle.border),this.defaultRequest=e.defaultRequest||"SOLVE_PROBLEM",this.requestTypes=e.requestTypes||{})}initializeDefaults(){this.isActive=!0,this.autoDetection=!0,this.smartHighlight=!0,this.quickSnapMode=!0,this.language="eng",this.imageSolver=!0,this.notifications=!0,this.ghostMode=!0,this.popup={showQuestion:!0,position:{x:0,y:0},showCapturedImage:!1},this.customStyle={enabled:!1,background:"#FFFFFF",textColor:"#000000",opacity:100,border:!0},this.defaultRequest="SOLVE_PROBLEM",this.requestTypes={solveProblem:!0,explainSolution:!1,mathOperations:!1,geometryCalculations:!1,translateText:!1,extractTextFromImage:!1,rewriteText:!1}}updateRequestTypes(){const e={SOLVE_PROBLEM:"solveProblem",EXPLAIN_SOLUTION:"explainSolution",MATH_OPERATIONS:"mathOperations",GEOMETRIC_CALCULATIONS:"geometryCalculations",TRANSLATE_TEXT:"translateText",EXTRACT_TEXT_FROM_IMAGE:"extractTextFromImage",REWRITE_TEXT:"rewriteText"};Object.keys(this.requestTypes).forEach((e=>{this.requestTypes[e]=!1})),"DISABLED"!==this.defaultRequest&&e[this.defaultRequest]&&(this.requestTypes[e[this.defaultRequest]]=!0)}toString(){return JSON.stringify(this)}}class QuizSolverUser{constructor(){(async()=>{this.id=null,this.token=null,this.settings={smartHighlight:!1,isActive:!1},this.service=new QuizSolverService})()}async load(){await this.loadAndHandleUser(),await this.loadAndHandleSetting();return!0}setSettings(e){this.settings=e?new QuizSolverSettings(e):new QuizSolverSettings,chrome.storage.sync.set({settings:this.settings})}async isLoggedIn(){if(null===this.id||null===this.token)return!1;try{return await this.verifySession()}catch(e){return console.log("Error during session verification:",e),!1}}async verifySession(){const e=await this.service.fetchWithCredentials(`${QuizConstants.URL}${QuizConstants.VERIFY}`,{method:"GET"});return!(!e||!e.user)&&(Object.keys(e.user).forEach((t=>{"AccessToken"!==t&&"settings"!==t&&(this[t]=e.user[t])})),this.token=e.AccessToken,chrome.storage.sync.set({user:this}),!0)}async loadAndHandleUser(){try{const{user:e}=await chrome.storage.sync.get("user");return e&&(this.id=e.id,this.token=e.token),e}catch(e){console.log("Error loading user from storage:",e)}}async loadAndHandleSetting(){try{const{settings:e}=await chrome.storage.sync.get("settings");return e?this.setSettings(e):this.setSettings(null),e}catch(e){console.log("Error loading settings from storage:",e)}}handleStorageChanges(e){e.user&&this.loadAndHandleUser(),e.settings&&this.loadAndHandleSetting()}}class QuizSolver{constructor(){this.user=new QuizSolverUser,this.contextMenuIds=[],this.service=new QuizSolverService,this.contextMenuId="addAskQuizSolverToContextMenu",this.notificationStorageKey="qs24_sent_notifications",this.maxNotificationAge=6048e5,this.boundHandleContextMenuClick=this.handleContextMenuClick.bind(this),this.user.load().then((()=>{this.ensureContextMenu()})).catch((e=>console.log("Failed to load user or settings:",e))),this.setupGlobalErrorHandlers(),this.initializeStorageListener()}initializeStorageListener(){chrome.storage.onChanged.addListener(((e,t)=>{"sync"===t&&e.settings&&this.user.loadAndHandleSetting().then((()=>{this.ensureContextMenu()}))}))}async getAnswer(e){return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.GET_ANSWER_V2}`,{method:"POST",body:JSON.stringify(e)},this.user)}async processOCR(e){return(await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.OCR}`,{method:"POST",body:JSON.stringify({image:e})},this.user)).text}async likeOrDislikeAnswer(e,t){return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.LIKE_ANSWER}`,{method:"POST",body:JSON.stringify({tracking_id:e,like:t?1:0,user_id:this.user.id,dislike:t?0:1})},this.user)}async updateDemonstration(){return this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.DEMO}`,{method:"POST",body:JSON.stringify({demo:"updated"})},this.user)}async pullErrorMessages(e){return this.service.fetchWithCredentials(`${QuizConstants.URL}${QuizConstants.ERROR}`,{method:"POST",body:JSON.stringify({message:e})})}async processGetAnswerV2(e){try{const t=await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.GET_ANSWER_V2}`,{method:"POST",body:JSON.stringify({...e})},this.user);return t.error?{error:!0,errorMsg:t.message||QuizConstants.ERROR_CANNOT_READ_IMAGE}:t}catch(e){return{error:!0,errorMsg:QuizConstants.ERROR_CANNOT_READ_IMAGE}}}ensureContextMenu(){chrome.contextMenus.removeAll((()=>{chrome.runtime.lastError&&console.log("Error removing context menus:",chrome.runtime.lastError),this.user.settings&&!0===this.user.settings.smartHighlight&&!0===this.user.settings.isActive&&this.createContextMenu()}))}createContextMenu(){chrome.contextMenus.create({id:this.contextMenuId,title:"Ask QuizSolver",contexts:["selection"]},(()=>{chrome.runtime.lastError&&console.log("Error creating context menu:",chrome.runtime.lastError.message)})),chrome.contextMenus.onClicked.removeListener(this.boundHandleContextMenuClick),chrome.contextMenus.onClicked.addListener(this.boundHandleContextMenuClick)}async handleContextMenuClick(e,t){if("addAskQuizSolverToContextMenu"===e.menuItemId)try{this.sendMessageToTab(t.id,{action:"qs24_spinner_selectionText_prompt"});let s="";if(!await this.user.verifySession())return void this.sendMessageToTab(t.id,{action:"qs24_selectionText_prompt",errorMsg:QuizConstants.ERROR_LOGIN_WITH_EXTENSION});const i=e.selectionText;if(!i)return void this.sendMessageToTab(t.id,{action:"qs24_selectionText_prompt",errorMsg:chrome.i18n.getMessage("ErrorTextSelectedEmpty")});const r={text:i,url:t.url,title:t.title},o=new QuizSolverRequest(s,"Text",i,t.url,this.user.id,"SELECT"),n=await this.getAnswer(o);if(n.error)return void this.sendMessageToTab(t.id,{action:"qs24_selectionText_prompt",errorMsg:n.message||QuizConstants.ERROR_CONTACT_ADMIN});this.sendMessageToTab(t.id,{action:"qs24_selectionText_prompt",newItem:r,answer:n,selectedText:i})}catch(e){this.sendMessageToTab(t.id,{action:"qs24_selectionText_prompt",errorMsg:QuizConstants.ERROR_CONTACT_ADMIN})}}async sendMessageToTab(e,t){return new Promise(((s,i)=>{chrome.tabs.sendMessage(e,t,(e=>{chrome.runtime.lastError?i(chrome.runtime.lastError):s(e)}))}))}setupGlobalErrorHandlers(){self.addEventListener("unhandledrejection",(e=>{this.sendErrorToServer({error:{message:e.reason.message},type:"unhandledrejection",user:this.user.id||null}).catch(console.log)}))}async sendErrorToServer(e){"string"==typeof e&&(e={user:this.user.id||null,error:{message:e},type:"ExtensionError"}),e&&e.stack&&(e={user:this.user.id||null,error:e.stack,type:"ExtensionError"});try{await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.ERROR}`,{method:"POST",body:JSON.stringify(e)},this.user)}catch(e){console.log("Failed to send error to server:",e)}}callspinner(e,t){chrome.tabs.sendMessage(e,{action:t})}async getNotifications(){try{const e=await this.getSentNotifications(),t=e.length>0?e.map((e=>e.id)):0,s=await this.service.fetchWithAuth(`${QuizConstants.URL}${QuizConstants.NOTIFICATION}`,{method:"POST",body:JSON.stringify({last_notification_ids:t})},this.user);if(!s||0===s.length||s.error)return;for(const t of s)await this.processNotification(t,e);await this.cleanupOldNotifications()}catch(e){console.error("Error in getNotifications:",e),await this.sendErrorToServer({error:{message:"Error in getNotifications",details:e.message},type:"NotificationError",user:this.user.id||null})}}async processNotification(e,t){try{if(!e?.data?.message||!e.id)return void console.log("Invalid notification format:",e);if(t.some((t=>t.id===e.id)))return void console.log("Notification already sent:",e.id);const s=`qs24_${e.id}_${Date.now()}`,i={type:"basic",iconUrl:chrome.runtime.getURL("assets/logo.png"),title:"Quiz Solver AI",message:e.data.message,requireInteraction:!0,buttons:e.data.action?[{title:"View"}]:[]};await new Promise((e=>{chrome.notifications.create(s,i,(()=>{e()}))})),e.data.action?.startsWith("http")&&await this.storeNotificationUrl(s,e.data.action),await this.addToSentNotifications({id:e.id,notificationId:s,timestamp:Date.now()})}catch(e){console.error("Error processing notification:",e)}}async getSentNotifications(){return new Promise((e=>{chrome.storage.local.get(this.notificationStorageKey,(t=>{e(t[this.notificationStorageKey]||[])}))}))}async addToSentNotifications(e){const t=await this.getSentNotifications();return t.push(e),new Promise((e=>{chrome.storage.local.set({[this.notificationStorageKey]:t},e)}))}async storeNotificationUrl(e,t){return new Promise((s=>{chrome.storage.local.set({[`notification_url_${e}`]:t},s)}))}async getNotificationUrl(e){return new Promise((t=>{chrome.storage.local.get(`notification_url_${e}`,(s=>{t(s[`notification_url_${e}`])}))}))}async cleanupOldNotifications(){const e=await this.getSentNotifications(),t=Date.now(),s=e.filter((e=>t-e.timestamp<this.maxNotificationAge));s.length!==e.length&&await new Promise((e=>{chrome.storage.local.set({[this.notificationStorageKey]:s},e)}))}async showToast(e,t,s="error"){try{await this.sendMessageToTab(e,{action:"qs24_show_toast",message:t,type:s})}catch(e){console.error("Error showing toast:",e)}}handleCommand(e){chrome.tabs.query({active:!0,currentWindow:!0},(async t=>{const s=t[0];if(s)try{if("run_quickSnapshot"===e){if(!this.user.settings?.isActive)return void await this.showToast(s.id,chrome.i18n.getMessage("error_extension_not_active"));if(!this.user.settings?.quickSnapMode)return void await this.showToast(s.id,chrome.i18n.getMessage("error_quicksnap_not_enabled"));chrome.tabs.sendMessage(s.id,{action:"qs24_capture_action"})}if("run_SelectText"===e){if(!this.user.settings?.isActive)return void await this.showToast(s.id,chrome.i18n.getMessage("error_extension_not_active"));if(!this.user.settings?.smartHighlight)return void await this.showToast(s.id,chrome.i18n.getMessage("error_smart_highlight_not_enabled"));const e=await this.sendMessageToTab(s.id,{action:"qs24_getSelectedText"});if(e&&e.selectedText){const t={menuItemId:"addAskQuizSolverToContextMenu",selectionText:e.selectedText};await this.handleContextMenuClick(t,s)}else await this.showToast(s.id,chrome.i18n.getMessage("error_no_text_selected"))}}catch(e){console.error("Command error:",e),await this.showToast(s.id,chrome.i18n.getMessage("error_try_again")),this.sendErrorToServer(e)}}))}}const quizSolver=new QuizSolver;async function getShortcutSettings(){return new Promise((e=>{chrome.commands.getAll((t=>{const s={run_quickSnapshot:"Config",run_SelectText:"Config"};t.forEach((e=>{!e.shortcut||"run_quickSnapshot"!==e.name&&"run_SelectText"!==e.name||(s[e.name]=e.shortcut)})),e(s)}))}))}chrome.runtime.onInstalled.addListener((async e=>{try{"install"===e.reason&&(chrome.storage.sync.set({settings:new QuizSolverSettings},(function(){})),await quizSolver.user.verifySession()),"update"===e.reason&&(chrome.storage.sync.get(["settings"],(function(e){let t;if("string"==typeof e.settings)try{t=JSON.parse(e.settings),chrome.storage.sync.set({settings:new QuizSolverSettings(t)})}catch(e){console.log("Error parsing settings:",e)}e.settings||chrome.storage.sync.set({settings:new QuizSolverSettings})})),await quizSolver.user.verifySession())}catch(e){console.log(e)}})),chrome.storage.onChanged.addListener(((e,t)=>{"sync"===t&&quizSolver.user.handleStorageChanges(e)})),chrome.runtime.onMessage.addListener(((e,t,s)=>((async()=>{try{switch(e.action){case"qs24_verifySession":s({isLoggedIn:await quizSolver.user.verifySession(),user:quizSolver.user});break;case"qs24_getAnswer":if(!quizSolver.user||!quizSolver.user.id||!quizSolver.user.token){s({error:!0,errorMsg:QuizConstants.ERROR_LOGIN_WITH_EXTENSION});break}let i=e.details||null;const r=new QuizSolverRequest(e.prompt,e.type,e.prompt,e.source,quizSolver.user.id,e.tool,i);s(await quizSolver.getAnswer(r));break;case"qs24_getAnswerV2":if(!quizSolver.user||!quizSolver.user.id||!quizSolver.user.token){s({error:!0,errorMsg:QuizConstants.ERROR_LOGIN_WITH_EXTENSION});break}const o=await new Promise(((e,t)=>{chrome.tabs.captureVisibleTab(null,{format:"png"},(s=>{chrome.runtime.lastError?t(new Error(chrome.runtime.lastError.message)):e(s)}))}));e.request.dataUrlImg=o,e.request.user_id=quizSolver.user.id,quizSolver.callspinner(t.tab.id,"qs24_spinner_captureVisibleTab");let n=await quizSolver.processGetAnswerV2(e.request);s(n);break;case"qs24_getImageSolver":if(!quizSolver.user||!quizSolver.user.id||!quizSolver.user.token){s({error:!0,errorMsg:QuizConstants.ERROR_LOGIN_WITH_EXTENSION});break}quizSolver.callspinner(t.tab.id,"qs24_spinner_captureVisibleTab");let a=await quizSolver.processGetAnswerV2(e.request);s(a);break;case"qs24_convertImageToBase64":await quizSolver.service.fetchAndConvertImage(e.imageUrl).then((e=>{s({base64Data:e})})).catch((e=>{console.error("Error converting image:",e),s({error:"Failed to convert image"})}));case"qs24_get_shortcuts":try{const e=await getShortcutSettings();s(e)}catch(e){console.error("Error getting shortcuts:",e),s({run_quickSnapshot:"Config",run_SelectText:"Config"})}break;case"qs24_likeAnswer":if(!quizSolver.user||!quizSolver.user.token){s({error:!0,errorMsg:QuizConstants.ERROR_LOGIN_WITH_EXTENSION});break}s(await quizSolver.likeOrDislikeAnswer(e.tracking_id,e.like));break;case"qs24_updateDemonstration":s(await quizSolver.updateDemonstration());break;case"qs24_sendErrorToServer":s(await quizSolver.sendErrorToServer(e.data));break;default:console.log(`Unknown action: ${e.action}`),s({error:!0,errorMsg:QuizConstants.ERROR_UNKNOWN_ACTION})}}catch(e){quizSolver.sendErrorToServer(e),s({error:!0,errorMsg:QuizConstants.ERROR_CONTACT_ADMIN})}})(),!0))),chrome.commands.onCommand.addListener((e=>{quizSolver.handleCommand(e)})),chrome.alarms.create("checkNotifications",{periodInMinutes:10}),chrome.alarms.onAlarm.addListener((e=>{quizSolver.user.settings&&quizSolver.user.settings.isActive&&quizSolver.user.settings.notifications&&"checkNotifications"===e.name&&quizSolver.getNotifications()})),chrome.notifications.onClicked.addListener((async e=>{try{const t=await quizSolver.getNotificationUrl(e);t&&chrome.tabs.create({url:t}),chrome.notifications.clear(e)}catch(e){console.error("Error handling notification click:",e)}})),chrome.notifications.onButtonClicked.addListener((async(e,t)=>{if(0===t)try{const t=await quizSolver.getNotificationUrl(e);t&&chrome.tabs.create({url:t}),chrome.notifications.clear(e)}catch(e){console.error("Error handling notification button click:",e)}}));
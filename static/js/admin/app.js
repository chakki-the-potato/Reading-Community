import { initFixTab, showReview } from './fix-tab.js';
import { initLogin, isLoggedIn } from './login.js';
import { initNoticeTab } from './notice-tab.js';
import { initPaymentsTab } from './payments-tab.js';
import { initQuarterTab } from './quarter-tab.js';
import { reloadQuarters } from './quarter-state.js';
import { initSaveBar } from './save-bar.js';
import { initTabNav } from './tab-nav.js';
import { initTokenPanel } from './token-panel.js';
import { $, errorText } from './ui.js';
import { initVerifyTab } from './verify-tab.js';

let started = false;

async function loadInitialData() {
  try {
    await reloadQuarters();
    $('verifyQuarter').dispatchEvent(new Event('change'));
  } catch (err) {
    console.error(err);
    $('verifyError').textContent = errorText(err);
  }
}

function startApp() {
  $('loginView').hidden = true;
  $('appView').hidden = false;
  if (started) return;
  started = true;
  initTokenPanel();
  initSaveBar();
  initVerifyTab({ onReview: showReview });
  initFixTab();
  initPaymentsTab();
  initQuarterTab();
  initNoticeTab();
  initTabNav('verify');
  loadInitialData();
}

initLogin(startApp);
if (isLoggedIn()) startApp();

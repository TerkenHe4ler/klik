import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ciovpbzekzxkkochyskm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zaVETsBIz9UEqlNSLJaZug_UK_fcaMv';
const SAVE_TABLE = 'game_saves';
const ACCOUNT_SEEN_KEY = 'klik.account-session-seen';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let currentSession = null;
let saveTimer = null;
let pendingSave = Promise.resolve();
let gameScriptLoaded = false;
let saveTrackingInstalled = false;

function isGameStorageKey(key) {
    return !key.startsWith('sb-') && key !== ACCOUNT_SEEN_KEY;
}

function collectGameSave() {
    const save = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && isGameStorageKey(key)) {
            save[key] = localStorage.getItem(key);
        }
    }
    return save;
}

function clearGameSave() {
    Object.keys(localStorage).forEach(key => {
        if (isGameStorageKey(key)) localStorage.removeItem(key);
    });
}

function restoreGameSave(save) {
    clearGameSave();
    if (!save || typeof save !== 'object' || Array.isArray(save)) return;
    Object.entries(save).forEach(([key, value]) => {
        if (isGameStorageKey(key) && typeof value === 'string') {
            localStorage.setItem(key, value);
        }
    });
}

function showAuthScreen(message = '') {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    if (sidebar) sidebar.style.display = 'none';
    if (content) {
        content.style.marginRight = '0';
        content.style.display = 'flex';
        content.style.alignItems = 'safe center';
        content.style.justifyContent = 'center';
        content.style.minHeight = '100vh';
    }

    const intro = document.getElementById('intro');
    intro.innerHTML = `
        <section class="auth-panel">
            <h1>🐉 Smocze Włości</h1>
            <p>Zaloguj się lub utwórz konto, aby zapisywać postępy gry w chmurze.</p>
            <div style="display:flex;gap:8px;">
                <button type="button" id="auth-login-tab">Logowanie</button>
                <button type="button" id="auth-signup-tab">Rejestracja</button>
            </div>
            <form id="auth-form">
                <label for="auth-email">E-mail</label>
                <input id="auth-email" name="email" type="email" autocomplete="email" required>
                <label for="auth-password">Hasło</label>
                <input id="auth-password" name="password" type="password" autocomplete="current-password" minlength="6" required>
                <div id="auth-password-confirm-field" hidden>
                    <label for="auth-password-confirm">Powtórz hasło</label>
                    <input id="auth-password-confirm" name="password-confirm" type="password" autocomplete="new-password" minlength="6">
                </div>
                <button id="auth-submit" type="submit">Zaloguj się</button>
            </form>
            <div id="auth-message" class="auth-message" role="status" aria-live="polite"></div>
        </section>
    `;

    let mode = 'login';
    const form = document.getElementById('auth-form');
    const submit = document.getElementById('auth-submit');
    const messageEl = document.getElementById('auth-message');
    const password = document.getElementById('auth-password');
    const passwordConfirmField = document.getElementById('auth-password-confirm-field');
    const passwordConfirm = document.getElementById('auth-password-confirm');
    const setMode = nextMode => {
        mode = nextMode;
        const signingUp = mode === 'signup';
        submit.textContent = signingUp ? 'Utwórz konto' : 'Zaloguj się';
        password.autocomplete = signingUp ? 'new-password' : 'current-password';
        passwordConfirmField.hidden = !signingUp;
        passwordConfirm.required = signingUp;
        document.getElementById('auth-login-tab').style.opacity = signingUp ? '0.65' : '1';
        document.getElementById('auth-signup-tab').style.opacity = signingUp ? '1' : '0.65';
        messageEl.textContent = '';
    };

    document.getElementById('auth-login-tab').addEventListener('click', () => setMode('login'));
    document.getElementById('auth-signup-tab').addEventListener('click', () => setMode('signup'));
    setMode('login');
    messageEl.textContent = message;

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submit.disabled = true;
        messageEl.textContent = mode === 'signup' ? 'Tworzenie konta…' : 'Logowanie…';
        const formData = new FormData(form);
        const email = String(formData.get('email')).trim();
        const passwordValue = String(formData.get('password'));

        try {
            if (mode === 'signup') {
                if (passwordValue !== String(formData.get('password-confirm'))) {
                    messageEl.textContent = 'Hasła nie są takie same.';
                    passwordConfirm.focus();
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password: passwordValue,
                    options: { emailRedirectTo: window.location.href.split('#')[0] }
                });
                if (error) throw error;
                if (!data.session) {
                    setMode('login');
                    messageEl.textContent = 'Konto utworzone. Sprawdź e-mail, potwierdź adres, a następnie zaloguj się.';
                    return;
                }
                await startAuthenticatedGame(data.session);
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwordValue });
            if (error) throw error;
            await startAuthenticatedGame(data.session);
        } catch (error) {
            messageEl.textContent = `Nie udało się kontynuować: ${error.message}`;
        } finally {
            submit.disabled = false;
        }
    });
}

function showSaveSetupError(error) {
    showAuthScreen(
        `Nie można wczytać zapisu z bazy (${error.message}). ` +
        'Otwórz plik supabase/schema.sql w repozytorium, wklej jego zawartość w Supabase → SQL Editor → New query i uruchom ją. Następnie odśwież stronę.'
    );
}

async function fetchAccountSave(userId) {
    const { data, error } = await supabase
        .from(SAVE_TABLE)
        .select('save_data')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return data?.save_data ?? null;
}

async function saveAccountNow() {
    if (!currentSession) return;
    const { error } = await supabase.from(SAVE_TABLE).upsert({
        user_id: currentSession.user.id,
        save_data: collectGameSave(),
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
    setSaveStatus('Zapisano w chmurze');
}

function setSaveStatus(message) {
    const status = document.getElementById('account-save-status');
    if (status) status.textContent = message;
}

function scheduleSave() {
    if (!currentSession) return;
    setSaveStatus('Zapisywanie…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveTimer = null;
        pendingSave = pendingSave.catch(() => {}).then(saveAccountNow);
        pendingSave.catch(error => {
            setSaveStatus(`Błąd zapisu: ${error.message}`);
        });
    }, 1000);
}

function flushScheduledSave() {
    if (saveTimer !== null) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    pendingSave = pendingSave.catch(() => {}).then(saveAccountNow);
    pendingSave.catch(error => {
        setSaveStatus(`Błąd zapisu: ${error.message}`);
    });
    return pendingSave;
}

function installSaveTracking() {
    if (saveTrackingInstalled) return;
    saveTrackingInstalled = true;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalClear = Storage.prototype.clear;

    Storage.prototype.setItem = function (key, value) {
        originalSetItem.call(this, key, value);
        if (this === localStorage && isGameStorageKey(String(key))) scheduleSave();
    };
    Storage.prototype.removeItem = function (key) {
        originalRemoveItem.call(this, key);
        if (this === localStorage && isGameStorageKey(String(key))) scheduleSave();
    };
    Storage.prototype.clear = function () {
        originalClear.call(this);
        if (this === localStorage) scheduleSave();
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && saveTimer !== null) {
            flushScheduledSave();
        }
    });
    window.addEventListener('pagehide', () => {
        if (saveTimer !== null) flushScheduledSave();
    });
}

function addAccountControls(session) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let controls = document.getElementById('account-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'account-controls';
        controls.innerHTML = `
            <span id="account-email"></span>
            <span id="account-save-status" role="status" aria-live="polite">Połączono z chmurą</span>
            <button id="account-signout" type="button">Wyloguj</button>
        `;
        const heading = sidebar.querySelector('h2');
        sidebar.insertBefore(controls, heading || null);
        document.getElementById('account-signout').addEventListener('click', signOut);
    }
    document.getElementById('account-email').textContent = session.user.email || 'Zalogowano';
}

async function signOut() {
    const button = document.getElementById('account-signout');
    button.disabled = true;
    try {
        await flushScheduledSave();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        currentSession = null;
        localStorage.setItem(ACCOUNT_SEEN_KEY, 'true');
        clearGameSave();
        location.reload();
    } catch (error) {
        setSaveStatus(`Nie wylogowano, bo zapis się nie powiódł: ${error.message}`);
        button.disabled = false;
    }
}

async function loadGameScript() {
    if (gameScriptLoaded) return;
    gameScriptLoaded = true;
    const script = document.createElement('script');
    script.src = 'script.js';
    script.onerror = () => showAuthScreen('Nie udało się załadować plików gry. Odśwież stronę i spróbuj ponownie.');
    document.body.appendChild(script);
}

async function startAuthenticatedGame(session) {
    currentSession = session;
    const hadAccount = localStorage.getItem(ACCOUNT_SEEN_KEY) === 'true';
    const localSave = collectGameSave();

    let remoteSave;
    try {
        remoteSave = await fetchAccountSave(session.user.id);
    } catch (error) {
        currentSession = null;
        showSaveSetupError(error);
        return;
    }

    if (remoteSave !== null) {
        restoreGameSave(remoteSave);
    } else if (hadAccount || Object.keys(localSave).length === 0) {
        clearGameSave();
    }

    localStorage.setItem(ACCOUNT_SEEN_KEY, 'true');
    addAccountControls(session);
    installSaveTracking();
    try {
        await saveAccountNow();
    } catch (error) {
        currentSession = null;
        showSaveSetupError(error);
        return;
    }
    await loadGameScript();
}

async function initialize() {
    showAuthScreen();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        showAuthScreen(`Nie udało się sprawdzić sesji: ${error.message}`);
        return;
    }
    if (data.session) {
        await startAuthenticatedGame(data.session);
    }
}

initialize().catch(error => {
    showAuthScreen(`Nie udało się uruchomić logowania: ${error.message}`);
});

// Оболочка приложения «Кинотека» для Samsung Tizen: полка живёт на сервере и открыта здесь во встроенном окне на весь экран.
// Оболочка остаётся под ней, чтобы по просьбе полки открывать внешние ссылки (HDRezka, TMDB) в браузере Samsung.
var SHELF = 'https://claude-vm.tail65a20f.ts.net:10000/?app=tv';
var frame = document.getElementById('shelf'), msg = document.getElementById('msg');
var login = document.getElementById('login'), pw = document.getElementById('pw');
var splash = document.getElementById('splash');
// заставка «Загружаю полку» анимирована (проектор, луч с размытием): под открытой полкой телевизор продолжал её рисовать —
// на LG это съедало половину плавности. Полка загрузилась — заставку убираем совсем
function splashOff() { splash.style.display = 'none'; }  // kino-ready

// кнопки пульта, которые приложение забирает себе, — только пока оно на экране: ушли в браузер (HDRezka, TMDB) —
// отпускаем, иначе браузер их не получает (каналами там листают страницу)
var KEYS = ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'ChannelUp', 'ChannelDown'];
function grabKeys(on) {
  KEYS.forEach(function (k) {
    try { if (on) tizen.tvinputdevice.registerKey(k); else tizen.tvinputdevice.unregisterKey(k); } catch (e) { /* не телевизор или нет такой кнопки */ }
  });
}
grabKeys(true);
document.addEventListener('visibilitychange', function () { grabKeys(!document.hidden); });

frame.addEventListener('load', function () {
  frame.classList.add('on');
  if (login.hidden) frame.focus();
});
// вернулись из браузера Samsung — нажатия пульта снова в полку. Только если фокус правда у оболочки:
// иначе отберём его у поля ввода внутри полки (пароль, поиск) и печатать будет нельзя
// фокус оказался у оболочки (в полке пропал элемент, на котором стояла рамка) — первое же нажатие возвращает его полке
document.addEventListener('keydown', function () {
  if (login.hidden && document.activeElement !== frame) frame.focus();
});
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && login.hidden && document.activeElement !== frame) frame.focus();
});

// вход: экран входа полки просит пароль — показываем своё поле (в нём клавиатура телевизора работает) и передаём ей введённое
// поле ввода оболочки: и для пароля, и для поиска (во встроенном окне клавиатура телевизора не появляется)
var asking = 'password';
function ask(kind, value, error, label) {
  asking = kind;
  var search = kind === 'search';
  document.getElementById('lg-title').textContent = search ? 'Поиск' : 'Вход в Кинотеку';
  document.getElementById('lg-btn').textContent = search ? 'Найти' : 'Войти';
  document.getElementById('lg-err').textContent = error || '';
  pw.type = search ? 'text' : 'password';
  pw.placeholder = search ? (label || 'Название, актёр или франшиза') + ' — можно голосом 🎤' : 'Пароль';
  pw.value = value || '';
  login.hidden = false;
  setTimeout(function () { pw.focus(); }, 200);
}
function askPassword(error) { ask('password', '', error); }
function closeAsk() {
  pw.blur();
  login.hidden = true;
  frame.focus();
}
login.addEventListener('submit', function (e) {
  e.preventDefault();
  if (asking === 'password' && !pw.value) return;
  frame.contentWindow.postMessage({ kino: asking === 'search' ? 'search-text' : 'password', value: pw.value }, '*');
  closeAsk();
});
// «Назад» в поиске — закрыть поле, ничего не меняя
document.addEventListener('keydown', function (e) {
  if (!login.hidden && asking === 'search' && (e.keyCode === 10009 || e.key === 'Escape')) { e.preventDefault(); closeAsk(); }
}, true);
pw.addEventListener('keydown', function (e) { if (e.keyCode === 13 || e.keyCode === 65376) { e.preventDefault(); login.requestSubmit ? login.requestSubmit() : login.dispatchEvent(new Event('submit')); } });

// полка просит открыть ссылку — запускаем браузер Samsung
window.addEventListener('message', function (e) {
  var d = e.data || {};
  if (e.source === frame.contentWindow && (d.kino === 'ready' || d.kino === 'login')) splashOff();
  if (e.source === frame.contentWindow && d.kino === 'login') { askPassword(d.error); return; }
  if (e.source === frame.contentWindow && d.kino === 'search') { ask('search', d.value, '', d.label); return; }
  if (d.kino !== 'open' || !d.url) return;
  try {
    var ctl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view', d.url);
    tizen.application.launchAppControl(ctl, null, function () {}, function (err) { msg.textContent = 'Браузер не открылся: ' + (err && err.message); });
  } catch (err) { /* не телевизор */ }
});

function go() { frame.src = SHELF; }
if (navigator.onLine === false) {
  msg.textContent = 'Нет интернета — открою, как только появится';
  window.addEventListener('online', go);
} else {
  go();
}

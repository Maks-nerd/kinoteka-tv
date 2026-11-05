// Оболочка приложения «Кинотека» для Samsung Tizen: полка живёт на сервере и открыта здесь во встроенном окне на весь экран.
// Оболочка остаётся под ней, чтобы по просьбе полки открывать внешние ссылки (HDRezka, TMDB) в браузере Samsung.
var SHELF = 'https://claude-vm.tail65a20f.ts.net:10000/?app=tv';
var frame = document.getElementById('shelf'), msg = document.getElementById('msg');
var login = document.getElementById('login'), pw = document.getElementById('pw');

try {
  ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'ChannelUp', 'ChannelDown'].forEach(function (k) {
    try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* нет такой кнопки на пульте */ }
  });
} catch (e) { /* не телевизор */ }

frame.addEventListener('load', function () {
  frame.classList.add('on');
  if (login.hidden) frame.focus();
});
// вернулись из браузера Samsung — нажатия пульта снова в полку. Только если фокус правда у оболочки:
// иначе отберём его у поля ввода внутри полки (пароль, поиск) и печатать будет нельзя
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && login.hidden && document.activeElement !== frame) frame.focus();
});

// вход: экран входа полки просит пароль — показываем своё поле (в нём клавиатура телевизора работает) и передаём ей введённое
function askPassword(error) {
  document.getElementById('lg-err').textContent = error || '';
  login.hidden = false;
  pw.value = '';
  setTimeout(function () { pw.focus(); }, 200);
}
login.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!pw.value) return;
  frame.contentWindow.postMessage({ kino: 'password', value: pw.value }, '*');
  pw.blur();
  login.hidden = true;
  frame.focus();
});
pw.addEventListener('keydown', function (e) { if (e.keyCode === 13 || e.keyCode === 65376) { e.preventDefault(); login.requestSubmit ? login.requestSubmit() : login.dispatchEvent(new Event('submit')); } });

// полка просит открыть ссылку — запускаем браузер Samsung
window.addEventListener('message', function (e) {
  var d = e.data || {};
  if (e.source === frame.contentWindow && d.kino === 'login') { askPassword(d.error); return; }
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

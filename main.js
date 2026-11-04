// Оболочка приложения «Кинотека» для Samsung Tizen: полка живёт на сервере и открыта здесь во встроенном окне на весь экран.
// Оболочка остаётся под ней, чтобы по просьбе полки открывать внешние ссылки (HDRezka, TMDB) в браузере Samsung.
var SHELF = 'https://claude-vm.tail65a20f.ts.net:10000/?app=tv';
var frame = document.getElementById('shelf'), msg = document.getElementById('msg');

try {
  ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'ChannelUp', 'ChannelDown'].forEach(function (k) {
    try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* нет такой кнопки на пульте */ }
  });
} catch (e) { /* не телевизор */ }

frame.addEventListener('load', function () {
  frame.classList.add('on');
  frame.focus();
});
// вернулись из браузера Samsung — нажатия пульта снова в полку. Только если фокус правда у оболочки:
// иначе отберём его у поля ввода внутри полки (пароль, поиск) и печатать будет нельзя
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && document.activeElement !== frame) frame.focus();
});

// полка просит открыть ссылку — запускаем браузер Samsung
window.addEventListener('message', function (e) {
  var d = e.data || {};
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

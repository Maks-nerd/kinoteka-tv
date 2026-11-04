  var msg = document.getElementById('msg');
  msg.textContent = 'Шаг 2 — скрипт работает, открываю полку…';

  // Оболочка приложения «Кинотека» для Samsung Tizen: сама полка живёт на сервере, приложение просто открывает её.
  // Внутри приложения пульт работает как пульт: стрелки, ОК и «Назад» приходят странице нажатиями клавиш.
  var SHELF = 'https://claude-vm.tail65a20f.ts.net:10000/?app=tv';  // метка: полка знает, что открыта в приложении, а не в браузере
  try {
    ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'ChannelUp', 'ChannelDown'].forEach(function (k) {
      try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* нет такой кнопки на пульте */ }
    });
  } catch (e) { /* не телевизор */ }

  function go() {
    msg.textContent = 'Шаг 3 — перехожу на ' + SHELF;
    try { location.href = SHELF; } catch (e) { msg.textContent = 'Не открылось: ' + e; }
    // если через 10 секунд мы всё ещё здесь — переход не пустили: показываем, что случилось
    setTimeout(function () { msg.textContent = 'Шаг 4 — переход не случился за 10 секунд. ОК — попробовать ещё раз.'; }, 10000);
  }
  document.addEventListener('keydown', function (e) { if (e.keyCode === 13) go(); });
  if (navigator.onLine === false) {
    msg.textContent = 'Нет интернета — открою, как только появится';
    window.addEventListener('online', go);
  } else {
    go();
  }

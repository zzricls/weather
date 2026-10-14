/* ============================================================
   天气 · app.js
   ============================================================ */
'use strict';

/* ============================================================
   1. 常量与工具
   ============================================================ */

const $ = (id) => document.getElementById(id);

const WEATHER_CODES = {
  0:  { label: '晴',      icon: '☀️', type: 'clear' },
  1:  { label: '晴间多云', icon: '🌤️', type: 'partly' },
  2:  { label: '多云',    icon: '⛅', type: 'cloudy' },
  3:  { label: '阴',      icon: '☁️', type: 'cloudy' },
  45: { label: '雾',      icon: '🌫️', type: 'fog' },
  48: { label: '雾凇',    icon: '🌫️', type: 'fog' },
  51: { label: '毛毛雨',  icon: '🌦️', type: 'rain' },
  53: { label: '毛毛雨',  icon: '🌦️', type: 'rain' },
  55: { label: '毛毛雨',  icon: '🌦️', type: 'rain' },
  56: { label: '冻雨',    icon: '🌧️', type: 'rain' },
  57: { label: '冻雨',    icon: '🌧️', type: 'rain' },
  61: { label: '小雨',    icon: '🌧️', type: 'rain' },
  63: { label: '中雨',    icon: '🌧️', type: 'rain' },
  65: { label: '大雨',    icon: '🌧️', type: 'rain' },
  66: { label: '冻雨',    icon: '🌧️', type: 'rain' },
  67: { label: '冻雨',    icon: '🌧️', type: 'rain' },
  71: { label: '小雪',    icon: '🌨️', type: 'snow' },
  73: { label: '中雪',    icon: '🌨️', type: 'snow' },
  75: { label: '大雪',    icon: '❄️', type: 'snow' },
  77: { label: '雪粒',    icon: '🌨️', type: 'snow' },
  80: { label: '阵雨',    icon: '🌦️', type: 'rain' },
  81: { label: '阵雨',    icon: '🌦️', type: 'rain' },
  82: { label: '暴雨',    icon: '🌧️', type: 'rain' },
  85: { label: '阵雪',    icon: '🌨️', type: 'snow' },
  86: { label: '阵雪',    icon: '🌨️', type: 'snow' },
  95: { label: '雷阵雨',  icon: '⛈️', type: 'thunder' },
  96: { label: '雷阵雨',  icon: '⛈️', type: 'thunder' },
  99: { label: '强雷暴',  icon: '⛈️', type: 'thunder' },
};

// 八个时段的渐变色
const PERIODS = {
  late:      { from: '#050816', mid: '#0a1026', to: '#101838' },
  dawn:      { from: '#1a1040', mid: '#7a3d6b', to: '#e89a6c' },
  morning:   { from: '#f0a870', mid: '#a8c8e8', to: '#6ba3d9' },
  noon:      { from: '#4a90d9', mid: '#6aace8', to: '#a8d0f0' },
  afternoon: { from: '#5a98d4', mid: '#80b4e0', to: '#b8d4ee' },
  dusk:      { from: '#f07a4a', mid: '#c84a7a', to: '#4a2d6e' },
  evening:   { from: '#2d1e4a', mid: '#1a2040', to: '#101530' },
  night:     { from: '#0a1026', mid: '#0e1630', to: '#141d3a' },
};

// 彩蛋城市
const EGG_CITIES = {
  '霍格沃茨':   { lat: 56.79, lon: -4.43, theme: 'magic',      temp: 9.75, cond: '魔法天气', meta: ['9¾', '87%', '3.2 m/s'] },
  '亚特兰蒂斯': { lat: 31.00, lon: -24.0, theme: 'underwater', temp: 4,    cond: '深海静流', meta: ['4°', '100%', '0 m/s'] },
  '香格里拉':   { lat: 27.83, lon: 99.70, theme: 'fairy',      temp: 22,   cond: '云上仙境', meta: ['22°', '60%', '1.2 m/s'] },
  '北极':       { lat: 89.90, lon: 0,     theme: 'aurora',     temp: -38,  cond: '极光之夜', meta: ['-42°', '45%', '8.5 m/s'] },
  '撒哈拉':     { lat: 23.40, lon: 12.0,  theme: 'desert',     temp: 52,   cond: '流沙热浪', meta: ['56°', '8%', '2.0 m/s'] },
};

const MOON_WHISPERS = [
  '这么晚了还不睡？',
  '月亮说，该休息了。',
  '你也失眠了吗？',
  '夜空里，只有我们还醒着。',
  '明天会是个好天气。',
  '许个愿吧，我听着。',
];

const EGG_CLASSES = ['egg-rainbow','egg-magic','egg-underwater','egg-fairy','egg-aurora','egg-desert'];


/* ============================================================
   2. 全局状态
   ============================================================ */

const state = {
  city: null,
  weather: null,
  timezone: null,
  eggMode: null,
  forcedWeather: null,   // 'rain' | 'snow'
  tempClicks: 0,
  tempTimer: null,
  wasdBuffer: '',
  wasdTimer: null,
  timeWarp: null,
  pressTimer: null,
  pressActive: false,
  hintFound: false,
  localTimer: null,
};

let currentLayer = 'A'; // 当前可见的背景层


/* ============================================================
   3. 基础工具
   ============================================================ */

function weatherInfo(code) {
  return WEATHER_CODES[code] || { label: '未知', icon: '❓', type: 'clear' };
}

function iconFor(code, isDay) {
  if (!isDay) {
    if (code === 0 || code === 1) return '🌙';
    if (code === 2) return '☁️';
  }
  return weatherInfo(code).icon;
}

function getPeriod(hour) {
  if (hour < 4) return 'late';
  if (hour < 6) return 'dawn';
  if (hour < 9) return 'morning';
  if (hour < 12) return 'noon';
  if (hour < 17) return 'afternoon';
  if (hour < 19) return 'dusk';
  if (hour < 21) return 'evening';
  return 'night';
}

function parseLocalTime(iso) {
  // "2024-01-15T14:30"
  const [date, time] = iso.split('T');
  const [h, m] = time.split(':').map(Number);
  return { date, hour: h, minute: m };
}

function getLocalHM(tz) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date());
  } catch { return '--:--'; }
}

function getLocalHourFloat(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    let h = 0, m = 0;
    for (const p of parts) {
      if (p.type === 'hour')   h = parseInt(p.value, 10) % 24;
      if (p.type === 'minute') m = parseInt(p.value, 10);
    }
    return h + m / 60;
  } catch { return new Date().getHours(); }
}

function fmtTime(iso) {
  if (!iso) return '--:--';
  return iso.slice(11, 16);
}

function weekdayName(dateStr, todayStr) {
  if (dateStr === todayStr) return '今天';
  const d = new Date(dateStr + 'T00:00:00');
  return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}


/* ============================================================
   4. Toast / Loading / Panel 基础
   ============================================================ */

let toastTimer;
function toast(msg, ms = 2200) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 320);
  }, ms);
}

function setLoading(on) {
  $('loadingBar').hidden = !on;
}

function openPanel() {
  const p = $('cityPanel');
  p.hidden = false;
  $('cityTrigger').setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => p.classList.add('open'));
  setTimeout(() => $('citySearch').focus(), 200);
}

function closePanel() {
  const p = $('cityPanel');
  p.classList.remove('open');
  $('cityTrigger').setAttribute('aria-expanded', 'false');
  setTimeout(() => {
    p.hidden = true;
    $('citySearch').value = '';
    renderCityPanel('');
  }, 420);
}

function openModal(id) {
  const m = $(id);
  m.hidden = false;
  requestAnimationFrame(() => m.classList.add('open'));
}

function closeModal(id) {
  const m = $(id);
  m.classList.remove('open');
  setTimeout(() => { m.hidden = true; }, 320);
}


/* ============================================================
   5. 背景系统
   ============================================================ */

function applyBackground(period, instant = false) {
  const cfg = PERIODS[period] || PERIODS.night;
  const grad = `linear-gradient(180deg, ${cfg.from} 0%, ${cfg.mid} 55%, ${cfg.to} 100%)`;

  const A = $('bgA'), B = $('bgB');
  const next = currentLayer === 'A' ? B : A;
  const prev = currentLayer === 'A' ? A : B;

  if (instant) {
    next.style.transition = 'none';
    prev.style.transition = 'none';
    next.style.background = grad;
    next.style.opacity = '1';
    prev.style.opacity = '0';
    void next.offsetWidth;
    next.style.transition = '';
    prev.style.transition = '';
  } else {
    next.style.background = grad;
    next.style.opacity = '1';
    prev.style.opacity = '0';
  }
  currentLayer = currentLayer === 'A' ? 'B' : 'A';
}

function refreshBackground() {
  if (state.timeWarp) return;

  const tz = state.timezone;
  const hour = tz ? getLocalHourFloat(tz) : new Date().getHours();

  let wtype = 'clear';
  if (state.forcedWeather) {
    wtype = state.forcedWeather;
  } else if (state.weather) {
    wtype = weatherInfo(state.weather.current.weather_code).type;
  }

  const period = getPeriod(hour);
  applyBackground(period);
  document.body.dataset.period = period;
  document.body.dataset.weather = wtype;

  updateParticles(wtype, period);

  // 当地时间显示
  if (tz) $('localTime').textContent = getLocalHM(tz);
}


/* ============================================================
   6. 粒子系统
   ============================================================ */

function updateParticles(weather, period) {
  const c = $('particles');
  c.innerHTML = '';
  if (state.eggMode) return; // 彩蛋自己管

  // 雨
  if (weather === 'rain' || weather === 'thunder') {
    const n = weather === 'thunder' ? 90 : 65;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'p p-rain';
      p.style.left = Math.random() * 110 - 5 + '%';
      p.style.animationDuration = (0.45 + Math.random() * 0.55) + 's';
      p.style.animationDelay = (Math.random() * 2) + 's';
      p.style.opacity = 0.35 + Math.random() * 0.5;
      c.appendChild(p);
    }
  }

  // 雪
  if (weather === 'snow') {
    for (let i = 0; i < 48; i++) {
      const p = document.createElement('div');
      p.className = 'p p-snow';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (5 + Math.random() * 5) + 's';
      p.style.animationDelay = (Math.random() * 5) + 's';
      const s = 0.6 + Math.random() * 0.9;
      p.style.transform = `scale(${s})`;
      c.appendChild(p);
    }
  }

  // 星
  const isNight = period === 'night' || period === 'late' || period === 'evening';
  if (isNight && (weather === 'clear' || weather === 'partly')) {
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.className = 'p p-star';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 58 + '%';
      p.style.animationDuration = (2 + Math.random() * 3.5) + 's';
      p.style.animationDelay = (Math.random() * 3.5) + 's';
      c.appendChild(p);
    }
  }
}

function burstParticles() {
  const rect = $('temp').getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const c = $('particles');

  for (let i = 0; i < 42; i++) {
    const p = document.createElement('div');
    p.className = 'p p-burst';
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    const angle = (Math.PI * 2 * i) / 42 + Math.random() * 0.2;
    const dist = 70 + Math.random() * 140;
    p.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--by', Math.sin(angle) * dist + 'px');
    p.style.background = `hsl(${Math.random() * 360}, 85%, 72%)`;
    c.appendChild(p);
    setTimeout(() => p.remove(), 1300);
  }
}


/* ============================================================
   7. 天气请求与渲染
   ============================================================ */

async function fetchWeather(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m');
  url.searchParams.set('hourly', 'temperature_2m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function renderCurrent(data) {
  const cur = data.current;
  const info = weatherInfo(cur.weather_code);

  $('temp').textContent = Math.round(cur.temperature_2m);
  $('cond').textContent = info.label;
  $('feels').textContent = Math.round(cur.apparent_temperature) + '°';
  $('humidity').textContent = cur.relative_humidity_2m + '%';
  $('wind').textContent = (cur.wind_speed_10m / 3.6).toFixed(1) + ' m/s';

  $('sunrise').textContent = fmtTime(data.daily.sunrise[0]);
  $('sunset').textContent = fmtTime(data.daily.sunset[0]);
}

function renderHourly(data) {
  const c = $('hourly');
  c.innerHTML = '';
  const hourly = data.hourly;
  const key = data.current.time.slice(0, 13);
  let start = hourly.time.findIndex(t => t.slice(0, 13) === key);
  if (start < 0) start = 0;

  const end = Math.min(start + 24, hourly.time.length);
  for (let i = start; i < end; i++) {
    const t = hourly.time[i];
    const hour = parseInt(t.slice(11, 13), 10);
    const temp = Math.round(hourly.temperature_2m[i]);
    const code = hourly.weather_code[i];
    const isDay = hour >= 6 && hour < 19;

    const div = document.createElement('div');
    div.className = 'hour';
    div.innerHTML =
      `<div class="h-time">${i === start ? '现在' : String(hour).padStart(2, '0') + ':00'}</div>` +
      `<div class="h-icon">${iconFor(code, isDay)}</div>` +
      `<div class="h-temp">${temp}°</div>`;
    c.appendChild(div);
  }
}

function renderDaily(data) {
  const list = $('daily');
  list.innerHTML = '';
  const daily = data.daily;
  const t0 = daily.time[0];

  for (let i = 0; i < daily.time.length; i++) {
    const t = daily.time[i];
    const code = daily.weather_code[i];
    const hi = Math.round(daily.temperature_2m_max[i]);
    const lo = Math.round(daily.temperature_2m_min[i]);
    const info = weatherInfo(code);

    const li = document.createElement('li');
    li.className = 'day';
    li.innerHTML =
      `<span class="d-name">${weekdayName(t, t0)}</span>` +
      `<span class="d-icon">${info.icon}</span>` +
      `<span class="d-temp"><span class="d-hi">${hi}°</span><span class="d-lo">${lo}°</span></span>`;
    list.appendChild(li);
  }
}

async function loadCity(city) {
  state.city = city;
  $('cityLabel').textContent = city.name;
  setLoading(true);

  try {
    const data = await fetchWeather(city.lat, city.lon);
    state.weather = data;
    state.timezone = data.timezone;

    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    refreshBackground();

    // 本地时间每 30 秒刷新
    clearInterval(state.localTimer);
    state.localTimer = setInterval(() => {
      if (state.timezone) $('localTime').textContent = getLocalHM(state.timezone);
    }, 30000);

    localStorage.setItem('weather_city', JSON.stringify(city));
  } catch (err) {
    console.error(err);
    toast('天气加载失败，请检查网络');
  } finally {
    setLoading(false);
  }
}


/* ============================================================
   8. 城市面板
   ============================================================ */

function searchCities(q) {
  q = q.trim();
  if (!q) return [];
  const out = [];
  for (const [prov, cities] of Object.entries(PROVINCES)) {
    for (const [name, lat, lon] of cities) {
      if (name.includes(q) || prov.includes(q)) {
        out.push({ name, lat, lon, province: prov });
      }
    }
  }
  return out;
}

function makeCityBtn(city) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'city-item';
  btn.textContent = city.name;
  if (state.city && state.city.name === city.name) btn.classList.add('active');
  btn.addEventListener('click', () => {
    clearEgg();
    closePanel();
    loadCity(city);
  });
  return btn;
}

function renderCityPanel(query = '') {
  const body = $('cityBody');
  body.innerHTML = '';

  if (query.trim()) {
    const results = searchCities(query);
    if (!results.length) {
      body.innerHTML = '<div class="empty-tip">没有找到这座城市</div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'city-grid';
    results.slice(0, 80).forEach(c => grid.appendChild(makeCityBtn(c)));
    body.appendChild(grid);
    return;
  }

  for (const [prov, cities] of Object.entries(PROVINCES)) {
    const title = document.createElement('div');
    title.className = 'province-title';
    title.textContent = prov;
    body.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'city-grid';
    cities.forEach(([name, lat, lon]) => {
      grid.appendChild(makeCityBtn({ name, lat, lon, province: prov }));
    });
    body.appendChild(grid);
  }
}


/* ============================================================
   9. 彩蛋系统
   ============================================================ */

function clearEgg() {
  state.eggMode = null;
  state.forcedWeather = null;
  EGG_CLASSES.forEach(c => document.body.classList.remove(c));
  refreshBackground();
}

function setEgg(mode) {
  EGG_CLASSES.forEach(c => document.body.classList.remove(c));
  if (mode) document.body.classList.add('egg-' + mode);
  state.eggMode = mode;
}

function tryEggCity(q) {
  const key = Object.keys(EGG_CITIES).find(k => q === k || k.includes(q));
  if (!key) return false;

  const egg = EGG_CITIES[key];
  setEgg(egg.theme);

  state.city = { name: key, lat: egg.lat, lon: egg.lon };
  $('cityLabel').textContent = key;
  $('temp').textContent = egg.temp;
  $('cond').textContent = egg.cond;
  $('feels').textContent = egg.meta[0];
  $('humidity').textContent = egg.meta[1];
  $('wind').textContent = egg.meta[2];
  $('sunrise').textContent = '--:--';
  $('sunset').textContent = '--:--';
  $('hourly').innerHTML = '';
  $('daily').innerHTML = '';

  closePanel();
  toast(`你发现了 ${key}`);
  return true;
}

function tryForcedWeather(q) {
  if (q === '下雨' || q === '下雪') {
    const w = q === '下雨' ? 'rain' : 'snow';
    state.forcedWeather = w;
    document.body.dataset.weather = w;
    updateParticles(w, document.body.dataset.period || getPeriod(new Date().getHours()));
    closePanel();
    toast(w === 'rain' ? '天空开始落雨' : '雪花飘落下来');
    return true;
  }
  return false;
}

function onWASD(key) {
  state.wasdBuffer += key;
  if (state.wasdBuffer.length > 4) state.wasdBuffer = state.wasdBuffer.slice(-4);

  clearTimeout(state.wasdTimer);
  state.wasdTimer = setTimeout(() => { state.wasdBuffer = ''; }, 2000);

  if (state.wasdBuffer === 'wasd') {
    state.wasdBuffer = '';
    if (state.eggMode === 'rainbow') {
      setEgg(null);
      toast('星空隐去');
    } else {
      setEgg('rainbow');
      toast('★ 星空彩虹模式 ★');
    }
  }
}

function onTempClick() {
  state.tempClicks++;
  clearTimeout(state.tempTimer);
  state.tempTimer = setTimeout(() => { state.tempClicks = 0; }, 1500);

  if (state.tempClicks >= 7) {
    state.tempClicks = 0;
    burstParticles();
    toast('天气爆发！');
  }
}

function checkMoonEgg() {
  const h = new Date().getHours();
  if (h < 0 || h >= 4) return;
  const el = $('moonWhisper');
  el.textContent = MOON_WHISPERS[Math.floor(Math.random() * MOON_WHISPERS.length)];
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 900);
  }, 6000);
}

function startTimeWarp() {
  if (state.timeWarp) return;
  document.body.classList.add('time-warp');
  state.timeWarp = { start: performance.now(), raf: 0 };

  const tick = (now) => {
    if (!state.timeWarp) return;
    const elapsed = (now - state.timeWarp.start) / 1000;
    const hour = (elapsed * 3) % 24;
    const period = getPeriod(hour);
    const cfg = PERIODS[period];
    const grad = `linear-gradient(180deg, ${cfg.from} 0%, ${cfg.mid} 55%, ${cfg.to} 100%)`;
    const visible = currentLayer === 'A' ? $('bgA') : $('bgB');
    visible.style.background = grad;
    document.body.dataset.period = period;
    state.timeWarp.raf = requestAnimationFrame(tick);
  };
  state.timeWarp.raf = requestAnimationFrame(tick);

  toast('预览一整天的天色 · 松手返回');
}

function endTimeWarp() {
  if (!state.timeWarp) return;
  cancelAnimationFrame(state.timeWarp.raf);
  state.timeWarp = null;
  document.body.classList.remove('time-warp');
  // 恢复可见层
  const cfg = PERIODS[document.body.dataset.period] || PERIODS.night;
  const visible = currentLayer === 'A' ? $('bgA') : $('bgB');
  visible.style.background = `linear-gradient(180deg, ${cfg.from} 0%, ${cfg.mid} 55%, ${cfg.to} 100%)`;
  refreshBackground();
}


/* ============================================================
   10. 事件绑定与初始化
   ============================================================ */

function setupEvents() {
  // 城市面板
  $('cityTrigger').addEventListener('click', openPanel);
  $('cityClose').addEventListener('click', closePanel);
  $('cityPanel').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-panel')) closePanel();
  });

  // 搜索
  $('citySearch').addEventListener('input', (e) => {
    const q = e.target.value;
    if (!q.trim()) { renderCityPanel(''); return; }
    renderCityPanel(q);
  });
  $('citySearch').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim();
    if (!q) return;
    if (tryEggCity(q)) return;
    if (tryForcedWeather(q)) return;
    const r = searchCities(q);
    if (r.length) {
      clearEgg();
      closePanel();
      loadCity(r[0]);
    } else {
      toast('没有找到这座城市');
    }
  });

  // 定位
  $('locateBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('浏览器不支持定位'); return; }
    const btn = $('locateBtn');
    btn.classList.add('spin');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.classList.remove('spin');
        clearEgg();
        const { latitude: lat, longitude: lon } = pos.coords;
        const city = { name: '我的位置', lat, lon, province: '' };
        loadCity(city);
      },
      () => {
        btn.classList.remove('spin');
        toast('定位失败，请手动选择城市');
      },
      { timeout: 8000 }
    );
  });

  // 温度连点
  $('temp').addEventListener('click', onTempClick);

  // 隐藏提示入口
  $('hintTrigger').addEventListener('click', () => {
    openModal('hintModal');
    if (!state.hintFound) {
      state.hintFound = true;
      localStorage.setItem('hint_found', '1');
      $('hintTrigger').classList.add('found');
    }
  });
  $('hintClose').addEventListener('click', () => closeModal('hintModal'));
  $('hintModal').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close-modal')) closeModal('hintModal');
  });

  // WASD
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      onWASD(k);
    }
    if (e.key === 'Escape') {
      closePanel();
      closeModal('hintModal');
    }
  });

  // 长按背景触发时间加速
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, input, textarea, .panel, .modal, .hourly')) return;
    state.pressActive = true;
    clearTimeout(state.pressTimer);
    state.pressTimer = setTimeout(() => {
      if (state.pressActive) startTimeWarp();
    }, 1500);
  });
  ['pointerup', 'pointercancel'].forEach(ev => {
    document.addEventListener(ev, () => {
      state.pressActive = false;
      clearTimeout(state.pressTimer);
      endTimeWarp();
    });
  });

  // 页面可见性变化时刷新背景
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshBackground();
  });
}

async function init() {
  setupEvents();

  // 恢复彩蛋提示状态
  if (localStorage.getItem('hint_found') === '1') {
    state.hintFound = true;
    $('hintTrigger').classList.add('found');
  }

  // 恢复上次城市
  let city = null;
  try {
    const saved = localStorage.getItem('weather_city');
    if (saved) city = JSON.parse(saved);
  } catch {}
  if (!city) city = { name: '北京', lat: 39.90, lon: 116.40, province: '北京' };

  // 先铺背景，避免闪烁
  applyBackground(getPeriod(new Date().getHours()), true);

  await loadCity(city);

  // 每分钟刷新一次背景（时段会推移）
  setInterval(refreshBackground, 60000);

  // 午夜彩蛋
  checkMoonEgg();
}

document.addEventListener('DOMContentLoaded', init);

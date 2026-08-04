/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * =============================================================================
 *  WEATHER DASHBOARD SUITELET  —  enhanced build
 * =============================================================================
 *
 *  SETUP CHECKLIST (do this before deploying):
 *  --------------------------------------------------------------------------
 *  1. OpenWeatherMap
 *       - Sign up at openweathermap.org, grab a free API key.
 *       - Paste it into OWM_API_KEY below (or, better, store it in an NetSuite
 *         script parameter / secret so it isn't hard-coded in source).
 *
 *  2. Custom Record Type — "Weather Search Log"
 *       Internal ID:  customrecord_weather_search_log
 *       Fields:
 *         custrecord_wsl_city        (Free-Text)   City name searched
 *         custrecord_wsl_country     (Free-Text)   Country code
 *         custrecord_wsl_lat         (Free-Text)   Latitude
 *         custrecord_wsl_lon         (Free-Text)   Longitude
 *         custrecord_wsl_temp        (Free-Text)   Temp at time of search (°C)
 *         custrecord_wsl_searched_on (Date/Time)   Timestamp
 *       This is used to remember which cities a user has searched, so the
 *       dashboard can rebuild the multi-city grid across sessions/users.
 *
 *  3. Google Maps
 *       No API key is required for this build — it uses the no-key Google
 *       Maps "embed" iframe (https://www.google.com/maps?q=...&output=embed).
 *       If you have a Maps JavaScript API key and want the interactive JS
 *       map instead, drop it into GOOGLE_MAPS_KEY and see the commented
 *       alternative in renderMap().
 *
 *  4. Deploy this Suitelet, note the deployment URL, and open it in browser.
 * =============================================================================
 */

define(['N/ui/serverWidget', 'N/https', 'N/record', 'N/search', 'N/log', 'N/url', 'N/runtime'], (
    serverWidget,
    https,
    record,
    search,
    log,
    url,
    runtime
) => {

    // ---- Configuration -----------------------------------------------------
    const OWM_API_KEY = '416aa6ce5a8f27689b2c883da9adef61';
    const GOOGLE_MAPS_KEY = ''; // optional, only needed for the JS-map alternative
    const WEATHER_LOG_RECORD = 'customrecord_weather_search_log';

    // =========================================================================
    //  onRequest — routes both the page render and the AJAX/API calls
    // =========================================================================
    const onRequest = (context) => {
        const request = context.request;
        const response = context.response;
        const action = request.parameters.action;

        try {
            if (action === 'getWeather') {
                return handleGetWeather(request, response);
            }
            if (action === 'getForecast') {
                return handleGetForecast(request, response);
            }
            if (action === 'logCity') {
                return handleLogCity(request, response);
            }
            if (action === 'getSavedCities') {
                return handleGetSavedCities(request, response);
            }
        } catch (e) {
            log.error('Suitelet action error', e);
            response.setHeader({ name: 'Content-Type', value: 'application/json' });
            response.write(JSON.stringify({ error: true, message: e.message }));
            return;
        }

        renderPage(context);
    };

    // =========================================================================
    //  API: current weather (by city name OR lat/lon)
    // =========================================================================
    const handleGetWeather = (request, response) => {
        const params = buildLocationQuery(request);
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${OWM_API_KEY}&units=metric`;

        const apiResponse = https.get({ url: apiUrl });

        response.setHeader({ name: 'Content-Type', value: 'application/json' });
        response.write(apiResponse.body);
    };

    // =========================================================================
    //  API: 5-day / 3-hour forecast, pre-aggregated into one entry per day
    // =========================================================================
    const handleGetForecast = (request, response) => {
        const params = buildLocationQuery(request);
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?${params}&appid=${OWM_API_KEY}&units=metric`;

        const apiResponse = https.get({ url: apiUrl });
        const raw = JSON.parse(apiResponse.body);

        response.setHeader({ name: 'Content-Type', value: 'application/json' });

        if (!raw.list) {
            response.write(apiResponse.body); // forward the error payload as-is
            return;
        }

        // Group OpenWeather's 3-hour slots into calendar days, and pick the
        // slot closest to midday as representative of that day.
        const byDay = {};
        raw.list.forEach((slot) => {
            const day = slot.dt_txt.split(' ')[0];
            const hour = Number(slot.dt_txt.split(' ')[1].split(':')[0]);
            if (!byDay[day] || Math.abs(hour - 12) < Math.abs(byDay[day]._hour - 12)) {
                byDay[day] = Object.assign({}, slot, { _hour: hour });
            }
        });

        const days = Object.keys(byDay).slice(0, 5).map((day) => {
            const slot = byDay[day];
            return {
                date: day,
                temp: Math.round(slot.main.temp),
                temp_min: Math.round(slot.main.temp_min),
                temp_max: Math.round(slot.main.temp_max),
                humidity: slot.main.humidity,
                icon: slot.weather[0].icon,
                description: slot.weather[0].description,
                wind: slot.wind.speed
            };
        });

        response.write(JSON.stringify({ city: raw.city, days }));
    };

    // =========================================================================
    //  API: log a searched city to the custom record (search history)
    // =========================================================================
    const handleLogCity = (request, response) => {
        const body = JSON.parse(request.body || '{}');

        const rec = record.create({ type: WEATHER_LOG_RECORD, isDynamic: true });
        rec.setValue({ fieldId: 'custrecord_wsl_city', value: body.city || '' });
        rec.setValue({ fieldId: 'custrecord_wsl_country', value: body.country || '' });
        rec.setValue({ fieldId: 'custrecord_wsl_lat', value: String(body.lat || '') });
        rec.setValue({ fieldId: 'custrecord_wsl_lon', value: String(body.lon || '') });
        rec.setValue({ fieldId: 'custrecord_wsl_temp', value: String(body.temp || '') });
        rec.setValue({ fieldId: 'custrecord_wsl_searched_on', value: new Date() });
        const id = rec.save();

        response.setHeader({ name: 'Content-Type', value: 'application/json' });
        response.write(JSON.stringify({ success: true, id }));
    };

    // =========================================================================
    //  API: return the distinct list of recently searched cities (for the grid)
    // =========================================================================
    const handleGetSavedCities = (request, response) => {
        const results = [];

        search.create({
            type: WEATHER_LOG_RECORD,
            columns: [
                search.createColumn({ name: 'custrecord_wsl_city' }),
                search.createColumn({ name: 'custrecord_wsl_country' }),
                search.createColumn({ name: 'custrecord_wsl_lat' }),
                search.createColumn({ name: 'custrecord_wsl_lon' }),
                search.createColumn({ name: 'custrecord_wsl_searched_on', sort: search.Sort.DESC })
            ]
        }).run().each((res) => {
            results.push({
                city: res.getValue('custrecord_wsl_city'),
                country: res.getValue('custrecord_wsl_country'),
                lat: res.getValue('custrecord_wsl_lat'),
                lon: res.getValue('custrecord_wsl_lon')
            });
            return results.length < 50;
        });

        // de-dupe, most-recent first
        const seen = new Set();
        const distinct = results.filter((r) => {
            const key = r.city.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        response.setHeader({ name: 'Content-Type', value: 'application/json' });
        response.write(JSON.stringify(distinct));
    };

    // -------------------------------------------------------------------------
    const buildLocationQuery = (request) => {
        const lat = request.parameters.lat;
        const lon = request.parameters.lon;
        if (lat && lon) {
            return `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
        }
        const city = request.parameters.city || 'Pune';
        return `q=${encodeURIComponent(city)}`;
    };

    // =========================================================================
    //  Page render
    // =========================================================================
    const renderPage = (context) => {
        const form = serverWidget.createForm({ title: 'Weather Dashboard' });

        const htmlField = form.addField({
            id: 'custpage_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'HTML'
        });

        htmlField.defaultValue = getPageHtml(context.request);

        context.response.writePage(form);
    };

    // =========================================================================
    //  The page itself
    // =========================================================================
    const getPageHtml = (request) => {
        // Built via N/url so it reliably includes ?script=...&deploy=...
        // request.url alone is not guaranteed to include those params, which
        // would break every client-side `${SUITELET_URL}&action=...` call.
        const suiteletUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            returnExternalUrl: false
        });

        return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weather Dashboard</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

<style>
:root{
    --sky-top:#12213B;
    --sky-bottom:#1F3A5F;
    --panel:#0F1B30cc;
    --panel-solid:#152A47;
    --card:#0E1C31;
    --card-border:#25406633;
    --text-main:#EAF0FA;
    --text-dim:#9FB0C9;
    --accent-amber:#F5A623;
    --accent-teal:#3FA7A0;
    --accent-blue:#5B8DEF;
    --radius:16px;
}
*{box-sizing:border-box;}
body{
    margin:0;
    font-family:'Inter',sans-serif;
    color:var(--text-main);
    background:linear-gradient(180deg,var(--sky-top) 0%,var(--sky-bottom) 100%);
    min-height:100vh;
    transition:background 1.2s ease;
    padding-bottom:60px;
}
.display{font-family:'Space Grotesk',sans-serif;}
.mono{font-family:'JetBrains Mono',monospace;}

.topbar{
    padding:28px 24px 18px;
    max-width:1180px;
    margin:0 auto;
}
.topbar h1{
    font-size:1.9rem;
    font-weight:700;
    margin:0 0 4px;
    letter-spacing:-0.02em;
}
.topbar .subtitle{color:var(--text-dim);font-size:.92rem;margin-bottom:18px;}

.search-row{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    align-items:center;
}
.search-row input{
    background:var(--panel-solid);
    border:1px solid var(--card-border);
    color:var(--text-main);
    border-radius:10px;
    padding:10px 14px;
    font-size:.95rem;
    min-width:220px;
}
.search-row input:focus{outline:none;border-color:var(--accent-teal);}
.btn-amber{
    background:var(--accent-amber);
    border:none;
    color:#1A1204;
    font-weight:600;
    border-radius:10px;
    padding:10px 18px;
}
.btn-amber:hover{filter:brightness(1.08);color:#1A1204;}
.btn-ghost{
    background:transparent;
    border:1px solid var(--card-border);
    color:var(--text-main);
    border-radius:10px;
    padding:10px 14px;
}
.btn-ghost:hover{background:var(--panel-solid);color:var(--text-main);}
#geoStatus{font-size:.8rem;color:var(--text-dim);margin-left:4px;}

.refresh-note{
    font-size:.78rem;
    color:var(--text-dim);
    margin-top:10px;
}

.grid{
    max-width:1180px;
    margin:22px auto 0;
    padding:0 24px;
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
    gap:18px;
}

.city-card{
    background:var(--card);
    border:1px solid var(--card-border);
    border-radius:var(--radius);
    padding:20px;
    position:relative;
    box-shadow:0 6px 20px rgba(0,0,0,.25);
    animation:fadeIn .4s ease;
}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

.city-card .remove-btn{
    position:absolute;top:14px;right:14px;
    background:none;border:none;color:var(--text-dim);
    font-size:1rem;cursor:pointer;line-height:1;
}
.city-card .remove-btn:hover{color:#e06c75;}

.city-head{display:flex;align-items:center;justify-content:space-between;}
.city-head h3{font-size:1.15rem;margin:0;font-weight:600;}
.city-head .country{color:var(--text-dim);font-size:.8rem;}

.weather-icon{width:64px;height:64px;}

.temp-readout{
    font-size:2.6rem;
    font-weight:700;
    letter-spacing:-0.02em;
    line-height:1;
}
.condition-text{color:var(--text-dim);text-transform:capitalize;font-size:.9rem;margin-top:2px;}

.metrics-row{
    display:flex;
    gap:14px;
    margin-top:14px;
    flex-wrap:wrap;
    font-size:.82rem;
    color:var(--text-dim);
}
.metrics-row span b{color:var(--text-main);font-weight:600;}

.sun-row{
    display:flex;
    justify-content:space-between;
    margin-top:12px;
    padding-top:12px;
    border-top:1px dashed var(--card-border);
    font-size:.8rem;
    color:var(--text-dim);
}

.sparkline{margin-top:10px;height:50px;}

.card-actions{margin-top:14px;display:flex;gap:8px;}
.card-actions button{
    flex:1;
    font-size:.78rem;
    padding:6px 8px;
    border-radius:8px;
    border:1px solid var(--card-border);
    background:var(--panel-solid);
    color:var(--text-main);
}
.card-actions button:hover{background:var(--accent-teal);color:#06201d;border-color:var(--accent-teal);}

.details{
    display:none;
    margin-top:14px;
    border-top:1px solid var(--card-border);
    padding-top:14px;
}
.details.open{display:block;}

.forecast-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;}
.forecast-day{
    background:var(--panel-solid);
    border-radius:10px;
    padding:8px 10px;
    text-align:center;
    min-width:66px;
    font-size:.76rem;
}
.forecast-day img{width:34px;height:34px;}
.forecast-day .d{color:var(--text-dim);margin-bottom:2px;}

.map-embed{
    width:100%;height:160px;border:0;border-radius:10px;margin-top:12px;
}

.empty-state{
    max-width:1180px;margin:60px auto;padding:0 24px;
    text-align:center;color:var(--text-dim);
}
.loading-pill{
    display:inline-block;padding:4px 10px;border-radius:20px;
    background:var(--panel-solid);font-size:.75rem;color:var(--accent-teal);
}
</style>
</head>
<body>

<div class="topbar">
    <h1 class="display">🌤️ Weather Dashboard</h1>
    <div class="subtitle">Track current conditions and 5-day forecasts across multiple cities — auto-refreshes every 5 minutes.</div>

    <div class="search-row">
        <input id="cityInput" placeholder="Add a city, e.g. Pune" onkeydown="if(event.key==='Enter')addCity()">
        <button class="btn-amber" onclick="addCity()">Add City</button>
        <button class="btn-ghost" onclick="useMyLocation()">📍 Use my location</button>
        <span id="geoStatus"></span>
    </div>
    <div class="refresh-note" id="refreshNote">Last refreshed: —</div>
</div>

<div class="grid" id="cityGrid"></div>
<div class="empty-state" id="emptyState" style="display:none;">No cities yet — search above or use your location to get started.</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>

<script>
const SUITELET_URL = ${JSON.stringify(suiteletUrl)};
const STORAGE_KEY = 'weatherDashboardCities';
const REFRESH_MS = 5 * 60 * 1000;

let cities = []; // [{ key, cityName, lat, lon, chart }]
const charts = {};

// ---------- persistence (client-side list of cities on the grid) ----------
function loadStoredCities(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
}
function saveStoredCities(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities.map(c => ({ cityName:c.cityName, lat:c.lat, lon:c.lon }))));
}

// ---------- init ----------
async function init(){
    cities = loadStoredCities();

    // fall back to server-side search history if nothing local yet
    if(cities.length === 0){
        try{
            const res = await fetch(SUITELET_URL + '&action=getSavedCities');
            const saved = await res.json();
            cities = saved.slice(0,6).map(s => ({ cityName:s.city, lat:s.lat, lon:s.lon }));
        }catch(e){ /* ignore */ }
    }

    if(cities.length === 0){
        cities = [{ cityName:'Pune' }];
    }

    renderGrid();
    setInterval(refreshAll, REFRESH_MS);
}

function updateSkyTheme(hour){
    const root = document.documentElement.style;
    if(hour >= 5 && hour < 8){ root.setProperty('--sky-top','#2B3A55'); root.setProperty('--sky-bottom','#F5A623'); }
    else if(hour >= 8 && hour < 17){ root.setProperty('--sky-top','#2E6FB0'); root.setProperty('--sky-bottom','#7EC8E3'); }
    else if(hour >= 17 && hour < 20){ root.setProperty('--sky-top','#3B2A5C'); root.setProperty('--sky-bottom','#E8734A'); }
    else { root.setProperty('--sky-top','#0B1220'); root.setProperty('--sky-bottom','#1F3A5F'); }
}

// ---------- geolocation ----------
function useMyLocation(){
    const statusEl = document.getElementById('geoStatus');
    if(!navigator.geolocation){
        statusEl.textContent = 'Geolocation not supported';
        return;
    }
    statusEl.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        statusEl.textContent = '';
        cities.unshift({ cityName:'My Location', lat:latitude, lon:longitude });
        saveStoredCities();
        renderGrid();
    }, (err) => {
        statusEl.textContent = 'Location denied';
    }, { timeout: 8000 });
}

// ---------- add / remove ----------
function addCity(){
    const input = document.getElementById('cityInput');
    const name = input.value.trim();
    if(!name) return;
    cities.push({ cityName:name });
    input.value = '';
    saveStoredCities();
    renderGrid();
}

function removeCity(key){
    cities = cities.filter(c => cityKey(c) !== key);
    saveStoredCities();
    renderGrid();
}

function cityKey(c){ return c.lat && c.lon ? \`\${c.lat},\${c.lon}\` : c.cityName; }

// ---------- fetch helpers ----------
function locationParams(c){
    return c.lat && c.lon
        ? \`lat=\${encodeURIComponent(c.lat)}&lon=\${encodeURIComponent(c.lon)}\`
        : \`city=\${encodeURIComponent(c.cityName)}\`;
}

async function fetchWeather(c){
    const res = await fetch(\`\${SUITELET_URL}&action=getWeather&\${locationParams(c)}\`);
    return res.json();
}
async function fetchForecast(c){
    const res = await fetch(\`\${SUITELET_URL}&action=getForecast&\${locationParams(c)}\`);
    return res.json();
}
function logCity(data){
    fetch(\`\${SUITELET_URL}&action=logCity\`, {
        method:'POST',
        body: JSON.stringify({
            city: data.name, country: data.sys && data.sys.country,
            lat: data.coord && data.coord.lat, lon: data.coord && data.coord.lon,
            temp: data.main && data.main.temp
        })
    }).catch(()=>{});
}

function fmtTime(unix, tzOffsetSec){
    const d = new Date((unix + (tzOffsetSec||0)) * 1000);
    return d.toISOString().substr(11,5);
}

// ---------- rendering ----------
function renderGrid(){
    const grid = document.getElementById('cityGrid');
    const empty = document.getElementById('emptyState');
    grid.innerHTML = '';
    empty.style.display = cities.length ? 'none' : 'block';

    cities.forEach((c) => {
        const key = cityKey(c);
        const card = document.createElement('div');
        card.className = 'city-card';
        card.id = 'card-' + safeId(key);
        card.innerHTML = \`
            <button class="remove-btn" title="Remove" onclick="removeCity('\${key}')">✕</button>
            <div class="loading-pill">Loading…</div>
        \`;
        grid.appendChild(card);
        loadCity(c, card);
    });

    document.getElementById('refreshNote').textContent = 'Last refreshed: ' + new Date().toLocaleTimeString();
}

function safeId(key){ return key.replace(/[^a-z0-9]/gi,'_'); }

async function loadCity(c, card){
    try{
        const data = await fetchWeather(c);
        if(data.cod && data.cod !== 200){
            card.innerHTML = \`<button class="remove-btn" onclick="removeCity('\${cityKey(c)}')">✕</button>
                <div class="text-danger small">Could not find "\${c.cityName || 'this location'}"</div>\`;
            return;
        }

        // keep precise lat/lon so future refreshes are exact
        c.lat = data.coord.lat; c.lon = data.coord.lon; c.cityName = data.name;
        saveStoredCities();
        logCity(data);

        if(cities.indexOf(c) === 0) updateSkyTheme(new Date((data.dt + data.timezone) * 1000).getUTCHours());

        const icon = data.weather[0].icon;
        const key = cityKey(c);

        card.innerHTML = \`
            <button class="remove-btn" title="Remove" onclick="removeCity('\${key}')">✕</button>
            <div class="city-head">
                <div>
                    <h3>\${data.name}</h3>
                    <div class="country">\${data.sys.country || ''}</div>
                </div>
                <img class="weather-icon" src="https://openweathermap.org/img/wn/\${icon}@2x.png" alt="\${data.weather[0].description}">
            </div>

            <div class="temp-readout mono">\${Math.round(data.main.temp)}°C</div>
            <div class="condition-text">\${data.weather[0].description}</div>

            <div class="metrics-row">
                <span>💧 <b>\${data.main.humidity}%</b></span>
                <span>💨 <b>\${data.wind.speed} m/s</b></span>
                <span>🌡️ feels <b>\${Math.round(data.main.feels_like)}°</b></span>
            </div>

            <div class="sun-row">
                <span>🌅 \${fmtTime(data.sys.sunrise, data.timezone)}</span>
                <span>🌇 \${fmtTime(data.sys.sunset, data.timezone)}</span>
            </div>

            <div class="sparkline"><canvas id="chart-\${safeId(key)}"></canvas></div>

            <div class="card-actions">
                <button onclick="toggleDetails('\${safeId(key)}')">5-Day Forecast</button>
                <button onclick="toggleMap('\${safeId(key)}', \${data.coord.lat}, \${data.coord.lon})">Map</button>
            </div>

            <div class="details" id="details-\${safeId(key)}"></div>
        \`;

        loadForecast(c, safeId(key));

    }catch(e){
        card.innerHTML = '<div class="text-danger small">Error loading weather.</div>';
    }
}

async function loadForecast(c, id){
    try{
        const data = await fetchForecast(c);
        if(!data.days) return;

        // sparkline of the 5-day temps, drawn immediately (chart stays hidden inside a small canvas under the current temp)
        const ctxEl = document.getElementById('chart-' + id);
        if(ctxEl){
            if(charts[id]) charts[id].destroy();
            charts[id] = new Chart(ctxEl, {
                type:'line',
                data:{
                    labels: data.days.map(d => d.date.slice(5)),
                    datasets:[{
                        data: data.days.map(d => d.temp),
                        borderColor:'#5B8DEF',
                        backgroundColor:'rgba(91,141,239,.15)',
                        tension:.35, fill:true, pointRadius:0, borderWidth:2
                    }]
                },
                options:{
                    responsive:true, maintainAspectRatio:false,
                    plugins:{legend:{display:false}},
                    scales:{ x:{display:false}, y:{display:false} }
                }
            });
        }

        // store forecast HTML for the toggle-able details panel
        const detailsEl = document.getElementById('details-' + id);
        if(detailsEl){
            detailsEl.dataset.forecast = \`
                <div class="forecast-row">
                    \${data.days.map(d => \`
                        <div class="forecast-day">
                            <div class="d">\${new Date(d.date).toLocaleDateString(undefined,{weekday:'short'})}</div>
                            <img src="https://openweathermap.org/img/wn/\${d.icon}.png" alt="">
                            <div><b>\${d.temp_max}°</b>/\${d.temp_min}°</div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
    }catch(e){ /* non-fatal */ }
}

function toggleDetails(id){
    const el = document.getElementById('details-' + id);
    if(!el) return;
    const isOpen = el.classList.contains('open');
    if(isOpen){ el.classList.remove('open'); return; }
    if(el.dataset.forecast) el.innerHTML = el.dataset.forecast;
    el.classList.add('open');
}

function toggleMap(id, lat, lon){
    const el = document.getElementById('details-' + id);
    if(!el) return;
    const mapHtml = \`<iframe class="map-embed" loading="lazy"
        src="https://www.google.com/maps?q=\${lat},\${lon}&output=embed"></iframe>\`;
    if(el.classList.contains('open') && el.innerHTML.indexOf('map-embed') !== -1){
        el.classList.remove('open');
        return;
    }
    el.innerHTML = (el.dataset.forecast || '') + mapHtml;
    el.classList.add('open');
}

function refreshAll(){
    renderGrid();
}

init();
</script>
</body>
</html>
        `;
    };

    return { onRequest };
});
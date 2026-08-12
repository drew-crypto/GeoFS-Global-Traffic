// ==UserScript==
// @name         GLOBAL TRAFFIC
// @namespace    http://tampermonkey.net/
// @version      2026-07-06
// @description  try to take over the world!
// @author       You
// @match        https://www.geo-fs.com/geofs.php?v=3.9
// @match        https://beta.geo-fs.com/geofs.php?a=22
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==

(async function createTrafficManager() {
    const TAG = "GeoFS Global Traffic";
    const RENDER_DISTANCE = 30000; // 30km

    // --- LOAD SAVED CACHE VALUES ---
    let isTrafficOn = localStorage.getItem('geofs_globalTraffic_state') === 'true';
    let currentDensity = localStorage.getItem('geofs_globalTraffic_density') || 'medium';

    // --- INJECT BULLETPROOF CSS FOR RECTANGULAR BUTTON & HEADER ---
    const customStyles = document.createElement('style');
    customStyles.innerHTML = `
        /* Base Button Styles */
        .geofs-rect-btn {
            display: inline-block;
            width: 100%;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            border: 2px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
            box-sizing: border-box;
            font-family: inherit;
        }

        /* ON STATE - Yellow */
        .geofs-rect-btn.is-on {
            background-color: #FFC107 !important;
            color: #000000 !important;
            border-color: #E0A800 !important;
        }

        /* OFF STATE - Grey */
        .geofs-rect-btn.is-off {
            background-color: #9E9E9E !important;
            color: #FFFFFF !important;
            border-color: #757575 !important;
        }

        /* Discord Button Style */
        .geofs-rect-btn.discord-btn {
            background-color: #5865F2 !important;
            color: #FFFFFF !important;
            border-color: #4752C4 !important;
            margin-top: 10px;
        }
        .geofs-rect-btn.discord-btn:hover {
            background-color: #4752C4 !important;
        }

        /* YouTube Button Style (Red) */
        .geofs-rect-btn.youtube-btn {
            background-color: #FF0000 !important;
            color: #FFFFFF !important;
            border-color: #CC0000 !important;
            margin-top: 10px;
        }
        .geofs-rect-btn.youtube-btn:hover {
            background-color: #CC0000 !important;
        }

        /* GitHub Button Style (Black) */
        .geofs-rect-btn.github-btn {
            background-color: #24292e !important;
            color: #FFFFFF !important;
            border-color: #1b1f23 !important;
            margin-top: 10px;
        }
        .geofs-rect-btn.github-btn:hover {
            background-color: #1b1f23 !important;
        }

        /* Section Header Style (Grey) */
        .geofs-traffic-header {
            font-size: 13px;
            font-weight: bold;
            color: #757575;
            margin-bottom: 8px;
            text-align: left;
        }

        /* Density Button Container */
        .density-button-container {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
        }

        .density-btn {
            flex: 1;
            padding: 8px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            border: 2px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
            box-sizing: border-box;
            font-family: inherit;
            background-color: #9E9E9E !important;
            color: #FFFFFF !important;
            border-color: #757575 !important;
        }

        .density-btn.active {
            background-color: #FFC107 !important;
            color: #000000 !important;
            border-color: #E0A800 !important;
        }
    `;
    document.head.appendChild(customStyles);

    // Wait until GeoFS preferences panel, Cesium, and aircraft are loaded
    const wait = setInterval(() => {
        const geofsPreferencesPanel = document.querySelector('.geofs-list.geofs-toggle-panel.geofs-preference-list');
        if (!window.geofs || !window.Cesium || !geofs.aircraft || !geofs.aircraft.instance || !geofsPreferencesPanel) return;
        clearInterval(wait);
        initUI(geofsPreferencesPanel);
        initSpawner();
    }, 500);

    function initUI(geofsPreferencesPanel) {
        // Create the main collapsible list item for the menu
        const trafficListItem = document.createElement('li');
        trafficListItem.className = 'geofs-list-collapsible-item';
        trafficListItem.innerText = 'Global Traffic';

        // Create the container for what goes inside
        const trafficContent = document.createElement('div');
        trafficContent.className = 'geofs-list';
        trafficContent.style.display = 'none';

        // Determine initial button classes based on cached state
        const btnClass = isTrafficOn ? 'is-on' : 'is-off';
        const btnText = isTrafficOn ? 'Set Global Traffic: ON' : 'Set Global Traffic: OFF';

        // Inject elements using cached values for the density buttons
        trafficContent.innerHTML = `
            <li class="geofs-list-item" style="padding: 10px 15px; display: block;">
                <div class="geofs-traffic-header">Traffic</div>

                <fieldset style="border: none; padding: 0; margin: 0 0 15px 0;">
                    <button id="globalTrafficButton" class="geofs-rect-btn ${btnClass}" title="Toggle Global Traffic">
                        ${btnText}
                    </button>
                </fieldset>

                <fieldset style="border: none; padding: 0; margin: 0;">
                    <legend style="display: none;">Traffic Density</legend>
                    <div class="density-button-container">
                        <button class="density-btn ${currentDensity === 'low' ? 'active' : ''}" data-density="low" title="Low Traffic Density (33%)">Low</button>
                        <button class="density-btn ${currentDensity === 'medium' ? 'active' : ''}" data-density="medium" title="Medium Traffic Density (66%)">Medium</button>
                        <button class="density-btn ${currentDensity === 'high' ? 'active' : ''}" data-density="high" title="High Traffic Density (100%)">High</button>
                    </div>
                </fieldset>

                <fieldset style="border: none; padding: 0; margin: 10px 0 0 0;">
                    <button id="discordServerButton" class="geofs-rect-btn discord-btn" title="Join the Global Traffic Discord Server">
                        Join our Discord Server
                    </button>
                </fieldset>
                
                <fieldset style="border: none; padding: 0; margin: 10px 0 0 0;">
                    <button id="youtubeLinkButton" class="geofs-rect-btn youtube-btn" title="Check out our YouTube Channel">
                        YouTube Channel
                    </button>
                </fieldset>
                
                <fieldset style="border: none; padding: 0; margin: 10px 0 0 0;">
                    <button id="githubLinkButton" class="geofs-rect-btn github-btn" title="View the Source Code on GitHub">
                        GitHub Repository
                    </button>
                </fieldset>
            </li>
        `;

        trafficListItem.appendChild(trafficContent);

        // Toggle logic for the Global Traffic menu item (manages display & triangle state)
        trafficListItem.onclick = (e) => {
            if (e.target.closest('.geofs-list') === trafficContent) return;

            const isVisible = trafficContent.style.display === 'block';
            if (isVisible) {
                trafficContent.style.display = 'none';
                trafficListItem.classList.remove('geofs-open');
            } else {
                trafficContent.style.display = 'block';
                trafficListItem.classList.add('geofs-open');
            }
        };

        // Listen for clicks across the preferences panel to auto-close Global Traffic when another option is clicked
        geofsPreferencesPanel.addEventListener('click', (e) => {
            const clickedItem = e.target.closest('.geofs-list-collapsible-item');
            if (clickedItem && clickedItem !== trafficListItem) {
                trafficContent.style.display = 'none';
                trafficListItem.classList.remove('geofs-open');
            }
        });

        // Inject it into the GeoFS options panel
        geofsPreferencesPanel.appendChild(trafficListItem);

        // --- BUTTON TOGGLE & CACHE LOGIC ---
        const trafficBtn = document.getElementById('globalTrafficButton');

        trafficBtn.addEventListener('click', () => {
            isTrafficOn = !isTrafficOn;

            // Save state to cache
            localStorage.setItem('geofs_globalTraffic_state', isTrafficOn);

            if (isTrafficOn) {
                trafficBtn.classList.remove('is-off');
                trafficBtn.classList.add('is-on');
                trafficBtn.innerText = 'Set Global Traffic: ON';
                console.log(TAG, "Global Traffic turned ON");
            } else {
                trafficBtn.classList.remove('is-on');
                trafficBtn.classList.add('is-off');
                trafficBtn.innerText = 'Set Global Traffic: OFF';
                console.log(TAG, "Global Traffic turned OFF");
            }
        });

        // --- DENSITY BUTTON LOGIC ---
        const densityButtons = trafficContent.querySelectorAll('.density-btn');
        densityButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedDensity = btn.dataset.density;

                // Remove active class from all buttons
                densityButtons.forEach(b => b.classList.remove('active'));

                // Add active class to clicked button
                btn.classList.add('active');

                // Update current density and save to cache
                currentDensity = selectedDensity;
                localStorage.setItem('geofs_globalTraffic_density', currentDensity);

                const densityMap = { low: '33%', medium: '66%', high: '100%' };
                console.log(TAG, `Traffic Density Updated: ${currentDensity} (${densityMap[currentDensity]})`);
            });
        });

        // --- DISCORD BUTTON LOGIC ---
        const discordBtn = document.getElementById('discordServerButton');
        if (discordBtn) {
            discordBtn.addEventListener('click', () => {
                window.open('https://discord.gg/JaYzdtHwEs', '_blank');
                console.log(TAG, "Opened Discord Invite Link");
            });
        }

        // --- YOUTUBE BUTTON LOGIC ---
        const ytBtn = document.getElementById('youtubeLinkButton');
        if (ytBtn) {
            ytBtn.addEventListener('click', () => {
                window.open('https://www.youtube.com/channel/UCOH4Fa2Oz1zgb6sFaHrJEzQ', '_blank');
                console.log(TAG, "Opened YouTube Link");
            });
        }

        // --- GITHUB BUTTON LOGIC ---
        const githubBtn = document.getElementById('githubLinkButton');
        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                window.open('https://github.com/drew-crypto/GeoFS-Global-Traffic/tree/main', '_blank');
                console.log(TAG, "Opened GitHub Link");
            });
        }
    }
    
    // Don't forget your initSpawner function down here when you implement the rest!
    function initSpawner() {
        // Spawner logic here
    }

    async function initSpawner() {
        const viewer = geofs.api.viewer;

        // 1. LIST OF MODELS WITH FULL DIRECT URLS
        const planes = [{
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   33.946044, visualLon: -118.407876,
        alt:         22,        visualAlt: 22,
        heading:     2,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   33.946934, visualLon: -118.406824,
        alt:         22,        visualAlt: 22,
        heading:     142,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   33.939888, visualLon: -118.406771,
        alt:         22,        visualAlt: 22,
        heading:     218,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   33.940321, visualLon: -118.406250,
        alt:         22,        visualAlt: 22,
        heading:     177,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   33.939801, visualLon: -118.407323,
        alt:         22,        visualAlt: 22,
        heading:     290,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   33.946952, visualLon: -118.407436,
        alt:         22,        visualAlt: 22,
        heading:     103,
        scale:       1
    },
    {
        name:        "KLAX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   33.941852, visualLon: -118.402656,
        alt:         22,        visualAlt: 22,
        heading:     354,
        scale:       1
    },
    // Alaska
    {
        name:        "KLAX Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737.glb",
        visualLat:   33.940061, visualLon: -118.413958,
        alt:         22,        visualAlt: 22,
        heading:     171,
        scale:       1
    },
    {
        name:        "KLAX Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   33.943288, visualLon: -118.414366,
        alt:         22,        visualAlt: 22,
        heading:     200,
        scale:       1
    },
    // United
    {
        name:        "KLAX United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   33.942088, visualLon: -118.400113,
        alt:         22,        visualAlt: 22,
        heading:     319,
        scale:       1
    },
    {
        name:        "KLAX United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   33.940451, visualLon: -118.399695,
        alt:         21.8,        visualAlt: 21.8,
        heading:     330,
        scale:       1
    },
    {
        name:        "KLAX United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   33.941838, visualLon: -118.399309,
        alt:         21.8,        visualAlt: 21.8,
        heading:     180,
        scale:       1
    },
    {
        name:        "KLAX United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   33.941127, visualLon: -118.39917,
        alt:         21.8,        visualAlt: 21.8,
        heading:     230,
        scale:       1
    },
    // Southwest
    {
        name:        "KLAX Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   33.947762, visualLon: -118.401326,
        alt:         21.93,        visualAlt: 21.93,
        heading:     105,
        scale:       1
    },
    {
        name:        "KLAX Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   33.947299, visualLon: -118.400859,
        alt:         21.93,        visualAlt: 21.93,
        heading:     177,
        scale:       1
    },
    {
        name:        "KLAX Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   33.946578, visualLon: -118.400778,
        alt:         21.93,        visualAlt: 21.93,
        heading:     185,
        scale:       1
    },
    {
    name:        "KLAX Jetblue 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
    visualLat:   33.947471, visualLon: -118.401745,
    alt:         21.93,     visualAlt: 21.93,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Frontier",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-20@main/models/Frontier%20A320.glb",
    visualLat:   33.946724, visualLon: -118.401691,
    alt:         21.93,     visualAlt: 21.93,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Hawaiian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   33.946261, visualLon: -118.403510,
    alt:         21.93,     visualAlt: 21.93,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   33.946728, visualLon: -118.403443,
    alt:         21.93,     visualAlt: 21.93,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   33.946412, visualLon: -118.404687,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Austrian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
    visualLat:   33.947318, visualLon: -118.404213,
    alt:         22,        visualAlt: 22,
    heading:     60,
    scale:       1
},
{
    name:        "KLAX Ita Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
    visualLat:   33.945989, visualLon: -118.406726,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Virgin Atlantic",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
    visualLat:   33.940947, visualLon: -118.401466,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   33.940084, visualLon: -118.401874,
    alt:         21.8,      visualAlt: 21.8,
    heading:     240,
    scale:       1
},
{
    name:        "KLAX Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   33.940831, visualLon: -118.402389,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   33.942529, visualLon: -118.410842,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   33.940760, visualLon: -118.406369,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
    visualLat:   33.941622, visualLon: -118.406562,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Aeromexico",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
    visualLat:   33.941071, visualLon: -118.407152,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Volaris",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
    visualLat:   33.939737, visualLon: -118.409526,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
    visualLat:   33.941048, visualLon: -118.409735,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       0.33
},
{
    name:        "KLAX Westjet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   33.945103, visualLon: -118.415017,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Westjet 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   33.944214, visualLon: -118.415499,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   33.940350, visualLon: -118.410406,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   33.941212, visualLon: -118.410561,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   33.944965, visualLon: -118.410352,
    alt:         22,        visualAlt: 22,
    heading:     150,
    scale:       1
},
{
    name:        "KLAX Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   33.944159, visualLon: -118.411025,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
{
    name:        "KLAX Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   33.945202, visualLon: -118.411251,
    alt:         22,        visualAlt: 22,
    heading:     330,
    scale:       1
},
    // === KBOS === (Elevation: 1.5m)
    // American Airlines
    {
        name:        "KBOS American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   42.362168, visualLon: -71.020854,
        alt:         1.5,       visualAlt: 1.5,
        heading:     70,
        scale:       1
    },
    {
        name:        "KBOS American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   42.361902, visualLon: -71.021697,
        alt:         1.5,       visualAlt: 1.5,
        heading:     40,
        scale:       1
    },
    {
        name:        "KBOS American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   42.361352, visualLon: -71.021149,
        alt:         1.5,       visualAlt: 1.5,
        heading:     285,
        scale:       1
    },
    {
        name:        "KBOS American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   42.360077, visualLon: -71.017233,
        alt:         1.5,       visualAlt: 1.5,
        heading:     225,
        scale:       1
    },
    // United
    {
        name:        "KBOS United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   42.361886, visualLon: -71.016277,
        alt:         1.65,       visualAlt: 1.65,
        heading:     153,
        scale:       1
    },
    {
        name:        "KBOS United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   42.363019, visualLon: -71.016626,
        alt:         1.7,       visualAlt: 1.7,
        heading:     267,
        scale:       1
    },
    // Air Canada
    {
        name:        "KBOS Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   42.360432, visualLon: -71.017024,
        alt:         1.5,       visualAlt: 1.5,
        heading:     180,
        scale:       0.33
    },
    // Jetblue
    {
        name:        "KBOS Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   42.365190, visualLon: -71.014508,
        alt:         1.65,       visualAlt: 1.65,
        heading:     227,
        scale:       1
    },
    {
        name:        "KBOS Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   42.364798, visualLon: -71.014669,
        alt:         1.65,       visualAlt: 1.65,
        heading:     250,
        scale:       1
    },
    {
        name:        "KBOS Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   42.364874, visualLon: -71.015055,
        alt:         1.65,       visualAlt: 1.65,
        heading:     290,
        scale:       1
    },
    // British Airways
    {
        name:        "KBOS British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   42.370519, visualLon: -71.022115,
        alt:         1.65,       visualAlt: 1.65,
        heading:     115,
        scale:       1
    },
    // Alaska
    {
        name:        "KBOS Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   42.370170, visualLon: -71.017523,
        alt:         1.7,       visualAlt: 1.7,
        heading:     160,
        scale:       1
    },
{
    name:        "KBOS Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   42.368651, visualLon: -71.015158,
    alt:         1.7,       visualAlt: 1.7,
    heading:     130,
    scale:       1
},
{
    name:        "KBOS KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   42.368072, visualLon: -71.014515,
    alt:         1.65,      visualAlt: 1.65,
    heading:     130,
    scale:       1
},
{
    name:        "KBOS ITA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
    visualLat:   42.367668, visualLon: -71.013892,
    alt:         1.65,      visualAlt: 1.65,
    heading:     220,
    scale:       1
},
{
    name:        "KBOS TAP",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/TAP%20A330.glb",
    visualLat:   42.368104, visualLon: -71.017841,
    alt:         1.7,       visualAlt: 1.7,
    heading:     140,
    scale:       1
},
{
    name:        "KBOS Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   42.369093, visualLon: -71.017905,
    alt:         1.7,       visualAlt: 1.7,
    heading:     190,
    scale:       1
},
{
    name:        "KBOS Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   42.371352, visualLon: -71.025040,
    alt:         1.65,      visualAlt: 1.65,
    heading:     130,
    scale:       1
},
{
    name:        "KBOS Korean",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   42.370790, visualLon: -71.024213,
    alt:         1.65,      visualAlt: 1.65,
    heading:     130,
    scale:       1
},
{
    name:        "KBOS Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   42.366186, visualLon: -71.013809,
    alt:         1.65,      visualAlt: 1.65,
    heading:     160,
    scale:       1
},
{
    name:        "KBOS Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   42.371001, visualLon: -71.019678,
    alt:         1.7,       visualAlt: 1.7,
    heading:     130,
    scale:       1
},
    // === KEWR === (Elevation: 2.2m)
    // Southwest
    {
        name:        "KEWR Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   40.683047, visualLon: -71.017523,
        alt:         2.7,       visualAlt: 2.7,
        heading:     265,
        scale:       1
    },
    {
        name:        "KEWR Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   40.683230, visualLon: -74.184611,
        alt:         2.7,       visualAlt: 2.7,
        heading:     273,
        scale:       1
    },
    {
        name:        "KEWR Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   40.683251, visualLon: -74.185641,
        alt:         2.7,       visualAlt: 2.7,
        heading:     273,
        scale:       1
    },
    // Alaska
    {
        name:        "KEWR Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737.glb",
        visualLat:   40.684308, visualLon: -74.184987,
        alt:         2.8,       visualAlt: 2.8,
        heading:     95,
        scale:       1
    },
    {
        name:        "KEWR Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   40.684247, visualLon: -74.183372,
        alt:         2.8,       visualAlt: 2.8,
        heading:     95,
        scale:       1
    },
    // Frontier
    {
        name:        "KEWR Frontier",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-20@main/models/Frontier%20A320.glb",
        visualLat:   40.682083, visualLon: -74.187604,
        alt:         2.2,       visualAlt: 2.2,
        heading:     205,
        scale:       1
    },
    {
        name:        "KEWR Frontier",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-20@main/models/Frontier%20A320.glb",
        visualLat:   40.681314, visualLon: -74.186955,
        alt:         2.2,       visualAlt: 2.2,
        heading:     180,
        scale:       1
    },
    // Jetblue
    {
        name:        "KEWR Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   40.685435, visualLon: -74.186977,
        alt:         2.2,       visualAlt: 2.2,
        heading:     180,
        scale:       1
    },
    {
        name:        "KEWR Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   40.686203, visualLon: -74.186564,
        alt:         2.2,       visualAlt: 2.2,
        heading:     132,
        scale:       1
    },
    // Iberia
    {
        name:        "KEWR Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   40.684666, visualLon: -74.187368,
        alt:         2.2,       visualAlt: 2.2,
        heading:     169,
        scale:       1
    },
    {
    name:        "KEWR United 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   40.687492, visualLon: -74.177105,
    alt:         3.6,       visualAlt: 3.6,
    heading:     300,
    scale:       1
},
{
    name:        "KEWR United 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   40.687861, visualLon: -74.176241,
    alt:         3.6,       visualAlt: 3.6,
    heading:     220,
    scale:       1
},
{
    name:        "KEWR American 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   40.688342, visualLon: -74.176590,
    alt:         3.6,       visualAlt: 3.6,
    heading:     110,
    scale:       1
},
{
    name:        "KEWR Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   40.689746, visualLon: -74.174878,
    alt:         3.6,       visualAlt: 3.6,
    heading:     220,
    scale:       1
},
{
    name:        "KEWR Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   40.691454, visualLon: -74.174642,
    alt:         3.6,       visualAlt: 3.6,
    heading:     290,
    scale:       1
},
{
    name:        "KEWR TAP",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
    visualLat:   40.691596, visualLon: -74.173698,
    alt:         3.6,       visualAlt: 3.6,
    heading:     220,
    scale:       1
},
{
    name:        "KEWR British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   40.692438, visualLon: -74.173859,
    alt:         3.6,       visualAlt: 3.6,
    heading:     150,
    scale:       1
},
{
    name:        "KEWR Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   40.694321, visualLon: -74.174610,
    alt:         3.6,       visualAlt: 3.6,
    heading:     280,
    scale:       1
},
{
    name:        "KEWR KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   40.694045, visualLon: -74.173258,
    alt:         3.6,       visualAlt: 3.6,
    heading:     315,
    scale:       1
},
{
    name:        "KEWR ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
    visualLat:   40.694410, visualLon: -74.172472,
    alt:         3.6,       visualAlt: 3.6,
    heading:     135,
    scale:       1
},
{
    name:        "KEWR Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   40.695501, visualLon: -74.172773,
    alt:         3.6,       visualAlt: 3.6,
    heading:     240,
    scale:       1
},
{
    name:        "KEWR Korean Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   40.695550, visualLon: -74.173824,
    alt:         3.6,       visualAlt: 3.6,
    heading:     60,
    scale:       1
},
{
    name:        "KEWR Asiana Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   40.695257, visualLon: -74.175326,
    alt:         3.6,       visualAlt: 3.6,
    heading:     100,
    scale:       1
},
{
    name:        "KEWR Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   40.696672, visualLon: -74.175358,
    alt:         3.6,       visualAlt: 3.6,
    heading:     230,
    scale:       1
},
{
    name:        "KEWR EVA Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   40.697785, visualLon: -74.174318,
    alt:         3.6,       visualAlt: 3.6,
    heading:     135,
    scale:       1
},
{
    name:        "KEWR EVA Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   40.697599, visualLon: -74.175605,
    alt:         3.6,       visualAlt: 3.6,
    heading:     60,
    scale:       1
},
{
    name:        "KEWR China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   40.698265, visualLon: -74.178373,
    alt:         3.6,       visualAlt: 3.6,
    heading:     220,
    scale:       1
},
{
    name:        "KEWR Phillippine Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   40.699062, visualLon: -74.178963,
    alt:         3.6,       visualAlt: 3.6,
    heading:     95,
    scale:       1
},
{
    name:        "KEWR Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   40.698346, visualLon: -74.180176,
    alt:         3.6,       visualAlt: 3.6,
    heading:     320,
    scale:       1
},
{
    name:        "KEWR Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
    visualLat:   40.697769, visualLon: -74.179832,
    alt:         3.6,       visualAlt: 3.6,
    heading:     320,
    scale:       1
},
{
    name:        "KEWR Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   40.686406, visualLon: -74.183276,
    alt:         2.8,       visualAlt: 2.8,
    heading:     75,
    scale:       1
},
{
    name:        "KEWR Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   40.685917, visualLon: -74.183373,
    alt:         2.8,       visualAlt: 2.8,
    heading:     0,
    scale:       1
},
{
    name:        "KEWR Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
    visualLat:   40.685860, visualLon: -74.182193,
    alt:         3,       visualAlt: 3,
    heading:     180,
    scale:       1
},
{
    name:        "KEWR Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
    visualLat:   40.686349, visualLon: -74.181983,
    alt:         3,       visualAlt: 3,
    heading:     160,
    scale:       0.33
},
{
    name:        "KEWR Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   40.685885, visualLon: -74.180176,
    alt:         3.6,       visualAlt: 3.6,
    heading:     305,
    scale:       1
},
{
    name:        "KEWR Aeromexico",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
    visualLat:   40.685845, visualLon: -74.179317,
    alt:         3.6,       visualAlt: 3.6,
    heading:     250,
    scale:       1
},
{
    name:        "KEWR Volaris",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
    visualLat:   40.686617, visualLon: -74.179274,
    alt:         3.6,       visualAlt: 3.6,
    heading:     135,
    scale:       1
},
    // === KORD === (Elevation: 97.7m)
    // United
    {
        name:        "KORD United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   41.979271,  visualLon: -87.909755,
        alt:         98.4,  visualAlt: 98.4,
        heading:     190,
        scale:       1
    },
    {
        name:        "KORD United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   41.980657, visualLon: -87.910215,
        alt:         98.4,  visualAlt: 98.4,
        heading:     47,
        scale:       1
    },
    {
        name:        "KORD United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   41.980844, visualLon: -87.909349,
        alt:         98.4,    visualAlt: 98.4,
        heading:     190,
        scale:       1
    },
    // Alaska
    {
        name:        "KORD Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   41.973735, visualLon: -87.905580,
        alt:         98.1,      visualAlt: 98.1,
        heading:     163,
        scale:       1
    },
    {
        name:        "KORD Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   41.973808, visualLon: -87.903677,
        alt:         98.1,      visualAlt: 98.1,
        heading:     10,
        scale:       1
    },
    {
        name:        "KORD Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   41.974766, visualLon: -87.900898,
        alt:         98.1,      visualAlt: 98.1,
        heading:     0,
        scale:       1
    },
    // Air Canada
    {
        name:        "KORD Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   41.974476, visualLon: -87.909748,
        alt:         97.95,      visualAlt: 97.95,
        heading:     10,
        scale:       0.33
    },
    // American Airlines
    {
        name:        "KORD American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   41.974954, visualLon: -87.897818,
        alt:         98.1,      visualAlt: 98.1,
        heading:     107,
        scale:       1
    },
    {
        name:        "KORD American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   41.974534, visualLon: -87.896266,
        alt:         98.1,      visualAlt: 98.1,
        heading:     107,
        scale:       1
    },
    {
        name:        "KORD American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   41.975872, visualLon: -87.900516,
        alt:         98.25,      visualAlt: 98.25,
        heading:     142,
        scale:       1
    },
    // Southwest
    {
        name:        "KORD Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   41.977068, visualLon: -87.892802,
        alt:         98,      visualAlt: 98,
        heading:     332,
        scale:       1
    },
    {
    name:        "KORD Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   41.979404, visualLon: -87.911073,
    alt:         98.4,      visualAlt: 98.4,
    heading:     50,
    scale:       1
},
{
    name:        "KORD Austrian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
    visualLat:   41.977836, visualLon: -87.910116,
    alt:         98.4,      visualAlt: 98.4,
    heading:     230,
    scale:       1
},
{
    name:        "KORD Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   41.981067, visualLon: -87.906667,
    alt:         98.4,      visualAlt: 98.4,
    heading:     5,
    scale:       1
},
{
    name:        "KORD TAP",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/TAP%20A330.glb",
    visualLat:   41.979664, visualLon: -87.907117,
    alt:         98.4,      visualAlt: 98.4,
    heading:     5,
    scale:       1
},
{
    name:        "KORD British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   41.978284, visualLon: -87.907357,
    alt:         98.4,      visualAlt: 98.4,
    heading:     5,
    scale:       1
},
{
    name:        "KORD Iberia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
    visualLat:   41.975387, visualLon: -87.906885,
    alt:         98.1,      visualAlt: 98.1,
    heading:     70,
    scale:       1
},
{
    name:        "KORD Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   41.973582, visualLon: -87.906329,
    alt:         98.1,      visualAlt: 98.1,
    heading:     345,
    scale:       1
},
{
    name:        "KORD KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   41.974678, visualLon: -87.908191,
    alt:         97.95,     visualAlt: 97.95,
    heading:     230,
    scale:       1
},
{
    name:        "KORD Norse Atlantic",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Norse%20787.glb",
    visualLat:   41.973725, visualLon: -87.900745,
    alt:         98.1,      visualAlt: 98.1,
    heading:     0,
    scale:       1
},
{
    name:        "KORD ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
    visualLat:   41.973442, visualLon: -87.900225,
    alt:         98.1,      visualAlt: 98.1,
    heading:     180,
    scale:       1
},
{
    name:        "KORD Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   41.974610, visualLon: -87.898608,
    alt:         98.1,      visualAlt: 98.1,
    heading:     300,
    scale:       1
},
{
    name:        "KORD Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   41.973905, visualLon: -87.897443,
    alt:         98.1,      visualAlt: 98.1,
    heading:     300,
    scale:       1
},
{
    name:        "KORD China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   41.977593, visualLon: -87.898163,
    alt:         98.25,     visualAlt: 98.25,
    heading:     120,
    scale:       1
},
{
    name:        "KORD Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   41.977357, visualLon: -87.896702,
    alt:         98.1,      visualAlt: 98.1,
    heading:     90,
    scale:       1
},
{
    name:        "KORD Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
    visualLat:   41.976684, visualLon: -87.897269,
    alt:         98.1,      visualAlt: 98.1,
    heading:     270,
    scale:       1
},
{
    name:        "KORD Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20737MAX.glb",
    visualLat:   41.974629, visualLon: -87.902958,
    alt:         98.1,      visualAlt: 98.1,
    heading:     180,
    scale:       1
},
{
    name:        "KORD Volaris",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
    visualLat:   41.973736, visualLon: -87.888790,
    alt:         98,        visualAlt: 98,
    heading:     270,
    scale:       1
},
{
    name:        "KORD Aeromexico",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
    visualLat:   41.973720, visualLon: -87.887224,
    alt:         98,        visualAlt: 98,
    heading:     270,
    scale:       1
},
{
    name:        "KORD Jetblue",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
    visualLat:   41.973704, visualLon: -87.884606,
    alt:         98,        visualAlt: 98,
    heading:     270,
    scale:       1
},
    // === CYYZ === (Elevation: 82m)
    // Air Canada
    {
        name:        "CYYZ Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   43.679900, visualLon: -79.612528,
        alt:         82,        visualAlt: 82,
        heading:     325,
        scale:       0.33
    },

    {
        name:        "CYYZ Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
        visualLat:   43.680400, visualLon: -79.616240,
        alt:         82,        visualAlt: 82,
        heading:     59,
        scale:       1
    },
    {
        name:        "CYYZ Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   43.680129, visualLon: -79.614303,
        alt:         82,        visualAlt: 82,
        heading:     260,
        scale:       1
    },
    // ANA
    {
        name:        "CYYZ ANA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
        visualLat:   43.675932, visualLon: -79.611723,
        alt:         82,        visualAlt: 82,
        heading:     272,
        scale:       1
    },
    {
        name:        "CYYZ ANA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
        visualLat:   43.676293, visualLon: -79.610425,
        alt:         82,        visualAlt: 82,
        heading:     246,
        scale:       1
    },
    // Air China
    {
        name:        "CYYZ Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        visualLat:   43.677154, visualLon: -79.610039,
        alt:         82,        visualAlt: 82,
        heading:     153,
        scale:       1
    },
    {
        name:        "CYYZ Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        visualLat:   43.677235, visualLon: -79.613633,
        alt:         82,        visualAlt: 82,
        heading:     32,
        scale:       1
    },
    // Swiss
    {
        name:        "CYYZ Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   43.676273, visualLon: -79.613096,
        alt:         82,        visualAlt: 82,
        heading:     317,
        scale:       1
    },
    {
        name:        "CYYZ Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   43.678806, visualLon: -79.610629,
        alt:         82,        visualAlt: 82,
        heading:     180,
        scale:       1
    },
    // Westjet
    {
        name:        "CYYZ Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   43.683535, visualLon: -79.619405,
        alt:         82.07,        visualAlt: 82.07,
        heading:     200,
        scale:       1
    },
    {
        name:        "CYYZ Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   43.684346, visualLon: -79.619115,
        alt:         82.17,        visualAlt: 82.17,
        heading:     208,
        scale:       1
    },
    // British Airways
    {
        name:        "CYYZ British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   43.685486, visualLon: -79.621401,
        alt:         82,        visualAlt: 82,
        heading:     308,
        scale:       1
    },
    {
        name:        "CYYZ American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   43.684313, visualLon: -79.620125,
        alt:         82.17,     visualAlt: 82.17,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYYZ United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   43.683507, visualLon: -79.620468,
        alt:         82.07,     visualAlt: 82.07,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYYZ Alaska",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alaska%20737.glb",
        visualLat:   43.682125, visualLon: -79.620768,
        alt:         82.07,     visualAlt: 82.07,
        heading:     300,
        scale:       1
    },
    {
        name:        "CYYZ Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
        visualLat:   43.685804, visualLon: -79.622874,
        alt:         82,        visualAlt: 82,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYYZ Brussels Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Brussels%20Airlines.glb",
        visualLat:   43.685455, visualLon: -79.623912,
        alt:         82,        visualAlt: 82,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYYZ KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   43.684734, visualLon: -79.624406,
        alt:         82,        visualAlt: 82,
        heading:     310,
        scale:       1
    },
    {
        name:        "CYYZ Air France 1",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   43.681791, visualLon: -79.615479,
        alt:         82,        visualAlt: 82,
        heading:     300,
        scale:       1
    },
    {
        name:        "CYYZ Air France 2",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   43.679845, visualLon: -79.617303,
        alt:         82,        visualAlt: 82,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYYZ Ita Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        visualLat:   43.679572, visualLon: -79.615415,
        alt:         82,        visualAlt: 82,
        heading:     220,
        scale:       1
    },
    {
        name:        "CYYZ Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        visualLat:   43.678494, visualLon: -79.612250,
        alt:         82,        visualAlt: 82,
        heading:     5,
        scale:       1
    },
    {
        name:        "CYYZ Biman Bangladesh",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
        visualLat:   43.677874, visualLon: -79.611102,
        alt:         82,        visualAlt: 82,
        heading:     185,
        scale:       1
    },
    {
        name:        "CYYZ Air India",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
        visualLat:   43.679053, visualLon: -79.607057,
        alt:         82,        visualAlt: 82,
        heading:     135,
        scale:       1
    },
    {
        name:        "CYYZ Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
        visualLat:   43.681294, visualLon: -79.607717,
        alt:         82,        visualAlt: 82,
        heading:     225,
        scale:       1
    },
    {
        name:        "CYYZ Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
        visualLat:   43.679650, visualLon: -79.607787,
        alt:         82,        visualAlt: 82,
        heading:     135,
        scale:       1
    },
    {
        name:        "CYYZ Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   43.681294, visualLon: 43.681294,
        alt:         82,        visualAlt: 82,
        heading:     225,
        scale:       1
    },

    // === CYUL === (Elevation: 14.5m)
    // Air Canada
    {
        name:        "CYUL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   45.459446, visualLon: -73.753918,
        alt:         14.57,      visualAlt: 14.57,
        heading:     122,
        scale:       0.33
    },
    {
        name:        "CYUL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
        visualLat:   45.459664, visualLon: -73.754546,
        alt:         14.57,      visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   45.459642, visualLon: -73.755307,
        alt:         14.57,      visualAlt: 14.57,
        heading:     90,
        scale:       0.33
    },
    {
        name:        "CYUL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   45.459634, visualLon: -73.756332,
        alt:         14.57,      visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    // Air France
    {
        name:        "CYUL Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   45.459555, visualLon: -73.757271,
        alt:         14.57,      visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   45.459540, visualLon: -73.758118,
        alt:         14.57,      visualAlt: 14.57,
        heading:     57,
        scale:       1
    },
    // Lufthansa
    {
        name:        "CYUL Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   45.458961, visualLon: -73.758135,
        alt:         14.5,      visualAlt: 14.5,
        heading:     15,
        scale:       1
    },
    // Corsair
    {
        name:        "CYUL Corsair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-22@main/models/Corsair%20A330.glb",
        visualLat:   45.458412, visualLon: -73.756767,
        alt:         14.5,      visualAlt: 14.5,
        heading:     280,
        scale:       1
    },
    {
        name:        "CYUL Corsair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-22@main/models/Corsair%20A330.glb",
        visualLat:   45.458758, visualLon: -73.755806,
        alt:         14.5,      visualAlt: 14.5,
        heading:     280,
        scale:       1
    },
    // Westjet
    {
        name:        "CYUL Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   45.454958, visualLon: -73.754927,
        alt:         14.36,      visualAlt: 14.36,
        heading:     260,
        scale:       1
    },
    {
        name:        "CYUL Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   45.454951, visualLon: -73.755442,
        alt:         14.36,      visualAlt: 14.36,
        heading:     260,
        scale:       1
    },
    {
        name:        "CYUL American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   45.459132, visualLon: -73.748509,
        alt:         14.57,     visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   45.459140, visualLon: -73.749518,
        alt:         14.57,     visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   45.459095, visualLon: -73.751428,
        alt:         14.57,     visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   45.457240, visualLon: -73.753576,
        alt:         14.5,      visualAlt: 14.5,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYUL Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   45.456563, visualLon: -73.754091,
        alt:         14.36,     visualAlt: 14.36,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYUL Air Algérie",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
        visualLat:   45.456082, visualLon: -73.754531,
        alt:         14.36,     visualAlt: 14.36,
        heading:     40,
        scale:       1
    },
    {
        name:        "CYUL Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   45.455609, visualLon: -73.755736,
        alt:         14.36,     visualAlt: 14.36,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   45.455148, visualLon: -73.756076,
        alt:         14.36,     visualAlt: 14.36,
        heading:     0,
        scale:       1
    },
    {
        name:        "CYUL Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
        visualLat:   45.458617, visualLon: -73.746012,
        alt:         14.57,     visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        visualLat:   45.458662, visualLon: -73.744939,
        alt:         14.57,     visualAlt: 14.57,
        heading:     90,
        scale:       1
    },
    {
        name:        "CYUL Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
        visualLat:   45.458038, visualLon: -73.745347,
        alt:         14.57,     visualAlt: 14.57,
        heading:     270,
        scale:       1
    },
    // === CYVR === (Elevation: 1.8m)
    // Air Canada
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   49.197530, visualLon: -123.179772,
        alt:         2.2,       visualAlt: 2.2,
        heading:     307,
        scale:       1
    },
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   49.197978, visualLon: -123.180486,
        alt:         2.2,       visualAlt: 2.2,
        heading:     307,
        scale:       1
    },
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
        visualLat:   49.195209, visualLon: -123.181328,
        alt:         2.2,       visualAlt: 2.2,
        heading:     88,
        scale:       1
    },
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   49.195921, visualLon: -123.183940,
        alt:         2.2,       visualAlt: 2.2,
        heading:     93,
        scale:       0.33
    },
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   49.198633, visualLon: -123.183796,
        alt:         2.2,       visualAlt: 2.2,
        heading:     284,
        scale:       0.33
    },
    {
        name:        "CYVR Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
        visualLat:   49.194112, visualLon: -123.182363,
        alt:         2.04,       visualAlt: 2.04,
        heading:     325,
        scale:       1
    },
    // Westjet
    {
        name:        "CYVR Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   49.194946, visualLon: -123.183039,
        alt:         2,       visualAlt: 2,
        heading:     297,
        scale:       1
    },
    {
        name:        "CYVR Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   49.192724, visualLon: -123.185003,
        alt:         1.8,       visualAlt: 1.8,
        heading:     6,
        scale:       1
    },
    {
        name:        "CYVR Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   49.191879, visualLon: -123.180346,
        alt:         1.75,       visualAlt: 1.75,
        heading:     286,
        scale:       1
    },
    // United
    {
        name:        "CYVR United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   49.197141, visualLon: -123.173206,
        alt:         2.2,       visualAlt: 2.2,
        heading:     243,
        scale:       1
    },
    // Eva Air
    {
        name:        "CYVR Eva Air",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
        visualLat:   49.198903, visualLon: -123.179321,
        alt:         2.2,       visualAlt: 2.2,
        heading:     115,
        scale:       1
    },
    {
        name:        "CYVR Japan Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
        visualLat:   49.192039, visualLon: -123.182053,
        alt:         1.75,      visualAlt: 1.75,
        heading:     280,
        scale:       1
    },
    {
        name:        "CYVR Korean Air",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
        visualLat:   49.192025, visualLon: -123.183501,
        alt:         1.8,       visualAlt: 1.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "CYVR EVA Air",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
        visualLat:   49.192824, visualLon: -123.183083,
        alt:         1.8,       visualAlt: 1.8,
        heading:     70,
        scale:       1
    },
    {
        name:        "CYVR China Southern",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
        visualLat:   49.194956, visualLon: -123.186087,
        alt:         2.2,       visualAlt: 2.2,
        heading:     10,
        scale:       1
    },
    {
        name:        "CYVR Air India",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
        visualLat:   49.195684, visualLon: -123.185872,
        alt:         2.2,       visualAlt: 2.2,
        heading:     10,
        scale:       1
    },
    {
        name:        "CYVR Air New Zealand",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
        visualLat:   49.195538, visualLon: -123.180090,
        alt:         2.2,       visualAlt: 2.2,
        heading:     50,
        scale:       1
    },
    {
        name:        "CYVR Qantas",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
        visualLat:   49.198223, visualLon: -123.181692,
        alt:         2.2,       visualAlt: 2.2,
        heading:     280,
        scale:       1
    },
    {
        name:        "CYVR Fiji Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
        visualLat:   49.199329, visualLon: -123.183845,
        alt:         2.2,       visualAlt: 2.2,
        heading:     100,
        scale:       1
    },
    {
        name:        "CYVR Phillippine Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
        visualLat:   49.197941, visualLon: -123.178035,
        alt:         2.2,       visualAlt: 2.2,
        heading:     120,
        scale:       1
    },
    {
        name:        "CYVR United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   49.197879, visualLon: -123.175455,
        alt:         2.2,       visualAlt: 2.2,
        heading:     80,
        scale:       1
    },
    {
        name:        "CYVR Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   49.196877, visualLon: -123.175487,
        alt:         2.2,       visualAlt: 2.2,
        heading:     240,
        scale:       1
    },
    {
        name:        "CYVR KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   49.198236, visualLon: -123.173963,
        alt:         2.2,       visualAlt: 2.2,
        heading:     95,
        scale:       1
    },
    // === CYYC === (Elevation: 1084m)
// Air Canada
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.129517, visualLon: -114.011678,
    alt:         1079.4,    visualAlt: 0,
    heading:     223,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:   51.129939, visualLon: -114.010981,
    alt:         1079.4,    visualAlt: 0,
    heading:     223,
    scale:       1
},
{
    name: "CYYC KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   51.129575, visualLon: -114.000044,
    alt:         1079.4,    visualAlt: 0,
    heading:     270,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.129433, visualLon: -114.007764,
    alt:         1079.4,    visualAlt: 0,
    heading:     180,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.129008, visualLon: -114.007850,
    alt:         1079.4,    visualAlt: 0,
    heading:     180,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.128614, visualLon: -114.007783,
    alt:         1079.4,    visualAlt: 0,
    heading:     180,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.128375 , visualLon: -114.007889,
    alt:         1079.4,    visualAlt: 0,
    heading:     224,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:   51.128225, visualLon: -114.008761,
    alt:         1079.4,    visualAlt: 0,
    heading:     283,
    scale:       1
},
{
    name: "CYYC American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
    visualLat:   51.129517, visualLon: -113.998872,
    alt:         1079.4,    visualAlt: 0,
    heading:     270,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   51.129469, visualLon: -114.001328,
    alt:         1079.4,    visualAlt: 0,
    heading:     270,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   51.130508 , visualLon: -114.000461,
    alt:         1079.4,    visualAlt: 0,
    heading:     90,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.130664, visualLon: -113.999022,
    alt:         1079.4,    visualAlt: 0,
    heading:     90,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.130511, visualLon: -113.998114,
    alt:         1079.4,    visualAlt: 0,
    heading:     90,
    scale:       1
},
{
    name:        "CYYC United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
    visualLat:   51.129100, visualLon: -114.002911,
    alt:         1079.4,    visualAlt: 0,
    heading:     224,
    scale:       1
},
{
    name:        "CYYC Alaska",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
    visualLat:   51.128303, visualLon: -114.003417,
    alt:         1079.4,    visualAlt: 0,
    heading:     180,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:    51.134258, visualLon: -114.012683,
    alt:         1079.4,    visualAlt: 0,
    heading:     0,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:    51.134258, visualLon: -114.012689,
    alt:         1079.4,    visualAlt: 0,
    heading:     0,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:    51.133292, visualLon: -114.014883,
    alt:         1079.4,    visualAlt: 0,
    heading:     90,
    scale:       1
},
{
    name:        "CYYC Westjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
    visualLat:   51.133219, visualLon: -114.013400,
    alt:         1079.4,    visualAlt: 0,
    heading:     90,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
    visualLat:   51.132789, visualLon: -114.015778,
    alt:         1079.4,    visualAlt: 0,
    heading:     0,
    scale:       0.33
},
{
    name: "CYYC Air Canada",
    model: "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20Canada%20Dash8%20Q400.glb",
    visualLat:   51.134572, visualLon: -114.012689,
    alt:         1079.4,    visualAlt: 0,
    heading:     0,
    scale:       1
},
{
    name: "CYYC Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   51.132489, visualLon: -114.014950,
    alt:         1079.4,    visualAlt: 0,
    heading:     270,
    scale:       1
},
    // === MMMX === (Elevation: 1118.5m)
    // Aeromexico
    {
        name:        "MMMX Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
        visualLat:   19.436097, visualLon: -99.080081,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     244,
        scale:       1
    },
    {
        name:        "MMMX Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
        visualLat:   19.435338, visualLon: -99.081176,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     244,
        scale:       1
    },
    {
        name:        "MMMX Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
        visualLat:   19.433321, visualLon: -99.084802,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     244,
        scale:       1
    },
    {
        name:        "MMMX Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
        visualLat:   19.434003, visualLon: -99.083541,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     244,
        scale:       1
    },
    // United
    {
        name:        "MMMX United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   19.432188, visualLon: -99.086803,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     259,
        scale:       1
    },
    // American Airlines
    {
        name:        "MMMX American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   19.432683, visualLon: -99.087082,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     70,
        scale:       1
    },
    {
        name:        "MMMX Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   19.436735, visualLon: -99.079298,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     155,
        scale:       1
    },
    {
        name:        "MMMX Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   19.434523, visualLon: -99.082834,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMMX Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   19.432953, visualLon: -99.085506,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMMX British",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   19.437921, visualLon: -99.077609,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     135,
        scale:       1
    },
    {
        name:        "MMMX ANA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
        visualLat:   19.437153, visualLon: -99.077470,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMMX Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   19.437476, visualLon: -99.078081,
        alt:         1118.5,    visualAlt: 1118.5,
        heading:     315,
        scale:       1
    },

    // === MMUN === (Elevation: 5m)
    // Aeromexico
    {
        name:        "MMUN Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
        visualLat:   21.039067, visualLon: -86.876341,
        alt:         5,         visualAlt: 5,
        heading:     270,
        scale:       1
    },
    {
        name:        "MMUN Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
        visualLat:   21.039152, visualLon: -86.875794,
        alt:         5,         visualAlt: 5,
        heading:     270,
        scale:       1
    },
    {
        name:        "MMUN Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Aeromexico%20B737.glb",
        visualLat:   21.040132, visualLon: -86.877017,
        alt:         5.2,         visualAlt: 5.2,
        heading:     15,
        scale:       1
    },
    // United
    {
        name:        "MMUN United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   21.037815, visualLon: -86.872779,
        alt:         4.88,      visualAlt: 4.88,
        heading:     297,
        scale:       1
    },
    {
        name:        "MMUN United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   21.038255, visualLon: -86.873455,
        alt:         4.88,      visualAlt: 4.88,
        heading:     297,
        scale:       1
    },
    // Allegiant
    {
        name:        "MMUN Allegiant",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-19@main/models/Allegiant%20A320.glb",
        visualLat:   21.036443, visualLon: -86.870392,
        alt:         4.63,      visualAlt: 4.63,
        heading:     297,
        scale:       1
    },
    {
        name:        "MMUN Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   21.037923, visualLon: -86.866753,
        alt:         4.63,      visualAlt: 4.63,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMUN Southwest",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
        visualLat:   21.037478, visualLon: -86.866989,
        alt:         4.63,      visualAlt: 4.63,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMUN Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20737MAX.glb",
        visualLat:   21.037158, visualLon: -86.867177,
        alt:         4.63,      visualAlt: 4.63,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMUN Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   21.036446, visualLon: -86.867719,
        alt:         4.63,      visualAlt: 4.63,
        heading:     225,
        scale:       0.33
    },
    {
        name:        "MMUN Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   21.035786, visualLon: -86.868180,
        alt:         4.63,      visualAlt: 4.63,
        heading:     225,
        scale:       1
    },
    {
        name:        "MMUN American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   21.035871, visualLon: -86.869280,
        alt:         4.63,      visualAlt: 4.63,
        heading:     315,
        scale:       1
    },

    // === PANC === (Elevation: 16.3m)
    // Alaska Airlines
      {
        name:        "PANC Alaska Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737.glb",
        visualLat:   61.172532, visualLon: -149.983242,
        alt:         16.18,      visualAlt: 16.18,
        heading:     250,
        scale:       1
    },
    {
        name:        "PANC Alaska Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737.glb",
        visualLat:   61.172230, visualLon: -149.984427,
        alt:         16.18,      visualAlt: 16.18,
        heading:     270,
        scale:       1
    },
    {
        name:        "PANC Alaska Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737.glb",
        visualLat:   61.172279, visualLon: -149.985292,
        alt:         16.18,      visualAlt: 16.18,
        heading:     23,
        scale:       1
    },
    {
        name:        "PANC Alaska Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/Alaska%20737%20v2.glb",
        visualLat:   61.17303125200946, visualLon: -149.9851186119275,
        alt:         16,      visualAlt: 16,
        heading:     58,
        scale:       1
    },
    // Lufthansa
    {
        name:        "PANC Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   61.174642, visualLon: -149.990585,
        alt:         16.3,      visualAlt: 16.3,
        heading:     333,
        scale:       1
    },
    // Allegiant
    {
        name:        "PANC Allegiant",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-19@main/models/Allegiant%20A320.glb",
        visualLat:   61.177726, visualLon: -149.988875,
        alt:         15.77,      visualAlt: 15.77,
        heading:     255,
        scale:       1
    },
    {
        name:        "PANC Allegiant",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-19@main/models/Allegiant%20A320.glb",
        visualLat:   61.177656, visualLon: -149.987690,
        alt:         15.5,      visualAlt: 15.5,
        heading:     250,
        scale:       1
    },
    {
        name:        "PANC Allegiant",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-19@main/models/Allegiant%20A320.glb",
        visualLat:   61.178963, visualLon: -149.989674,
        alt:         15.6,      visualAlt: 15.6,
        heading:     90,
        scale:       1
    },
    {
        name:        "PANC Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   61.175890, visualLon: -149.984826,
        alt:         15.2,      visualAlt: 15.2,
        heading:     10,
        scale:       0.33
    },
    {
        name:        "PANC United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   61.175208, visualLon: -149.984483,
        alt:         15.5,     visualAlt: 15.5,
        heading:     10,
        scale:       1
    },
    {
        name:        "PANC American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/American%20737.glb",
        visualLat:   61.174505, visualLon: -149.984010,
        alt:         15.68,     visualAlt: 15.68,
        heading:     10,
        scale:       1
    },
    {
        name:        "PANC Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Condor%20Rouge%20A321.glb",
        visualLat:   61.172114, visualLon: -149.977316,
        alt:         16.18,     visualAlt: 16.18,
        heading:     270,
        scale:       1
    },

    // === SBGR === (Elevation: 374.85m)
    // Azul
    {
        name:        "SBGR Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Azul%20ATR72.glb",
        visualLat:   -23.4298, visualLon: -46.488640,
        alt:         374.6,     visualAlt: 374.6,
        heading:     188,
        scale:       1
    },
    {
        name:        "SBGR Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/Azul%20A330.glb",
        visualLat:   -23.429042, visualLon: -46.488593,
        alt:         374.2,    visualAlt: 374.2,
        heading:     188,
        scale:       1
    },
    // Sky
    {
        name:        "SBGR Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -23.429026, visualLon: -46.479468,
        alt:         375.265,     visualAlt: 375.265,
        heading:     257,
        scale:       1
    },
    {
        name:        "SBGR Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -23.427845, visualLon: -46.479731,
        alt:         374.85,     visualAlt: 374.85,
        heading:     175,
        scale:       1
    },
    {
        name:        "SBGR Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -23.427398, visualLon: -46.479763,
        alt:         374.75,     visualAlt: 374.75,
        heading:     175,
        scale:       1
    },
    // Volaris
   {
        name:        "SBGR Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -23.427870, visualLon: -46.486436,
        alt:         373.80,     visualAlt: 373.80,
        heading:     3,
        scale:       1
    },
    {
        name:        "SBGR Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -23.428293, visualLon: -46.486522,
        alt:         373.90,     visualAlt: 373.90,
        heading:     3,
        scale:       1
    },
    {
        name:        "SBGR Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -23.428681, visualLon: -46.486538,
        alt:         373.90,     visualAlt: 373.90,
        heading:     3,
        scale:       1
    },
    {
        name:        "SBGR Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -23.429009, visualLon: -46.486121,
        alt:         374.15,     visualAlt: 374.15,
        heading:     273,
        scale:       1
    },
    // Air France
    {
        name:        "SBGR Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -23.424208, visualLon: -46.473991,
        alt:         375.88,     visualAlt: 374.88,
        heading:     168,
        scale:       1
    },
    {
        name:        "SBGR Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -23.423435, visualLon: -46.474206,
        alt:         375.05,     visualAlt: 375.05,
        heading:     168,
        scale:       1
    },
    {
        name:        "SBGR Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -23.425885, visualLon: -46.473471,
        alt:         375.6,     visualAlt: 375.6,
        heading:     168,
        scale:       1
    },
    // Emirates
    {
        name:        "SBGR Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   -23.428155, visualLon: -46.488550,
        alt:         373.90,     visualAlt: 373.90,
        heading:     188,
        scale:       1
    },
    {
        name:        "SBGR Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   -23.426900, visualLon: -46.488362,
        alt:         373.6,     visualAlt: 373.6,
        heading:     188,
        scale:       1
    },
    {
        name:        "SBGR United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   -23.423156, visualLon: -46.471473,
        alt:         375.5,    visualAlt: 375.5,
        heading:     348,
        scale:       1
    },
    {
        name:        "SBGR American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -23.426374, visualLon: -46.474491,
        alt:         375.6,     visualAlt: 375.6,
        heading:     348,
        scale:       1
    },
    {
        name:        "SBGR Ita Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        visualLat:   -23.427699, visualLon: -46.474080,
        alt:         375.6,     visualAlt: 375.6,
        heading:     348,
        scale:       1
    },
    {
        name:        "SBGR Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
        visualLat:   -23.426612, visualLon: -46.477063,
        alt:         375.15,    visualAlt: 375.15,
        heading:     168,
        scale:       1
    },
    {
        name:        "SBGR South African",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/South%20African%20A340.glb",
        visualLat:   -23.427703, visualLon: -46.476725,
        alt:         375.55,    visualAlt: 375.55,
        heading:     168,
        scale:       1
    },
    {
        name:        "SBGR Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   -23.427113, visualLon: -46.477578,
        alt:         375.15,    visualAlt: 375.15,
        heading:     348,
        scale:       1
    },
    {
        name:        "SBGR Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        visualLat:   -23.427876, visualLon: -46.477353,
        alt:         375.35,    visualAlt: 375.35,
        heading:     348,
        scale:       1
    },

    // === SKBO === (Elevation: 1271.5m)
    // United
    {
        name:        "SKBO United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   4.698088,   visualLon: -74.145488,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     317,
        scale:       1
    },
    {
        name:        "SKBO United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   4.697640,   visualLon: -74.144888,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     317,
        scale:       1
    },
    {
        name:        "SKBO United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   4.697207,   visualLon: -74.144324,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     317,
        scale:       1
    },
    // Azul
    {
        name:        "SKBO Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Azul%20ATR72.glb",
        visualLat:   4.700087,   visualLon: -74.141873,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     115,
        scale:       1
    },
    {
        name:        "SKBO Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Azul%20ATR72.glb",
        visualLat:   4.700429,   visualLon: -74.142415,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     112,
        scale:       1
    },
    {
        name:        "SKBO Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Azul%20A320.glb",
        visualLat:   4.699777,   visualLon: -74.141283,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     125,
        scale:       1
    },
    {
        name:        "SKBO Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Azul%20A320.glb",
        visualLat:   4.699276,   visualLon: -74.140800,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     125,
        scale:       1
    },
    // Sky
    {
        name:        "SKBO Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   4.699944,   visualLon: -74.143321,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     304,
        scale:       1
    },
    {
        name:        "SKBO Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   4.699698,   visualLon: -74.142914,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     305,
        scale:       1
    },
    {
        name:        "SKBO Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   4.699238,   visualLon: -74.142345,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     304,
        scale:       1
    },
    // American
    {
        name:        "SKBO American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   4.698158,   visualLon: -74.139335,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     131,
        scale:       1
    },
    {
        name:        "SKBO American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   4.701018,   visualLon: -74.144330,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     25,
        scale:       1
    },
    // Jetblue
    {
        name:        "SKBO Jetblue",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
        visualLat:   4.699211,   visualLon: -74.145408,
        alt:         1271.5,     visualAlt: 1271.5,
        heading:     102,
        scale:       1
    },
    {
        name:        "SKBO Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   4.698146, visualLon: -74.144113,
        alt:         1271.5,   visualAlt: 1271.5,
        heading:     124,
        scale:       1
    },
    {
        name:        "SKBO Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
        visualLat:   4.698605, visualLon: -74.144736,
        alt:         1271.5,   visualAlt: 1271.5,
        heading:     124,
        scale:       1
    },
    {
        name:        "SKBO Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
        visualLat:   4.697097, visualLon: -74.137971,
        alt:         1271.5,   visualAlt: 1271.5,
        heading:     104,
        scale:       1
    },

    // === SPJC === (Elevation: 12.5m)
    // American Airlines
    {
        name:        "SPJC American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -12.026318, visualLon: -77.118732,
        alt:         12.5,       visualAlt: 12.5,
        heading:     338,
        scale:       1
    },
    {
        name:        "SPJC American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -12.026968, visualLon: -77.118346,
        alt:         12.5,       visualAlt: 12.5,
        heading:     338,
        scale:       1
    },
    {
        name:        "SPJC American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -12.027660, visualLon: -77.118067,
        alt:         12.5,       visualAlt: 12.5,
        heading:     338,
        scale:       1
    },
    {
        name:        "SPJC American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -12.025699, visualLon: -77.119033,
        alt:         12.5,       visualAlt: 12.5,
        heading:     338,
        scale:       1
    },
    // Emirates
    {
        name:        "SPJC Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   -12.029000, visualLon: -77.118358,
        alt:         12.5,       visualAlt: 12.5,
        heading:     62,
        scale:       1
    },
    {
        name:        "SPJC Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   -12.029246, visualLon: -77.119012,
        alt:         12.1,       visualAlt: 12.1,
        heading:     61,
        scale:       1
    },
    // Lufthansa
    {
        name:        "SPJC Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   -12.030448, visualLon: -77.118690,
        alt:         12.1,       visualAlt: 12.1,
        heading:     340,
        scale:       1
    },
    {
        name:        "SPJC Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   -12.031476, visualLon: -77.118218,
        alt:         12.1,       visualAlt: 12.1,
        heading:     339,
        scale:       1
    },
    // Sky
    {
        name:        "SPJC Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -12.030013, visualLon: -77.119162,
        alt:         12.1,       visualAlt: 12.1,
        heading:     340,
        scale:       1
    },
    // Azul
    {
        name:        "SPJC Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Azul%20ATR72.glb",
        visualLat:   -12.029409, visualLon: -77.113932,
        alt:         13.6,       visualAlt: 13.6,
        heading:     157,
        scale:       1
    },
    {
        name:        "SPJC Azul",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Azul%20ATR72.glb",
        visualLat:   -12.028670, visualLon: -77.114308,
        alt:         13.6,       visualAlt: 13.6,
        heading:     156,
        scale:       1
    },
      {
        name:        "SPJC United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/United%20A320.glb",
        visualLat:   -12.022458, visualLon: -77.110020,
        alt:         15.5,      visualAlt: 15.5,
        heading:     330,
        scale:       1
    },
    {
        name:        "SPJC Volaris 1",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -12.023184, visualLon: -77.109448,
        alt:         15.5,      visualAlt: 15.5,
        heading:     330,
        scale:       1
    },
    {
        name:        "SPJC Volaris 2",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -12.023697, visualLon: -77.109084,
        alt:         15.5,      visualAlt: 15.5,
        heading:     330,
        scale:       1
    },
    {
        name:        "SPJC Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   -12.024788, visualLon: -77.108676,
        alt:         15.5,      visualAlt: 15.5,
        heading:     330,
        scale:       1
    },
    {
        name:        "SPJC Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -12.025763, visualLon: -77.108290,
        alt:         15.5,      visualAlt: 15.5,
        heading:     330,
        scale:       1
    },
    // === SCEL === (Elevation: 240.6m)
    // Sky
    {
        name:        "SCEL Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -33.396039, visualLon: -70.797754,
        alt:         240.4,      visualAlt: 240.4,
        heading:     88,
        scale:       1
    },
    {
        name:        "SCEL Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -33.396057, visualLon: -70.794547,
        alt:         240.2,      visualAlt: 240.2,
        heading:     90,
        scale:       1
    },
    // United
    {
        name:        "SCEL United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   -33.400456, visualLon: -70.797786,
        alt:         240.6,      visualAlt: 240.6,
        heading:     271,
        scale:       1
    },
    {
        name:        "SCEL United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   -33.400420, visualLon: -70.796873,
        alt:         240.6,      visualAlt: 240.6,
        heading:     279,
        scale:       1
    },
    // KLM
    {
        name:        "SCEL KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   -33.403688, visualLon: -70.797598,
        alt:         240.2,      visualAlt: 240.2,
        heading:     275,
        scale:       1
    },
    {
        name:        "SCEL American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -33.403324, visualLon: -70.790271,
        alt:         241,     visualAlt: 241,
        heading:     265,
        scale:       1
    },
    {
        name:        "SCEL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Air%20Canada%20737.glb",
        visualLat:   -33.400127, visualLon: -70.790486,
        alt:         241,     visualAlt: 241,
        heading:     265,
        scale:       0.33
    },
    {
        name:        "SCEL Iberia 1",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   -33.395980, visualLon: -70.790218,
        alt:         240.6,     visualAlt: 240.6,
        heading:     85,
        scale:       1
    },
    {
        name:        "SCEL Iberia 2",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   -33.395989, visualLon: -70.791312,
        alt:         240.6,     visualAlt: 240.6,
        heading:     85,
        scale:       1
    },
    {
        name:        "SCEL Iberia 3",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   -33.396034, visualLon: -70.792578,
        alt:         240.6,     visualAlt: 240.6,
        heading:     85,
        scale:       1
    },
    {
        name:        "SCEL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   -33.399201, visualLon: -70.790818,
        alt:         240.9,     visualAlt: 240.9,
        heading:     85,
        scale:       1
    },
    {
        name:        "SCEL Qantas",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
        visualLat:   -33.402471, visualLon: -70.790747,
        alt:         241,     visualAlt: 241,
        heading:     85,
        scale:       1
    },
    // === SAEZ === (Elevation: 10.1m)
    // American Airlines
    {
        name:        "SAEZ American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -34.814754, visualLon: -58.538653,
        alt:         10.1,       visualAlt: 10.1,
        heading:     258,
        scale:       1
    },
    {
        name:        "SAEZ American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -34.816848, visualLon: -58.536416,
        alt:         10.1,       visualAlt: 10.1,
        heading:     40,
        scale:       1
    },
    {
        name:        "SAEZ American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -34.812654, visualLon: -58.537773,
        alt:         10.1,       visualAlt: 10.1,
        heading:     150,
        scale:       1
    },
    {
        name:        "SAEZ American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   -34.814846, visualLon: -58.534925,
        alt:         10.1,       visualAlt: 10.1,
        heading:     15,
        scale:       1
    },
    // KLM
    {
        name:        "SAEZ KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   -34.816457, visualLon: -58.540658,
        alt:         10.1,       visualAlt: 10.1,
        heading:     227,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "SAEZ Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   -34.814138, visualLon: -58.537249,
        alt:         10.1,       visualAlt: 10.1,
        heading:     222,
        scale:       1
    },
    // United
    {
        name:        "SAEZ United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   -34.814785, visualLon: -58.538004,
        alt:         10.1,       visualAlt: 10.1,
        heading:     232,
        scale:       1
    },
    // Lufthansa
    {
        name:        "SAEZ Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   -34.816620, visualLon: -58.542364,
        alt:         10.1,       visualAlt: 10.1,
        heading:     277,
        scale:       1
    },
    // Air France
    {
        name:        "SAEZ Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -34.816444, visualLon: -58.543383,
        alt:         10.1,       visualAlt: 10.1,
        heading:     277,
        scale:       1
    },

    // === SBGL === (Elevation: 2.2m)
    // Sky
    {
        name:        "SBGL Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -22.813227, visualLon: -43.248302,
        alt:         2.2,        visualAlt: 2.2,
        heading:     13,
        scale:       1
    },
    {
        name:        "SBGL Sky",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SKY%20A320.glb",
        visualLat:   -22.814962, visualLon: -43.247862,
        alt:         2.2,        visualAlt: 2.2,
        heading:     328,
        scale:       1
    },
    // British Airways
    {
        name:        "SBGL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   -22.812440, visualLon: -43.250185,
        alt:         2.2,        visualAlt: 2.2,
        heading:     247,
        scale:       1
    },
    {
        name:        "SBGL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   -22.812510, visualLon: -43.250850,
        alt:         2.2,        visualAlt: 2.2,
        heading:     261,
        scale:       1
    },
    // Emirates
    {
        name:        "SBGL Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   -22.818176, visualLon: -43.242664,
        alt:         2.2,        visualAlt: 2.2,
        heading:     219,
        scale:       1
    },
    // Ethiopian
    {
        name:        "SBGL Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   -22.819259, visualLon: -43.243378,
        alt:         2.2,        visualAlt: 2.2,
        heading:     262,
        scale:       1
    },
    // Volaris
    {
        name:        "SBGL Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -22.815942, visualLon: -43.249906,
        alt:         2.2,        visualAlt: 2.2,
        heading:     126,
        scale:       1
    },
    {
        name:        "SBGL Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   -22.816560, visualLon: -43.249010,
        alt:         2.2,        visualAlt: 2.2,
        heading:     126,
        scale:       1
    },
    {
        name:        "SBGL United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   -22.815488, visualLon: -43.247386,
        alt:         2.2,       visualAlt: 2.2,
        heading:     301,
        scale:       1
    },
    {
        name:        "SBGL TAP",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/TAP%20A330.glb",
        visualLat:   -22.816081, visualLon: -43.245712,
        alt:         2.2,       visualAlt: 2.2,
        heading:     270,
        scale:       1
    },
    {
        name:        "SBGL KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   -22.810584, visualLon: -43.253072,
        alt:         2.2,       visualAlt: 2.2,
        heading:     345,
        scale:       1
    },
    {
        name:        "SBGL Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   -22.812096, visualLon: -43.252364,
        alt:         2.2,       visualAlt: 2.2,
        heading:     290,
        scale:       1
    },
      {
        name:        "SBGL Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -22.817395, visualLon: -43.243276,
        alt:         2.2,       visualAlt: 2.2,
        heading:     39,
        scale:       1
    },
    // === MPTO === (Elevation: 7.5m)
    // Condor
    {
        name:        "MPTO Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-6@main/models/Condor%20A321.glb",
        visualLat:   9.066597,   visualLon: -79.386439,
        alt:         7.5,        visualAlt: 7.5,
        heading:     213,
        scale:       1
    },
    // Volaris
    {
        name:        "MPTO Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   9.068420,   visualLon: -79.385403,
        alt:         7.5,        visualAlt: 7.5,
        heading:     68,
        scale:       1
    },
    {
        name:        "MPTO Volaris",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Volaris%20A321NEO.glb",
        visualLat:   9.068275,   visualLon: -79.384830,
        alt:         7.5,        visualAlt: 7.5,
        heading:     170,
        scale:       1
    },
    // Aeromexico
    {
        name:        "MPTO Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
        visualLat:   9.064541,   visualLon: -79.388982,
        alt:         7.5,        visualAlt: 7.5,
        heading:     182,
        scale:       1
    },
    // United
    {
        name:        "MPTO United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   9.064515,   visualLon: -79.387040,
        alt:         7.5,        visualAlt: 7.5,
        heading:     298,
        scale:       1
    },
    {
        name:        "MPTO United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   9.064859,   visualLon: -79.387399,
        alt:         7.5,        visualAlt: 7.5,
        heading:     0,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "MPTO Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
        visualLat:   9.063688,   visualLon: -79.389041,
        alt:         7.5,        visualAlt: 7.5,
        heading:     184,
        scale:       1
    },
    {
        name:        "MPTO American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   9.060832, visualLon: -79.390882,
        alt:         7.5,       visualAlt: 7.5,
        heading:     210,
        scale:       1
    },
    {
        name:        "MPTO Westjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Westjet%20B737MAX.glb",
        visualLat:   9.061531, visualLon: -79.389970,
        alt:         7.5,       visualAlt: 7.5,
        heading:     210,
        scale:       1
    },
    {
        name:        "MPTO Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   9.060608, visualLon: -79.392276,
        alt:         7.5,       visualAlt: 7.5,
        heading:     60,
        scale:       1
    },
    {
        name:        "MPTO Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   9.070226, visualLon: -79.385281,
        alt:         7.5,       visualAlt: 7.5,
        heading:     210,
        scale:       1
    },
    {
        name:        "MPTO KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   9.070830, visualLon: -79.385764,
        alt:         7.5,       visualAlt: 7.5,
        heading:     60,
        scale:       1
    },
   // === EGLL (Heathrow Airport: Alt 12.4) ===
    // Lufthansa
    {
        name:        "EGLL Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   51.4684,   visualLon: -0.450433,
        alt:         12.4,      visualAlt: 12.4,
        heading:     270,
        scale:       1
    },
    // United
    {
        name:        "EGLL United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   51.46863,  visualLon: -0.448797,
        alt:         12.4,      visualAlt: 12.4,
        heading:     270,
        scale:       1
    },
    // Brussels Airlines
    {
        name:        "EGLL Brussels Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Brussels%20Airlines.glb",
        visualLat:   51.46937,  visualLon: -0.447365,
        alt:         12.7,      visualAlt: 12.7,
        heading:     180,
        scale:       1
    },
    // SAS
    {
        name:        "EGLL SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        visualLat:   51.47038,  visualLon: -0.446952,
        alt:         12.7,      visualAlt: 12.7,
        heading:     180,
        scale:       1
    },
    // Air Canada
    {
        name:        "EGLL Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   51.47098,  visualLon: -0.442413,
        alt:         13.3,      visualAlt: 13.3,
        heading:     180,
        scale:       1
    },
    // Turkish
    {
        name:        "EGLL Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   51.47106,  visualLon: -0.443695,
        alt:         13.3,      visualAlt: 13.3,
        heading:     0,
        scale:       1
    },
    {
        name:        "EGLL Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Turkish%20737.glb",
        visualLat:   51.47186,  visualLon: -0.443728,
        alt:         13.3,      visualAlt: 13.3,
        heading:     1,
        scale:       1
    },
    // ANA
    {
        name:        "EGLL ANA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
        visualLat:   51.47415,  visualLon: -0.443808,
        alt:         13.3,      visualAlt: 13.3,
        heading:     0,
        scale:       1
    },
    // Qantas
    {
        name:        "EGLL Qantas",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
        visualLat:   51.47344,  visualLon: -0.447456,
        alt:         13.2,      visualAlt: 13.2,
        heading:     180,
        scale:       1
    },
    {
        name:        "EGLL Qantas",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
        visualLat:   51.47391,  visualLon: -0.448459,
        alt:         13.2,      visualAlt: 13.2,
        heading:     90,
        scale:       1
    },
    // Japan Airlines
    {
        name:        "EGLL Japan Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
        visualLat:   51.46865,  visualLon: -0.458297,
        alt:         12.4,      visualAlt: 12.4,
        heading:     270,
        scale:       1
    },
    {
        name:        "EGLL Japan Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
        visualLat:   51.46865,  visualLon: -0.456999,
        alt:         12.4,      visualAlt: 12.4,
        heading:     270,
        scale:       1
    },
    // Cathay Pacific
    {
        name:        "EGLL Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        visualLat:   51.46922,  visualLon: -0.463715,
        alt:         12.4,      visualAlt: 12.4,
        heading:     315,
        scale:       1
    },
    {
        name:        "EGLL Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        visualLat:   51.4707,   visualLon: -0.460395,
        alt:         12.4,      visualAlt: 12.4,
        heading:     315,
        scale:       1
    },
    // American Airlines
    {
        name:        "EGLL American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   51.47117,  visualLon: -0.46562,
        alt:         12.4,      visualAlt: 12.4,
        heading:     45,
        scale:       1
    },
    {
        name:        "EGLL American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   51.47134,  visualLon: -0.465191,
        alt:         12.4,      visualAlt: 12.4,
        heading:     135,
        scale:       1
    },
    {
        name:        "EGLL American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   51.46965,  visualLon: -0.463345,
        alt:         12.4,      visualAlt: 12.4,
        heading:     135,
        scale:       1
    },
    // Emirates
    {
        name:        "EGLL Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   51.47379,  visualLon: -0.465566,
        alt:         12.4,      visualAlt: 12.4,
        heading:     35,
        scale:       1
    },
    {
        name:        "EGLL Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   51.47404,  visualLon: -0.463308,
        alt:         12.4,      visualAlt: 12.4,
        heading:     125,
        scale:       1
    },
    // Virgin Atlantic
    {
        name:        "EGLL Virgin Atlantic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
        visualLat:   51.47078,  visualLon: -0.464563,
        alt:         12.4,      visualAlt: 12.4,
        heading:     135,
        scale:       1
    },
    {
        name:        "EGLL Virgin Atlantic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
        visualLat:   51.47318,  visualLon: -0.465437,
        alt:         12.4,      visualAlt: 12.4,
        heading:     0,
        scale:       1
    },
    // Air France
    {
        name:        "EGLL Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   51.45839,  visualLon: -0.450927,
        alt:         12.4,      visualAlt: 12.4,
        heading:     45,
        scale:       1
    },
    {
        name:        "EGLL Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        visualLat:   51.45897,  visualLon: -0.450047,
        alt:         12.4,      visualAlt: 12.4,
        heading:     47,
        scale:       1
    },
    // KLM
    {
        name:        "EGLL KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        visualLat:   51.45833,  visualLon: -0.448759,
        alt:         12.4,      visualAlt: 12.4,
        heading:     225,
        scale:       1
    },
    // Vietnam Airlines
    {
        name:        "EGLL Vietnam Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
        visualLat:   51.46115,  visualLon: -0.446979,
        alt:         12.4,      visualAlt: 12.4,
        heading:     45,
        scale:       1
    },
    // Kenya Airways
    {
        name:        "EGLL Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Kenya%20Airways%20B787.glb",
        visualLat:   51.4577,   visualLon: -0.450503,
        alt:         12.4,      visualAlt: 12.4,
        heading:     225,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "EGLL Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   51.46053,  visualLon: -0.441963,
        alt:         12.4,      visualAlt: 12.4,
        heading:     45,
        scale:       1
    },
    // British Airways
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   51.46982,  visualLon: -0.475393,
        alt:         12.5,      visualAlt: 12.5,
        heading:     180,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   51.47054,  visualLon: -0.475393,
        alt:         12.5,      visualAlt: 12.5,
        heading:     180,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   51.47397,  visualLon: -0.475453,
        alt:         12.5,      visualAlt: 12.5,
        heading:     180,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        visualLat:   51.47123,  visualLon: -0.476766,
        alt:         12.5,      visualAlt: 12.5,
        heading:     0,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        visualLat:   51.46985,  visualLon: -0.476906,
        alt:         12.5,      visualAlt: 12.5,
        heading:     0,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   51.47114,  visualLon: -0.481885,
        alt:         12.5,      visualAlt: 12.5,
        heading:     0,
        scale:       1
    },
    {
        name:        "EGLL British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   51.46978,  visualLon: -0.480646,
        alt:         12.5,      visualAlt: 12.5,
        heading:     180,
        scale:       1
    },
    // Iberia
    {
        name:        "EGLL Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   51.47213,  visualLon: -0.480651,
        alt:         12.5,      visualAlt: 12.5,
        heading:     181,
        scale:       1
    },
    {
        name:        "EGLL Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   51.47381,  visualLon: -0.481901,
        alt:         12.5,      visualAlt: 12.5,
        heading:     2,
        scale:       1
    },
    // Jet2
    {
        name:        "EGLL Jet2",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jet%202%20737.glb",
        visualLat:   51.46811,  visualLon: -0.486799,
        alt:         12.5,      visualAlt: 12.5,
        heading:     90,
        scale:       1
    },
    {
        name:        "EGLL Jet2",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jet%202%20737.glb",
        visualLat:   51.46821,  visualLon: -0.486192,
        alt:         12.5,      visualAlt: 12.5,
        heading:     90,
        scale:       1
    },

    // === EHAM (Amsterdam Airport Schiphol: Alt -1) ===
    // KLM
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        visualLat:   52.31180,  visualLon: 4.767491,
        alt:         -1,        visualAlt: -1,
        heading:     225,
        scale:       1
    },
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   52.31298,  visualLon: 4.768907,
        alt:         -1,        visualAlt: -1,
        heading:     225,
        scale:       1
    },
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   52.31212,  visualLon: 4.7662,
        alt:         -1,        visualAlt: -1,
        heading:     45,
        scale:       1
    },
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        visualLat:   52.31285,  visualLon: 4.7668,
        alt:         -1,        visualAlt: -1,
        heading:     45,
        scale:       1
    },
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   52.31233,  visualLon: 4.757779,
        alt:         -1,        visualAlt: -1,
        heading:     176,
        scale:       1
    },
    {
        name:        "EHAM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        visualLat:   52.30481,  visualLon: 4.76759,
        alt:         -1,        visualAlt: -1,
        heading:     225,
        scale:       1
    },
    // KLM City Hopper
    {
        name:        "EHAM KLM City Hopper",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/KLM%20City%20hopper%20E175.glb",
        visualLat:   52.30098,  visualLon: 4.754334,
        alt:         -1,        visualAlt: -1,
        heading:     150,
        scale:       1
    },
    {
        name:        "EHAM KLM City Hopper",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/KLM%20City%20hopper%20E175.glb",
        visualLat:   52.30031,  visualLon: 4.755037,
        alt:         -1,        visualAlt: -1,
        heading:     151,
        scale:       1
    },
    {
        name:        "EHAM KLM City Hopper",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/KLM%20City%20hopper%20E175.glb",
        visualLat:   52.30047,  visualLon: 4.754147,
        alt:         -1,        visualAlt: -1,
        heading:     330,
        scale:       1
    },
    {
        name:        "EHAM KLM City Hopper",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/KLM%20City%20hopper%20E175.glb",
        visualLat:   52.30019,  visualLon: 4.752065,
        alt:         -1,        visualAlt: -1,
        heading:     153,
        scale:       1
    },
    {
        name:        "EHAM KLM City Hopper",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/KLM%20City%20hopper%20E175.glb",
        visualLat:   52.29985,  visualLon: 4.752409,
        alt:         -1,        visualAlt: -1,
        heading:     151,
        scale:       1
    },
    // Air France
    {
        name:        "EHAM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        visualLat:   52.314058,  visualLon: 4.769773,
        alt:         -1,        visualAlt: -1,
        heading:     225,
        scale:       1
    },
    {
        name:        "EHAM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        visualLat:   52.313290,  visualLon: 4.7608,
        alt:         -1,        visualAlt: -1,
        heading:     58,
        scale:       1
    },
    {
        name:        "EHAM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   52.31298,  visualLon: 4.757741,
        alt:         -1,        visualAlt: -1,
        heading:     175,
        scale:       1
    },
    // SAS
    {
        name:        "EHAM SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        visualLat:   52.31200,  visualLon: 4.75613,
        alt:         -1,        visualAlt: -1,
        heading:     355,
        scale:       1
    },
    {
        name:        "EHAM SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        visualLat:   52.31266,  visualLon: 4.7559,
        alt:         -1,        visualAlt: -1,
        heading:     355,
        scale:       1
    },
    // China Southern
    {
        name:        "EHAM China Southern",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
        visualLat:   52.31355,  visualLon: 4.756225,
        alt:         -1,        visualAlt: -1,
        heading:     355,
        scale:       1
    },
    // Air Canada
    {
        name:        "EHAM Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   52.31209,  visualLon: 4.75294,
        alt:         -1,        visualAlt: -1,
        heading:     175,
        scale:       1
    },
    // American Airlines
    {
        name:        "EHAM American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   52.31275,  visualLon: 4.752875,
        alt:         -1,        visualAlt: -1,
        heading:     174,
        scale:       1
    },
    // Easyjet
    {
        name:        "EHAM Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        visualLat:   52.31039,  visualLon: 4.75523,
        alt:         -1,        visualAlt: -1,
        heading:     67,
        scale:       1
    },
    {
        name:        "EHAM Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        visualLat:   52.31018,  visualLon: 4.754688,
        alt:         -1,        visualAlt: -1,
        heading:     67,
        scale:       1
    },
    {
        name:        "EHAM Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        visualLat:   52.31135,  visualLon: 4.7559,
        alt:         -1,        visualAlt: -1,
        heading:     355,
        scale:       1
    },
    // Ryanair
    {
        name:        "EHAM Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        visualLat:   52.30979,  visualLon: 4.753578,
        alt:         -1,        visualAlt: -1,
        heading:     67,
        scale:       1
    },
    // Vueling
    {
        name:        "EHAM Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        visualLat:   52.30941,  visualLon: 4.752484,
        alt:         -1,        visualAlt: -1,
        heading:     68,
        scale:       1
    },
    // Lufthansa
    {
        name:        "EHAM Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   52.30338,  visualLon: 4.764162,
        alt:         -1,        visualAlt: -1,
        heading:     135,
        scale:       1
    },
    // Emirates
    {
        name:        "EHAM Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   52.30714,  visualLon: 4.770275,
        alt:         -1,        visualAlt: -1,
        heading:     285,
        scale:       1
    },
    {
        name:        "EHAM ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        visualLat:   52.304246, visualLon: 4.761828,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM China Eastern",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
        visualLat:   52.303807, visualLon: 4.762278,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM Korean Air",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
        visualLat:   52.303263, visualLon: 4.762847,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
        visualLat:   52.312290, visualLon: 4.762736,
        alt:         -1,        visualAlt: -1,
        heading:     195,
        scale:       1
    },
    {
        name:        "EHAM Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   52.303906, visualLon: 4.763383,
        alt:         -1,        visualAlt: -1,
        heading:     135,
        scale:       1
    },
    {
        name:        "EHAM Austrian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
        visualLat:   52.304600, visualLon: 4.762686,
        alt:         -1,        visualAlt: -1,
        heading:     135,
        scale:       1
    },
    {
        name:        "EHAM Brussels",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Brussels%20Airlines.glb",
        visualLat:   52.305847, visualLon: 4.765111,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   52.304997, visualLon: 4.765740,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   52.306148, visualLon: 4.766098,
        alt:         -1,        visualAlt: -1,
        heading:     135,
        scale:       1
    },
    {
        name:        "EHAM Singapore",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
        visualLat:   52.308031, visualLon: 4.766403,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM EVA Air",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
        visualLat:   52.307953, visualLon: 4.768292,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   52.307179, visualLon: 4.771591,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM ANA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
        visualLat:   52.307166, visualLon: 4.773393,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM TAP",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        visualLat:   52.307776, visualLon: 4.772975,
        alt:         -1,        visualAlt: -1,
        heading:     65,
        scale:       1
    },
    {
        name:        "EHAM British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        visualLat:   52.307135, visualLon: 4.773486,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM American",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   52.309113, visualLon: 4.771762,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
        visualLat:   52.309055, visualLon: 4.773755,
        alt:         -1,        visualAlt: -1,
        heading:     275,
        scale:       1
    },
    {
        name:        "EHAM Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        visualLat:   52.309800, visualLon: 4.773053,
        alt:         -1,        visualAlt: -1,
        heading:     75,
        scale:       1
    },
    {
        name:        "EHAM Iberia",
        model:       " https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        visualLat:   52.309885, visualLon: 4.771610,
        alt:         -1,        visualAlt: -1,
        heading:     75,
        scale:       1
    },
    {
        name:        "EHAM Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   52.309987, visualLon: 4.770164,
        alt:         -1,        visualAlt: -1,
        heading:     75,
        scale:       1
    },
    {
        name:        "EHAM Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   52.309147, visualLon: 4.767235,
        alt:         -1,        visualAlt: -1,
        heading:     75,
        scale:       1
    },
    {
        name:        "EHAM Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
        visualLat:   52.302403, visualLon: 4.758507,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   52.301708, visualLon: 4.759194,
        alt:         -1,        visualAlt: -1,
        heading:     315,
        scale:       1
    },
    {
        name:        "EHAM Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Kenya%20Airways%20B787.glb",
        visualLat:   52.302691, visualLon: 4.759902,
        alt:         -1,        visualAlt: -1,
        heading:     135,
        scale:       1
    },

    // === LTFM (Istanbul Airport: Alt 64.3) ===
    // Turkish
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Turkish%20737.glb",
        visualLat:   41.26752,  visualLon: 28.73618,
        alt:         64.3,      visualAlt: 64.3,
        heading:     90,
        scale:       1
    },
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Turkish%20737.glb",
        visualLat:   41.26695,  visualLon: 28.73485,
        alt:         64.3,      visualAlt: 64.3,
        heading:     0,
        scale:       1
    },
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   41.26749,  visualLon: 28.73445,
        alt:         64.3,      visualAlt: 64.3,
        heading:     89,
        scale:       1
    },
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   41.26479,  visualLon: 28.73565,
        alt:         64.3,      visualAlt: 64.3,
        heading:     312,
        scale:       1
    },
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   41.266,  visualLon: 28.74162,
        alt:         64.3,      visualAlt: 64.3,
        heading:     0,
        scale:       1
    },
    {
        name:        "LTFM Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Turkish%20737.glb",
        visualLat:   41.26641,  visualLon: 28.73732,
        alt:         64.3,      visualAlt: 64.3,
        heading:     180,
        scale:       1
    },
    // American Airlines
    {
        name:        "LTFM American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   41.26401,  visualLon: 28.73777,
        alt:         64.3,      visualAlt: 64.3,
        heading:     135,
        scale:       1
    },
    {
        name:        "LTFM American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   41.26464,  visualLon: 28.74164,
        alt:         64.3,      visualAlt: 64.3,
        heading:     0,
        scale:       1
    },
    {
        name:        "LTFM American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        visualLat:   41.26598,  visualLon: 28.7433,
        alt:         64.3,      visualAlt: 64.3,
        heading:     180,
        scale:       1
    },
    // United
    {
        name:        "LTFM United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   41.26664,  visualLon: 28.74327,
        alt:         64.3,      visualAlt: 64.3,
        heading:     178,
        scale:       1
    },
    {
        name:        "LTFM United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   41.26726,  visualLon: 28.74159,
        alt:         64.3,      visualAlt: 64.3,
        heading:     355,
        scale:       1
    },
    // Air France
    {
        name:        "LTFM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        visualLat:   41.26661,  visualLon: 28.74159,
        alt:         64.3,      visualAlt: 64.3,
        heading:     356,
        scale:       1
    },
    // Lufthansa
    {
        name:        "LTFM Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   41.2673,   visualLon: 28.75001,
        alt:         64.3,      visualAlt: 64.3,
        heading:     181,
        scale:       1
    },
    {
        name:        "LTFM Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   41.26796,  visualLon: 28.74989,
        alt:         64.3,      visualAlt: 64.3,
        heading:     180,
        scale:       1
    },
    // Air China
    {
        name:        "LTFM Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        visualLat:   41.26763,  visualLon: 28.74735,
        alt:         64.3,      visualAlt: 64.3,
        heading:     89,
        scale:       1
    },
    // KLM
    {
        name:        "LTFM KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        visualLat:   41.26763,  visualLon: 28.74822,
        alt:         64.3,      visualAlt: 64.3,
        heading:     87,
        scale:       1
    },
    // SAS
    {
        name:        "LTFM SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        visualLat:   41.26316,  visualLon: 28.73983,
        alt:         64.3,      visualAlt: 64.3,
        heading:     90,
        scale:       1
    },
    // Wizz
    {
        name:        "LTFM Wizz",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
        visualLat:   41.25751,  visualLon: 28.74944,
        alt:         64.3,      visualAlt: 64.3,
        heading:     266,
        scale:       1
    },
    {
        name:        "LTFM Wizz",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
        visualLat:   41.25749,  visualLon: 28.74843,
        alt:         64.3,      visualAlt: 64.3,
        heading:     265,
        scale:       1
    },
    // Air Canada
    {
        name:        "LTFM Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        visualLat:   41.25721,  visualLon: 28.73735,
        alt:         64.23,      visualAlt: 64.23,
        heading:     270,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "LTFM Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   41.25682,  visualLon: 28.73557,
        alt:         64.3,      visualAlt: 64.3,
        heading:     270,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "LTFM Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   41.26061,  visualLon: 28.7363,
        alt:         64.23,      visualAlt: 64.23,
        heading:     20,
        scale:       1
    },
    {
        name:        "LTFM Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
        visualLat:   41.258241, visualLon: 28.735465,
        alt:         64.3,      visualAlt: 64.3,
        heading:     20,
        scale:       1
    },
    {
        name:        "LTFM Aegean",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Aegean%20A320.glb",
        visualLat:   41.263024, visualLon: 28.745164,
        alt:         64.3,      visualAlt: 64.3,
        heading:     90,
        scale:       1
    },
    {
        name:        "LTFM PIA",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/PIA%20777.glb",
        visualLat:   41.259523, visualLon: 28.736109,
        alt:         64.3,      visualAlt: 64.3,
        heading:     20,
        scale:       1
    },
    {
        name:        "LTFM Air India",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
        visualLat:   41.262049, visualLon: 28.736860,
        alt:         64.3,      visualAlt: 64.3,
        heading:     0,
        scale:       1
    },
    {
        name:        "LTFM Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   41.265226, visualLon: 28.747653,
        alt:         64.3,      visualAlt: 64.3,
        heading:     10,
        scale:       1
    },
    {
        name:        "LTFM Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Egyptair%20A321.glb",
        visualLat:   41.263645, visualLon: 28.748742,
        alt:         64.3,      visualAlt: 64.3,
        heading:     190,
        scale:       1
    },

    // === LFPG (Paris Charles de Gaulle Airport: Alt 52.3) ===
    // Lufthansa
    {
        name:        "LFPG Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   49.01481,  visualLon: 2.537671,
        alt:         52.3,      visualAlt: 52.3,
        heading:     60,
        scale:       1
    },
    {
        name:        "LFPG Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        visualLat:   49.01716,  visualLon: 2.541705,
        alt:         52.3,      visualAlt: 52.3,
        heading:     133,
        scale:       1
    },
    // Swiss
    {
        name:        "LFPG Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   49.01639,  visualLon: 2.539034,
        alt:         52.3,      visualAlt: 52.3,
        heading:     105,
        scale:       1
    },
    {
        name:        "LFPG Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        visualLat:   49.01657,  visualLon: 2.544049,
        alt:         52.3,      visualAlt: 52.3,
        heading:     134,
        scale:       1
    },
    // Singapore
    {
        name:        "LFPG Singapore",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
        visualLat:   49.01565,  visualLon: 2.545364,
        alt:         52.3,      visualAlt: 52.3,
        heading:     150,
        scale:       1
    },
    // United
    {
        name:        "LFPG United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   49.01499,  visualLon: 2.545723,
        alt:         52.3,      visualAlt: 52.3,
        heading:     165,
        scale:       1
    },
    {
        name:        "LFPG United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        visualLat:   49.01432,  visualLon: 2.545809,
        alt:         52.3,      visualAlt: 52.3,
        heading:     194,
        scale:       1
    },
    // British Airways
    {
        name:        "LFPG British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        visualLat:   49.00224,  visualLon: 2.568211,
        alt:         52.3,      visualAlt: 52.3,
        heading:     266,
        scale:       1
    },
    {
        name:        "LFPG British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        lat:         49.00232,  lon: 2.568951,
        visualLat:   49.00232,  visualLon: 2.568951,
        alt:         52.3,      visualAlt: 52.3,
        heading:     252,
        scale:       1
    },
    {
        name:        "LFPG British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        lat:         49.00212,  lon: 2.566687,
        visualLat:   49.00212,  visualLon: 2.566687,
        alt:         52.3,      visualAlt: 52.3,
        heading:     282,
        scale:       1
    },
    // Emirates
    {
        name:        "LFPG Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        lat:         49.0018,  lon: 2.562149,
        visualLat:   49.0018,  visualLon: 2.562149,
        alt:         52.3,      visualAlt: 52.3,
        heading:     240,
        scale:       1
    },
    {
        name:        "LFPG Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        lat:         49.00202,  lon: 2.5604,
        visualLat:   49.00202,  visualLon: 2.560577,
        alt:         52.3,      visualAlt: 52.3,
        heading:     300,
        scale:       1
    },
    // Cathay Pacific
    {
        name:        "LFPG Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        lat:         49.00208,  lon: 2.565754,
        visualLat:   49.00208,  visualLon: 2.565754,
        alt:         52.3,      visualAlt: 52.3,
        heading:     298,
        scale:       1
    },
    // Vietnam Airlines
    {
        name:        "LFPG Vietnam Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
        lat:         49.00196,  lon: 2.563581,
        visualLat:   49.00196,  visualLon: 2.5645,
        alt:         52.3,      visualAlt: 52.3,
        heading:     298,
        scale:       1
    },
    // Easyjet
    {
        name:        "LFPG Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         49.00697,  lon: 2.562165,
        visualLat:   49.00697,  visualLon: 2.562165,
        alt:         52.3,      visualAlt: 52.3,
        heading:     261,
        scale:       1
    },
    {
        name:        "LFPG Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         49.00689,  lon: 2.561049,
        visualLat:   49.00689,  visualLon: 2.561049,
        alt:         52.3,      visualAlt: 52.3,
        heading:     261,
        scale:       1
    },
    // Norwegian
    {
        name:        "LFPG Norwegian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Norwegian%20737.glb",
        lat:         49.00727,  lon: 2.567862,
        visualLat:   49.00727,  visualLon: 2.567862,
        alt:         52.3,      visualAlt: 52.3,
        heading:     264,
        scale:       1
    },
    // Air Baltic
    {
        name:        "LFPG Air Baltic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Baltic%20Dash8%20Q400.glb",
        lat:         49.00722,  lon: 2.566172,
        visualLat:   49.00722,  visualLon: 2.566172,
        alt:         52.3,      visualAlt: 52.3,
        heading:     262,
        scale:       1
    },
    // Saudia
    {
        name:        "LFPG Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
        lat:         49.00168,  lon: 2.577396,
        visualLat:   49.00168,  visualLon: 2.577396,
        alt:         52.3,      visualAlt: 52.3,
        heading:     261,
        scale:       1
    },
    {
        name:        "LFPG Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
        lat:         49.00174,  lon: 2.578378,
        visualLat:   49.00174,  visualLon: 2.578378,
        alt:         52.3,      visualAlt: 52.3,
        heading:     266,
        scale:       1
    },
    // Kenya Airways
    {
        name:        "LFPG Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Kenya%20Airways%20B787.glb",
        lat:         49.00176,  lon: 2.580173,
        visualLat:   49.00176,  visualLon: 2.580173,
        alt:         52.3,      visualAlt: 52.3,
        heading:     264,
        scale:       1
    },
    // Bangladesh Airlines
    {
        name:        "LFPG Bangladesh Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
        lat:         49.00141,  lon: 2.574439,
        visualLat:   49.00141,  visualLon: 2.574439,
        alt:         52.3,      visualAlt: 52.3,
        heading:     292,
        scale:       1
    },
    // SAS
    {
        name:        "LFPG SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        lat:         49.00617,  lon: 2.58005,
        visualLat:   49.00617,  visualLon: 2.58005,
        alt:         52.3,      visualAlt: 52.3,
        heading:     201,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "LFPG Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        lat:         49.002714,  lon: 2.581586,
        visualLat:   49.002714,  visualLon: 2.581586,
        alt:         52.3,      visualAlt: 52.3,
        heading:     135,
        scale:       1
    },
    // Malaysia Airlines
    {
        name:        "LFPG Malaysia Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20737.glb",
        lat:         49.00661,  lon: 2.577786,
        visualLat:   49.00661,  visualLon: 2.577786,
        alt:         52.3,      visualAlt: 52.3,
        heading:     45,
        scale:       1
    },
    // Philippines Airlines
    {
        name:        "LFPG Philippines Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
        lat:         49.0072,   lon: 2.577963,
        visualLat:   49.0072,   visualLon: 2.577963,
        alt:         52.3,      visualAlt: 52.3,
        heading:     75,
        scale:       1
    },
    // Ethiopian
    {
        name:        "LFPG Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
        lat:         49.0065,  lon: 2.583987,
        visualLat:   49.0065,  visualLon: 2.583987,
        alt:         52.3,      visualAlt: 52.3,
        heading:     353,
        scale:       1
    },
    {
        name:        "LFPG Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        lat:         49.00688,  lon: 2.585259,
        visualLat:   49.00688,  visualLon: 2.585259,
        alt:         52.3,      visualAlt: 52.3,
        heading:     173,
        scale:       1
    },
    // Air France
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         49.003683,  lon: 2.586184,
        visualLat:   49.003683,  visualLon: 2.586184,
        alt:         52.3,      visualAlt: 52.3,
        heading:     172,
        scale:       1
    },
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         49.002871,  lon: 2.586270,
        visualLat:   49.002871,  visualLon: 2.586270,
        alt:         52.3,      visualAlt: 52.3,
        heading:     173,
        scale:       1
    },
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         49.002080,    lon: 2.586567,
        visualLat:   49.002080,    visualLon: 2.586567,
        alt:         52.3,      visualAlt: 52.3,
        heading:     164,
        scale:       1
    },
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        lat:         49.00266,  lon: 2.590403,
        visualLat:   49.00266,  visualLon: 2.590403,
        alt:         52.3,      visualAlt: 52.3,
        heading:     353,
        scale:       1
    },
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        lat:         49.00396,  lon: 2.59028,
        visualLat:   49.00396,  visualLon: 2.59028,
        alt:         52.3,      visualAlt: 52.3,
        heading:     354,
        scale:       1
    },
    {
        name:        "LFPG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        lat:         49.00309,  lon: 2.591659,
        visualLat:   49.00309,  visualLon: 2.591659,
        alt:         52.3,      visualAlt: 52.3,
        heading:     170,
        scale:       1
    },
    // Austrian
    {
        name:        "LFPG Austrian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
        lat:         49.0023,   lon: 2.59176,
        visualLat:   49.0023,   visualLon: 2.59176,
        alt:         52.3,      visualAlt: 52.3,
        heading:     171,
        scale:       1
    },
    {
    name:        "LFPG Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   49.005032, visualLon: 2.561712,
    alt:         52.3,      visualAlt: 52.3,
    heading:     85,
    scale:       1
},
{
    name:        "LFPG American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   49.005067, visualLon: 2.563192,
    alt:         52.3,      visualAlt: 52.3,
    heading:     105,
    scale:       1
},
{
    name:        "LFPG Jetblue",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
    visualLat:   49.005250, visualLon: 2.565735,
    alt:         52.3,      visualAlt: 52.3,
    heading:     75,
    scale:       1
},
{
    name:        "LFPG Wizz Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
    visualLat:   49.005426, visualLon: 2.567226,
    alt:         52.3,      visualAlt: 52.3,
    heading:     90,
    scale:       1
},
{
    name:        "LFPG Air Algérie",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
    visualLat:   49.005285, visualLon: 2.568814,
    alt:         52.3,      visualAlt: 52.3,
    heading:     110,
    scale:       1
},

    // === EDDF (Frankfurt Airport) ===
    // Lufthansa
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04666,  lon: 8.559263,
        visualLat:   50.04666,  visualLon: 8.559263,
        alt:         49.8,      visualAlt: 49.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04692,  lon: 8.560304,
        visualLat:   50.04692,  visualLon: 8.560304,
        alt:         49.8,      visualAlt: 49.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04779,  lon: 8.563727,
        visualLat:   50.04779,  visualLon: 8.563727,
        alt:         49.8,      visualAlt: 49.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04752,  lon: 8.562589,
        visualLat:   50.04752,  visualLon: 8.562589,
        alt:         49.8,      visualAlt: 49.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04826,  lon: 8.565716,
        visualLat:   50.04826,  visualLon: 8.565716,
        alt:         49.8,      visualAlt: 49.8,
        heading:     250,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04613,  lon: 8.567406,
        visualLat:   50.04613,  visualLon: 8.567406,
        alt:         49.8,      visualAlt: 49.8,
        heading:     205,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04711,  lon: 8.568124,
        visualLat:   50.04711,  visualLon: 8.568124,
        alt:         49.8,      visualAlt: 49.8,
        heading:     205,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04658,  lon: 8.572244,
        visualLat:   50.04658,  visualLon: 8.572244,
        alt:         49.8,      visualAlt: 49.8,
        heading:     204,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04803,  lon: 8.572089,
        visualLat:   50.04803,  visualLon: 8.572089,
        alt:         49.8,      visualAlt: 49.8,
        heading:     25,
        scale:       1
    },
    {
        name:        "EDDF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         50.04899,  lon: 8.569739,
        visualLat:   50.04899,  visualLon: 8.569739,
        alt:         49.8,      visualAlt: 49.8,
        heading:     205,
        scale:       1
    },
    {
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   50.031738, visualLon: 8.573802,
    alt:         49.8,     visualAlt: 49.8,
    heading:     120,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
    visualLat:   50.032014, visualLon: 8.572627,
    alt:         49.8,     visualAlt: 49.8,
    heading:     120,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   50.031521, visualLon: 8.574988,
    alt:         49.8,     visualAlt: 49.8,
    heading:     120,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   50.033917, visualLon: 8.577904,
    alt:         49.8,     visualAlt: 49.8,
    heading:     330,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
    visualLat:   50.032929, visualLon: 8.578555,
    alt:         49.8,     visualAlt: 49.8,
    heading:     330,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
    visualLat:   50.031916, visualLon: 8.581526,
    alt:         49.8,     visualAlt: 49.8,
    heading:     150,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   50.032056, visualLon: 8.583405,
    alt:         49.8,     visualAlt: 49.8,
    heading:     40,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   50.032928, visualLon: 8.584091,
    alt:         49.8,     visualAlt: 49.8,
    heading:     40,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
    visualLat:   50.034571, visualLon: 8.585241,
    alt:         49.8,     visualAlt: 49.8,
    heading:     40,
    scale:       1
},
{
    name:        "EDDF Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   50.034806, visualLon: 8.587700,
    alt:         49.8,     visualAlt: 49.8,
    heading:     200,
    scale:       1
},

    // Condor
    {
        name:        "EDDF Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Condor%20blue%20A321.glb",
        lat:         50.04769,  lon: 8.574846,
        visualLat:   50.04769,  visualLon: 8.574846,
        alt:         49.8,      visualAlt: 49.8,
        heading:     315,
        scale:       1
    },
    {
        name:        "EDDF Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Condor%20Rouge%20A321.glb",
        lat:         50.04741,  lon: 8.575576,
        visualLat:   50.04741,  visualLon: 8.575576,
        alt:         49.8,      visualAlt: 49.8,
        heading:     298,
        scale:       1
    },
    {
        name:        "EDDF Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Condor%20Rouge%20A321.glb",
        lat:         50.04807,  lon: 8.576042,
        visualLat:   50.04807,  visualLon: 8.576042,
        alt:         49.8,      visualAlt: 49.8,
        heading:     118,
        scale:       1
    },
    {
        name:        "EDDF Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-6@main/models/Condor%20A321.glb",
        lat:         50.04837,  lon: 8.575061,
        visualLat:   50.04837,  visualLon: 8.575061,
        alt:         49.8,      visualAlt: 49.8,
        heading:     119,
        scale:       1
    },
    {
        name:        "EDDF Condor",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Condor%20blue%20A321.glb",
        lat:         50.04761,  lon: 8.57704,
        visualLat:   50.04761,  visualLon: 8.57704,
        alt:         49.8,      visualAlt: 49.8,
        heading:     177,
        scale:       1
    },
    // Eurowings
    {
        name:        "EDDF Eurowings",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Eurowings%20A320.glb",
        lat:         50.04955,  lon: 8.577925,
        visualLat:   50.04955,  visualLon: 8.577925,
        alt:         49.8,      visualAlt: 49.8,
        heading:     298,
        scale:       1
    },
    {
        name:        "EDDF Eurowings",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Eurowings%20A320.glb",
        lat:         50.04792,  lon: 8.584261,
        visualLat:   50.04792,  visualLon: 8.584261,
        alt:         49.8,      visualAlt: 49.8,
        heading:     68,
        scale:       1
    },
    // Vietnam Airlines
    {
        name:        "EDDF Vietnam Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
        lat:         50.05016,  lon: 8.584186,
        visualLat:   50.05016,  visualLon: 8.584186,
        alt:         49.8,      visualAlt: 49.8,
        heading:     252,
        scale:       1
    },
    {
        name:        "EDDF Vietnam Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
        lat:         50.05036,  lon: 8.585258,
        visualLat:   50.05036,  visualLon: 8.585258,
        alt:         49.8,      visualAlt: 49.8,
        heading:     253,
        scale:       1
    },
    // Austrian
    {
        name:        "EDDF Austrian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
        lat:         50.0473,   lon: 8.582287,
        visualLat:   50.0473,   visualLon: 8.582287,
        alt:         49.8,      visualAlt: 49.8,
        heading:     68,
        scale:       1
    },
    // United
    {
        name:        "EDDF United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        lat:         50.04805,  lon: 8.585087,
        visualLat:   50.04805,  visualLon: 8.585087,
        alt:         49.8,      visualAlt: 49.8,
        heading:     68,
        scale:       1
    },
    // Emirates
    {
        name:        "EDDF Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        lat:         50.04954,  lon: 8.581664,
        visualLat:   50.04954,  visualLon: 8.581664,
        alt:         49.8,      visualAlt: 49.8,
        heading:     252,
        scale:       1
    },
    // Cathay Pacific
    {
        name:        "EDDF Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        lat:         50.04906,  lon: 8.579792,
        visualLat:   50.04906,  visualLon: 8.579792,
        alt:         49.8,      visualAlt: 49.8,
        heading:     288,
        scale:       1
    },
    // Air Canada
    {
        name:        "EDDF Air Canada",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
        lat:         50.04915,  lon: 8.580607,
        visualLat:   50.04915,  visualLon: 8.580607,
        alt:         49.8,      visualAlt: 49.8,
        heading:     253,
        scale:       1
    },
    // Air France
    {
        name:        "EDDF Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         50.05061,  lon: 8.586331,
        visualLat:   50.05061,  visualLon: 8.586331,
        alt:         49.8,      visualAlt: 49.8,
        heading:     253,
        scale:       1
    },

    // === LEMD (Adolfo Suárez Madrid–Barajas Airport) ===
    // Ryanair
    {
        name:        "LEMD Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         40.47049,  lon: -3.566801,
        visualLat:   40.47049,  visualLon: -3.566801,
        alt:         298.4,     visualAlt: 298.4,
        heading:     150,
        scale:       1
    },
    {
        name:        "LEMD Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         40.47204,  lon: -3.568549,
        visualLat:   40.47204,  visualLon: -3.568549,
        alt:         298.4,     visualAlt: 298.4,
        heading:     151,
        scale:       1
    },
    // Easyjet
    {
        name:        "LEMD Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         40.47082,  lon: -3.567117,
        visualLat:   40.47082,  visualLon: -3.567117,
        alt:         298.4,     visualAlt: 298.4,
        heading:     151,
        scale:       1
    },
    {
        name:        "LEMD Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         40.47112,  lon: -3.567487,
        visualLat:   40.47112,  visualLon: -3.567487,
        alt:         298.4,     visualAlt: 298.4,
        heading:     150,
        scale:       1
    },
    // United
    {
        name:        "LEMD United",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
        lat:         40.4617,   lon: -3.571205,
        visualLat:   40.4617,   visualLon: -3.571205,
        alt:         298.4,     visualAlt: 298.4,
        heading:     313,
        scale:       1
    },
    // Turkish
    {
        name:        "LEMD Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        lat:         40.46179,  lon: -3.570701,
        visualLat:   40.46179,  visualLon: -3.570701,
        alt:         298.4,     visualAlt: 298.4,
        heading:     272,
        scale:       1
    },
    // Aeromexico
    {
        name:        "LEMD Aeromexico",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
        lat:         40.46254,  lon: -3.569789,
        visualLat:   40.46254,  visualLon: -3.569789,
        alt:         298.4,     visualAlt: 298.4,
        heading:     225,
        scale:       1
    },
    // Air France
    {
        name:        "LEMD Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         40.46943,  lon: -3.568276,
        visualLat:   40.46943,  visualLon: -3.568276,
        alt:         298.4,     visualAlt: 298.4,
        heading:     165,
        scale:       1
    },
    // KLM
    {
        name:        "LEMD KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        lat:         40.4686,   lon: -3.567836,
        visualLat:   40.4686,   visualLon: -3.567836,
        alt:         298.4,     visualAlt: 298.4,
        heading:     240,
        scale:       1
    },
    // Swiss
    {
        name:        "LEMD Swiss",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
        lat:         40.46779,  lon: -3.567927,
        visualLat:   40.46779,  visualLon: -3.567927,
        alt:         298.4,     visualAlt: 298.4,
        heading:     240,
        scale:       1
    },
    // Vueling
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.49006,  lon: -3.590039,
        visualLat:   40.49006,  visualLon: -3.590039,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.49045,  lon: -3.590039,
        visualLat:   40.49045,  visualLon: -3.590039,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.49083,  lon: -3.590066,
        visualLat:   40.49083,  visualLon: -3.590066,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.49124,  lon: -3.59005,
        visualLat:   40.49124,  visualLon: -3.59005,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.4935,   lon: -3.590088,
        visualLat:   40.4935,   visualLon: -3.590088,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        lat:         40.48801,  lon: -3.589991,
        visualLat:   40.48801,  visualLon: -3.589991,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    // British Airways
    {
        name:        "LEMD British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        lat:         40.49273,  lon: -3.58997,
        visualLat:   40.49273,  visualLon: -3.58997,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        lat:         40.49447,  lon: -3.589996,
        visualLat:   40.49447,  visualLon: -3.589996,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    {
        name:        "LEMD British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        lat:         40.49553,  lon: -3.59005,
        visualLat:   40.49553,  visualLon: -3.59005,
        alt:         298.4,     visualAlt: 298.4,
        heading:     182,
        scale:       1
    },
    // Iberia
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49742,  lon: -3.568355,
        visualLat:   40.49742,  visualLon: -3.568355,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49669,  lon: -3.568355,
        visualLat:   40.49669,  visualLon: -3.568355,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.4947,   lon: -3.568372,
        visualLat:   40.4947,   visualLon: -3.568372,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49841,  lon: -3.56686,
        visualLat:   40.49841,  visualLon: -3.56686,
        alt:         298.4,     visualAlt: 298.4,
        heading:     180,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49768,  lon: -3.566886,
        visualLat:   40.49768,  visualLon: -3.566886,
        alt:         298.4,     visualAlt: 298.4,
        heading:     180,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49565,  lon: -3.566795,
        visualLat:   40.49565,  visualLon: -3.566795,
        alt:         298.4,     visualAlt: 298.4,
        heading:     180,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.49053,  lon: -3.566774,
        visualLat:   40.49053,  visualLon: -3.566774,
        alt:         298.4,     visualAlt: 298.4,
        heading:     180,
        scale:       1
    },
    {
        name:        "LEMD Iberia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
        lat:         40.48973,  lon: -3.568099,
        visualLat:   40.48973,  visualLon: -3.568099,
        alt:         298.4,     visualAlt: 298.4,
        heading:     300,
        scale:       1
    },
    // American Airlines
    {
        name:        "LEMD American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        lat:         40.49287,  lon: -3.568426,
        visualLat:   40.49287,  visualLon: -3.568426,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    {
        name:        "LEMD American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        lat:         40.49358,  lon: -3.568426,
        visualLat:   40.49358,  visualLon: -3.568426,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "LEMD Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        lat:         40.49542,  lon: -3.568485,
        visualLat:   40.49542,  visualLon: -3.568485,
        alt:         298.4,     visualAlt: 298.4,
        heading:     0,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "LEMD Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        lat:         40.49623,  lon: -3.566731,
        visualLat:   40.49623,  visualLon: -3.566731,
        alt:         298.4,     visualAlt: 298.4,
        heading:     180,
        scale:       1
    },
    // Emirates
    {
        name:        "LEMD Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        lat:         40.49934,  lon: -3.567375,
        visualLat:   40.49934,  visualLon: -3.567375,
        alt:         298.4,     visualAlt: 298.4,
        heading:     115,
        scale:       1
    },
    // Malaysia Airlines
    {
        name:        "LEMD Malaysia Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
        lat:         40.49769,  lon: -3.563904,
        visualLat:   40.49769,  visualLon: -3.563904,
        alt:         298.4,     visualAlt: 298.4,
        heading:     270,
        scale:       1
    },

    // === LIRF (Rome Fiumicino Leonardo da Vinci Airport) ===
    // ITA Airways
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.797948,  lon: 12.256720,
        visualLat:   41.797948,  visualLon: 12.256720,
        alt:         6,         visualAlt: 6,
        heading:     207,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.797261,   lon: 12.256183,
        visualLat:   41.797261,   visualLon: 12.256183,
        alt:         6,         visualAlt: 6,
        heading:     207,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.796790,  lon: 12.254632,
        visualLat:   41.796790,  visualLon: 12.254632,
        alt:         6,         visualAlt: 6,
        heading:     27,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.79826,  lon: 12.25561,
        visualLat:   41.79826,  visualLon: 12.25561,
        alt:         6,         visualAlt: 6,
        heading:     27,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.797485,   lon: 12.255169,
        visualLat:   41.797485,   visualLon: 12.255169,
        alt:         6,         visualAlt: 6,
        heading:     27,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.79706,  lon: 12.24636,
        visualLat:   41.79706,  visualLon: 12.24636,
        alt:         4.8,         visualAlt: 4.8,
        heading:     332,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.79826,  lon: 12.24663,
        visualLat:   41.79826,  visualLon: 12.24663,
        alt:         5,         visualAlt: 5,
        heading:     65,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.7925,   lon: 12.24255,
        visualLat:   41.7925,   visualLon: 12.24255,
        alt:         3.85,         visualAlt: 3.85,
        heading:     332,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.79129,  lon: 12.24323,
        visualLat:   41.79129,  visualLon: 12.24323,
        alt:         3.85,         visualAlt: 3.85,
        heading:     332,
        scale:       1
    },
    {
        name:        "LIRF ITA Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        lat:         41.78613,  lon: 12.244,
        visualLat:   41.78613,  visualLon: 12.244,
        alt:         3.25,         visualAlt: 3.25,
        heading:     344,
        scale:       1
    },
    // Air France
    {
        name:        "LIRF Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         41.78500,  lon: 12.24400,
        visualLat:   41.78500,  visualLon: 12.24400,
        alt:         3.17,         visualAlt: 3.17,
        heading:     344,
        scale:       1
    },
    {
        name:        "LIRF Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         41.79844,  lon: 12.24733,
        visualLat:   41.79844,  visualLon: 12.24733,
        alt:         5.1,         visualAlt: 5.1,
        heading:     115,
        scale:       1
    },
    // Ryanair
    {
        name:        "LIRF Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         41.7963,   lon: 12.26218,
        visualLat:   41.7963,   visualLon: 12.26218,
        alt:         6.2,         visualAlt: 6.2,
        heading:     25,
        scale:       1
    },
    {
        name:        "LIRF Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         41.7955,   lon: 12.26166,
        visualLat:   41.7955,   visualLon: 12.26166,
        alt:         6.2,         visualAlt: 6.2,
        heading:     25,
        scale:       1
    },
    {
        name:        "LIRF Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         41.79505,  lon: 12.26142,
        visualLat:   41.79505,  visualLon: 12.26142,
        alt:         6.2,         visualAlt: 6.2,
        heading:     25,
        scale:       1
    },
    // Easyjet
    {
        name:        "LIRF Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         41.79405,  lon: 12.24687,
        visualLat:   41.79405,  visualLon: 12.24687,
        alt:         4.65,         visualAlt: 4.65,
        heading:     253,
        scale:       1
    },
    // Wizz
    {
        name:        "LIRF Wizz",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
        lat:         41.79417,  lon: 12.24746,
        visualLat:   41.79417,  visualLon: 12.24746,
        alt:         4.65,         visualAlt: 4.65,
        heading:     253,
        scale:       1
    },
    {
        name:        "LIRF Wizz",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
        lat:         41.79393,  lon: 12.24547,
        visualLat:   41.79393,  visualLon: 12.24547,
        alt:         4.45,         visualAlt: 4.45,
        heading:     253,
        scale:       1
    },
    // Cathay Pacific
    {
        name:        "LIRF Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        lat:         41.79189,  lon: 12.24289,
        visualLat:   41.79189,  visualLon: 12.24289,
        alt:         3.85,         visualAlt: 3.85,
        heading:     332,
        scale:       1
    },
    // Lufthansa
    {
        name:        "LIRF Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         41.79658,  lon: 12.25570,
        visualLat:   41.79658,  visualLon: 12.25570,
        alt:         6,         visualAlt: 6,
        heading:     207,
        scale:       1
    },
    {
    name:        "LIRF KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
    visualLat:   41.795391, visualLon: 12.258988,
    alt:         6.3,       visualAlt: 6.3,
    heading:     207,
    scale:       1
},
{
    name:        "LIRF Aeromexico",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
    visualLat:   41.796494, visualLon: 12.259685,
    alt:         6.15,      visualAlt: 6.15,
    heading:     207,
    scale:       1
},
{
    name:        "LIRF Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   41.798223, visualLon: 12.251778,
    alt:         6.0,       visualAlt: 6.0,
    heading:     27,
    scale:       1
},
{
    name:        "LIRF United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   41.799325, visualLon: 12.252465,
    alt:         6.0,       visualAlt: 6.0,
    heading:     27,
    scale:       1
},
{
    name:        "LIRF Brussels",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Brussels%20Airlines.glb",
    visualLat:   41.797511, visualLon: 12.247991,
    alt:         4.8,       visualAlt: 4.8,
    heading:     150,
    scale:       1
},
{
    name:        "LIRF TAP",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
    visualLat:   41.796784, visualLon: 12.248442,
    alt:         4.8,       visualAlt: 4.8,
    heading:     150,
    scale:       1
},
{
    name:        "LIRF Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   41.795937, visualLon: 12.246832,
    alt:         4.65,      visualAlt: 4.65,
    heading:     330,
    scale:       1
},
{
    name:        "LIRF Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   41.796512, visualLon: 12.241114,
    alt:         3.95,      visualAlt: 3.95,
    heading:     80,
    scale:       1
},
{
    name:        "LIRF American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   41.795856, visualLon: 12.240728,
    alt:         3.85,      visualAlt: 3.85,
    heading:     350,
    scale:       1
},
{
    name:        "LIRF Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   41.794865, visualLon: 12.241951,
    alt:         3.85,      visualAlt: 3.85,
    heading:     260,
    scale:       1
},
{
    name:        "LIRF Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   41.796384, visualLon: 12.242863,
    alt:         4.25,      visualAlt: 4.25,
    heading:     150,
    scale:       1
},
    // === UUEE (Sheremetyevo International Airport) ===
    // Aeroflot
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.97713,  lon: 37.41061,
        visualLat:   55.97713,  visualLon: 37.41061,
        alt:         91.9,      visualAlt: 91.9,
        heading:     302,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.9772,   lon: 37.41182,
        visualLat:   55.9772,   visualLon: 37.41182,
        alt:         92.45,      visualAlt: 92.45,
        heading:     255,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.97855,  lon: 37.41199,
        visualLat:   55.97855,  visualLon: 37.41199,
        alt:         92.15,      visualAlt: 92.15,
        heading:     170,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.9781,   lon: 37.41801,
        visualLat:   55.9781,   visualLon: 37.41801,
        alt:         92.35,      visualAlt: 92.35,
        heading:     250,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.97874,  lon: 37.41892,
        visualLat:   55.97874,  visualLon: 37.41892,
        alt:         92.55,      visualAlt: 92.55,
        heading:     170,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.98189,  lon: 37.43201,
        visualLat:   55.98189,  visualLon: 37.43201,
        alt:         91.9,      visualAlt: 91.9,
        heading:     70,
        scale:       1
    },
    {
        name:        "UUEE Aeroflot",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
        lat:         55.981,    lon: 37.43372,
        visualLat:   55.981,    visualLon: 37.43372,
        alt:         91.9,      visualAlt: 91.9,
        heading:     210,
        scale:       1
    },
    // China Eastern
    {
        name:        "UUEE China Southern",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
        lat:         55.98097,  lon: 37.41745,
        visualLat:   55.98097,  visualLon: 37.41745,
        alt:         92.4,      visualAlt: 92.4,
        heading:     171,
        scale:       1
    },
    // Air China
    {
        name:        "UUEE Air China",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
        lat:         55.98118,  lon: 37.42714,
        visualLat:   55.98118,  visualLon: 37.42714,
        alt:         92.35,      visualAlt: 92.35,
        heading:     70,
        scale:       1
    },
    // Qatar Airways
    {
        name:        "UUEE Qatar Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
        lat:         55.98055,  lon: 37.4162,
        visualLat:   55.98055,  visualLon: 37.4162,
        alt:         92.4,      visualAlt: 92.4,
        heading:     349,
        scale:       1
    },
    // Private Yak40
    {
        name:        "UUEE Private Yak40",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Yak40.glb",
        lat:         55.98142,  lon: 37.4246,
        visualLat:   55.98142,  visualLon: 37.4246,
        alt:         92.35,      visualAlt: 92.35,
        heading:     264,
        scale:       1
    },
    {
        name:        "UUEE Private Yak40",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Yak40.glb",
        lat:         55.98161,  lon: 37.42335,
        visualLat:   55.98161,  visualLon: 37.42335,
        alt:         92.35,      visualAlt: 92.35,
        heading:     265,
        scale:       1
    },
    // Private 727
    {
        name:        "UUEE Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        lat:         55.98064,  lon: 37.4315,
        visualLat:   55.98064,  visualLon: 37.4315,
        alt:         92.08,      visualAlt: 92.08,
        heading:     290,
        scale:       1
    },

    // === LPPT (Humberto Delgado Airport / Lisbon Airport) ===
    // TAP Air Portugal
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.7767,  lon: -9.131843,
        visualLat:   38.7767,  visualLon: -9.131843,
        alt:         55.5,      visualAlt: 55.5,
        heading:     350,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.77555,  lon: -9.131451,
        visualLat:   38.77555,  visualLon: -9.131451,
        alt:         56.4,      visualAlt: 56.4,
        heading:     350,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.77435,  lon: -9.131151,
        visualLat:   38.77435,  visualLon: -9.131151,
        alt:         57.3,      visualAlt: 57.3,
        heading:     350,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.77378,  lon: -9.131108,
        visualLat:   38.77378,  visualLon: -9.131108,
        alt:         57.8,      visualAlt: 57.8,
        heading:     350,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.77009,  lon: -9.136494,
        visualLat:   38.77009,  visualLon: -9.136494,
        alt:         59.15,      visualAlt: 59.15,
        heading:     170,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.76715,  lon: -9.1357,
        visualLat:   38.76715,  visualLon: -9.1357,
        alt:         59.15,      visualAlt: 59.15,
        heading:     170,
        scale:       1
    },
    {
        name:        "LPPT TAP Air Portugal",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
        lat:         38.76788,  lon: -9.136671,
        visualLat:   38.76788,  visualLon: -9.136671,
        alt:         59.15,      visualAlt: 59.15,
        heading:     350,
        scale:       1
    },
    // Lufthansa
    {
        name:        "LPPT Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         38.76941,  lon: -9.130469,
        visualLat:   38.76941,  visualLon: -9.130469,
        alt:         59.15,      visualAlt: 59.15,
        heading:     350,
        scale:       1
    },
    // Easyjet
    {
        name:        "LPPT Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         38.76647,  lon: -9.130045,
        visualLat:   38.76647,  visualLon: -9.130045,
        alt:         59.15,      visualAlt: 59.15,
        heading:     350,
        scale:       1
    },
    {
        name:        "LPPT Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         38.76676,  lon: -9.130131,
        visualLat:   38.76676,  visualLon: -9.130131,
        alt:         59.15,      visualAlt: 59.15,
        heading:     30,
        scale:       1
    },
    {
        name:        "LPPT Easyjet",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
        lat:         38.7803,   lon: -9.129294,
        visualLat:   38.7803,   visualLon: -9.129294,
        alt:         49.45,      visualAlt: 49.45,
        heading:     218,
        scale:       1
    },
    // British Airways
    {
        name:        "LPPT British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/British%20Airways%20A321.glb",
        lat:         38.76945,  lon: -9.137196,
        visualLat:   38.76945,  visualLon: -9.137196,
        alt:         59.15,      visualAlt: 59.15,
        heading:     350,
        scale:       1
    },
    // Wizz
    {
        name:        "LPPT Wizz",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
        lat:         38.76785,  lon: -9.139271,
        visualLat:   38.76785,  visualLon: -9.139271,
        alt:         59.15,      visualAlt: 59.15,
        heading:     352,
        scale:       1
    },
    // Ryanair
    {
        name:        "LPPT Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         38.76883,  lon: -9.136005,
        visualLat:   38.76883,  visualLon: -9.136005,
        alt:         59.15,      visualAlt: 59.15,
        heading:     170,
        scale:       1
    },
    {
        name:        "LPPT Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         38.76778,  lon: -9.135775,
        visualLat:   38.76778,  visualLon: -9.135775,
        alt:         59.15,      visualAlt: 59.15,
        heading:     170,
        scale:       1
    },

    // === EIDW (Dublin Airport) ===
    // Ryanair
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.4302,   lon: -6.248763,
        visualLat:   53.4302,   visualLon: -6.248763,
        alt:         28.4,        visualAlt: 28.4,
        heading:     276,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43026,  lon: -6.249423,
        visualLat:   53.43026,  visualLon: -6.249423,
        alt:         28.55,        visualAlt: 28.55,
        heading:     276,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43028,  lon: -6.250072,
        visualLat:   53.43028,  visualLon: -6.250072,
        alt:         28.6,        visualAlt: 28.6,
        heading:     276,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43013,  lon: -6.247459,
        visualLat:   53.43013,  visualLon: -6.247459,
        alt:         28,        visualAlt: 28,
        heading:     276,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43086,  lon: -6.247669,
        visualLat:   53.43086,  visualLon: -6.247669,
        alt:         28.2,        visualAlt: 28.2,
        heading:     96,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.4309,   lon: -6.248312,
        visualLat:   53.4309,   visualLon: -6.248312,
        alt:         28.2,        visualAlt: 28.2,
        heading:     96,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43093,  lon: -6.248961,
        visualLat:   53.43093,  visualLon: -6.248961,
        alt:         28.4,        visualAlt: 28.4,
        heading:     96,
        scale:       1
    },
    {
        name:        "EIDW Ryanair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
        lat:         53.43075,  lon: -6.24636,
        visualLat:   53.43075,  visualLon: -6.24636,
        alt:         28,        visualAlt: 28,
        heading:     96,
        scale:       1
    },
    // Vietnam Airlines
    {
        name:        "EIDW Vietnam Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
        lat:         53.42576,  lon: -6.246563,
        visualLat:   53.42576,  visualLon: -6.246563,
        alt:         28,        visualAlt: 28,
        heading:     335,
        scale:       1
    },
    // Lufthansa
    {
        name:        "EIDW Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
        lat:         53.42653,  lon: -6.246891,
        visualLat:   53.42653,  visualLon: -6.246891,
        alt:         28,        visualAlt: 28,
        heading:     53,
        scale:       1
    },
    // SAS
    {
        name:        "EIDW SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        lat:         53.43114,  lon: -6.250903,
        visualLat:   53.43114,  visualLon: -6.250903,
        alt:         29,        visualAlt: 29,
        heading:     96,
        scale:       1
    },
    {
        name:        "EIDW SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        lat:         53.43143,  lon: -6.25152,
        visualLat:   53.43143,  visualLon: -6.25152,
        alt:         29,        visualAlt: 29,
        heading:     96,
        scale:       1
    },
    {
        name:        "EIDW SAS",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
        lat:         53.42886,  lon: -6.250909,
        visualLat:   53.42886,  visualLon: -6.250909,
        alt:         28.9,        visualAlt: 28.9,
        heading:     240,
        scale:       1
    },
    // KLM
    {
        name:        "EIDW KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/KLM%20737.glb",
        lat:         53.42855,  lon: -6.248001,
        visualLat:   53.42855,  visualLon: -6.248001,
        alt:         28.25,        visualAlt: 28.25,
        heading:     45,
        scale:       1
    },
    // Air France
    {
        name:        "EIDW Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-33@main/models/Air%20France%20A220.glb",
        lat:         53.42589,  lon: -6.245265,
        visualLat:   53.42589,  visualLon: -6.245265,
        alt:         28,        visualAlt: 28,
        heading:     273,
        scale:       1
    },
    // Air Baltic
    {
        name:        "EIDW Air Baltic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Baltic%20Dash8%20Q400.glb",
        lat:         53.4276,   lon: -6.248173,
        visualLat:   53.4276,   visualLon: -6.248173,
        alt:         28.2,        visualAlt: 28.2,
        heading:     267,
        scale:       1
    },
    {
        name:        "EIDW Air Baltic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Baltic%20Dash8%20Q400.glb",
        lat:         53.43122,  lon: -6.243795,
        visualLat:   53.43122,  visualLon: -6.243795,
        alt:         27.2,        visualAlt: 27.2,
        heading:     48,
        scale:       1
    },
    {
        name:        "EIDW Air Baltic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Baltic%20Dash8%20Q400.glb",
        lat:         53.43118,  lon: -6.243087,
        visualLat:   53.43118,  visualLon: -6.243087,
        alt:         27.2,        visualAlt: 27.2,
        heading:     47,
        scale:       1
    },
    // Aer Lingus
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42485,  lon: -6.242481,
        visualLat:   53.42485,  visualLon: -6.242481,
        alt:         27,        visualAlt: 27,
        heading:     42,
        scale:       1
    },
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42402,  lon: -6.244192,
        visualLat:   53.42402,  visualLon: -6.244192,
        alt:         27.4,    visualAlt: 27.4,
        heading:     42,
        scale:       1
    },
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42321,  lon: -6.245281,
        visualLat:   53.42321,  visualLon: -6.245281,
        alt:         27.8,      visualAlt: 27.8,
        heading:     42,
        scale:       1
    },
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42317,  lon: -6.24342,
        visualLat:   53.42317,  visualLon: -6.24342,
        alt:         27.25,     visualAlt: 27.25,
        heading:     230,
        scale:       1
    },
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42419,  lon: -6.241677,
        visualLat:   53.42419,  visualLon: -6.241677,
        alt:         27,        visualAlt: 27,
        heading:     230,
        scale:       1
    },
    {
        name:        "EIDW Aer Lingus",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aer%20Lingus%20A320.glb",
        lat:         53.42475,  lon: -6.240448,
        visualLat:   53.42475,  visualLon: -6.240448,
        alt:         26.7,     visualAlt: 26.7,
        heading:     250,
        scale:       1
    },
    // American Airlines
    {
        name:        "EIDW American Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
        lat:         53.42364,  lon: -6.242631,
        visualLat:   53.42364,  visualLon: -6.242631,
        alt:         27,        visualAlt: 27,
        heading:     230,
        scale:       1
    },
    // Private 727
    {
        name:        "EIDW Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        lat:         53.43063,  lon: -6.237932,
        visualLat:   53.43063,  visualLon: -6.237932,
        alt:         26.7,        visualAlt: 26.7,
        heading:     147,
        scale:       1
    },
    // === HECA === (Elevation: 43.5m)
    // Egyptair
    {
        name:        "HECA Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Egyptair%20A321.glb",
        visualLat:   30.108062,  visualLon: 31.396566,
        alt:         43.3,       visualAlt: 43.3,
        heading:     164,
        scale:       1
    },
    {
        name:        "HECA Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Egyptair%20A321.glb",
        visualLat:   30.108641,  visualLon: 31.398728,
        alt:         43.3,       visualAlt: 43.3,
        heading:     342,
        scale:       1
    },
    {
        name:        "HECA Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
        visualLat:   30.108692,  visualLon: 31.396395,
        alt:         43.3,       visualAlt: 43.3,
        heading:     164,
        scale:       1
    },
    {
        name:        "HECA Egyptair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
        visualLat:   30.109885,  visualLon: 31.398299,
        alt:         43.3,       visualAlt: 43.3,
        heading:     342,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "HECA Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   30.114070,  visualLon: 31.400338,
        alt:         43.4,       visualAlt: 43.4,
        heading:     193,
        scale:       1
    },
    {
        name:        "HECA Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   30.112400,  visualLon: 31.401239,
        alt:         43.4,       visualAlt: 43.4,
        heading:     124,
        scale:       1
    },
    // Ethiopian
    {
        name:        "HECA Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   30.111964,  visualLon: 31.402875,
        alt:         43.4,       visualAlt: 43.4,
        heading:     105,
        scale:       1
    },
    {
        name:        "HECA Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   30.113146,  visualLon: 31.400692,
        alt:         43.4,       visualAlt: 43.4,
        heading:     146,
        scale:       1
    },
    // Saudia
    {
        name:        "HECA Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb ",
        visualLat:   30.111309,  visualLon: 31.400949,
        alt:         43.5,       visualAlt: 43.5,
        heading:     287,
        scale:       1
    },
    {
        name:        "HECA Saudia",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb ",
        visualLat:   30.111156,  visualLon: 31.401684,
        alt:         43.5,       visualAlt: 43.5,
        heading:     288,
        scale:       1
    },
    // Qatar
    {
        name:        "HECA Qatar",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   30.111036,  visualLon: 31.402408,
        alt:         43.5,       visualAlt: 43.5,
        heading:     287,
        scale:       1
    },
    {
        name:        "HECA Qatar",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   30.110553,  visualLon: 31.404329,
        alt:         43.5,       visualAlt: 43.5,
        heading:     286,
        scale:       1
    },
    {
    name:        "HECA Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   30.108936, visualLon: 31.395101,
    alt:         43.1,      visualAlt: 43.1,
    heading:     344,
    scale:       1
},
{
    name:        "HECA Aegean",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Aegean%20A320.glb",
    visualLat:   30.107813, visualLon: 31.395412,
    alt:         43.1,      visualAlt: 43.1,
    heading:     344,
    scale:       1
},
{
    name:        "HECA ITA Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
    visualLat:   30.106905, visualLon: 31.395755,
    alt:         43.1,      visualAlt: 43.1,
    heading:     344,
    scale:       1
},
{
    name:        "HECA Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   30.108336, visualLon: 31.400129,
    alt:         43.4,      visualAlt: 43.4,
    heading:     164,
    scale:       1
},
{
    name:        "HECA British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   30.109598, visualLon: 31.400483,
    alt:         43.4,      visualAlt: 43.4,
    heading:     164,
    scale:       1
},

    // === FAOR === (Elevation: 834.4m)
    // Emirates
     {
        name:        "FAOR Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   -26.126938, visualLon: 28.234955,
        alt:         833.7,   visualAlt: 833.7,
        heading:     273,
        scale:       1
    },
    {
        name:        "FAOR Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   -26.129205, visualLon: 28.233963,
        alt:         835.2,      visualAlt: 835.2,
        heading:     93,
        scale:       1
    },
    {
        name:        "FAOR Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   -26.129472, visualLon: 28.236495,
        alt:         833.8,    visualAlt: 833.8,
        heading:     93,
        scale:       1
    },
    // British Airways
    {
        name:        "FAOR British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   -26.130020, visualLon: 28.234714,
        alt:         834.3,      visualAlt: 834.3,
        heading:     273,
        scale:       1
    },
    // South African
    {
        name:        "FAOR South African",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/South%20African%20A340.glb",
        visualLat:   -26.130922, visualLon: 28.233008,
        alt:         836.35,      visualAlt: 836.35,
        heading:     186,
        scale:       1
    },
    {
        name:        "FAOR South African",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/South%20African%20A340.glb",
        visualLat:   -26.133459, visualLon: 28.232804,
        alt:         836.35,      visualAlt: 836.35,
        heading:     186,
        scale:       1
    },
    {
        name:        "FAOR South African",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/South%20African%20A340.glb",
        visualLat:   -26.134749, visualLon: 28.232638,
        alt:         836.35,      visualAlt: 836.35,
        heading:     186,
        scale:       1
    },
    {
        name:        "FAOR South African",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/South%20African%20A340.glb",
        visualLat:   -26.136575, visualLon: 28.229414,
        alt:         836.35,      visualAlt: 836.35,
        heading:     264,
        scale:       1
    },
    // Cathay Pacific
    {
        name:        "FAOR Cathay Pacific",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
        visualLat:   -26.130095, visualLon: 28.236098,
        alt:         833.8,    visualAlt: 833.8,
        heading:     273,
        scale:       1
    },
    // Virgin Atlantic
    {
        name:        "FAOR Virgin Atlantic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
        visualLat:   -26.130009, visualLon: 28.233389,
        alt:         836,      visualAlt: 836,
        heading:     239,
        scale:       1
    },
    // === HAAB === (Elevation: 1160m)
    // Ethiopian Airlines
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
        visualLat:   8.983582,   visualLon: 38.799694,
        alt:         1159.9,     visualAlt: 1159.9,
        heading:     254,
        scale:       1
    },
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
        visualLat:   8.983163,   visualLon: 38.798423,
        alt:         1160,       visualAlt: 1160,
        heading:     253,
        scale:       1
    },
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   8.982893,   visualLon: 38.797779,
        alt:         1160.15,    visualAlt: 1160.15,
        heading:     255,
        scale:       1
    },
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   8.982729,   visualLon: 38.797151,
        alt:         1160.2,       visualAlt: 1160.2,
        heading:     254,
        scale:       1
    },
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   8.982533,   visualLon: 38.796529,
        alt:         1160.3,       visualAlt: 1160.3,
        heading:     253,
        scale:       1
    },
    {
        name:        "HAAB Ethiopian Airlines",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   8.983879,   visualLon: 38.800944,
        alt:         1159.8,     visualAlt: 1159.8,
        heading:     255,
        scale:       1
    },
    // Kenya Airways
    {
        name:        "HAAB Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   8.978930,   visualLon: 38.784282,
        alt:         1159.8,     visualAlt: 1159.8,
        heading:     258,
        scale:       1
    },
    {
        name:        "HAAB Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   8.978755,   visualLon: 38.783649,
        alt:         1159.8,     visualAlt: 1159.8,
        heading:     258,
        scale:       1
    },
    // Lufthansa
    {
        name:        "HAAB Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   8.980833,   visualLon: 38.796170,
        alt:         1160,       visualAlt: 1160,
        heading:     284,
        scale:       1
    },
    // Emirates
    {
        name:        "HAAB Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
        visualLat:   8.981261,   visualLon: 38.792731,
        alt:         1161.4,       visualAlt: 1161.4,
        heading:     254,
        scale:       1
    },
    // Private 727
    {
        name:        "HAAB Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   8.980122,   visualLon: 38.789131,
        alt:         1160.15,    visualAlt: 1160.15,
        heading:     253,
        scale:       1
    },
    {
        name:        "HAAB Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   8.980466,   visualLon: 38.790397,
        alt:         1160.55,      visualAlt: 1160.55,
        heading:     256,
        scale:       1
    },

    // === GMMN === (Elevation: 97.9m)
    // Royal Air Maroc
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   33.368080,  visualLon: -7.580447,
        alt:         97.8,       visualAlt: 97.8,
        heading:     343,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   33.371054,  visualLon:  -7.581426,
        alt:         97.6,       visualAlt: 97.6,
        heading:     343,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   33.373345,  visualLon: -7.582241,
        alt:         97.4,       visualAlt: 97.4,
        heading:     343,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   33.371888,  visualLon: -7.581710,
        alt:         97.4,       visualAlt: 97.4,
        heading:     343,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   33.367378,  visualLon: -7.581907,
        alt:         98.15,      visualAlt: 98.15,
        heading:     30,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   33.368287,  visualLon: -7.582261,
        alt:         97.8,       visualAlt: 97.8,
        heading:     30,
        scale:       1
    },
    {
        name:        "GMMN Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
        visualLat:   33.374733,  visualLon: -7.584551,
        alt:         97,       visualAlt: 97,
        heading:     30,
        scale:       1
    },
    // Private 727
    {
        name:        "GMMN Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   33.371513,  visualLon: -7.583537,
        alt:         97.4,       visualAlt: 97.4,
        heading:     31,
        scale:       1
    },
    // Air France
    {
        name:        "GMMN Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   33.376001,  visualLon: -7.583087,
        alt:         97,       visualAlt: 97,
        heading:     31,
        scale:       1
    },
    // Qatar
    {
        name:        "GMMN Qatar",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   33.374035,  visualLon: -7.582486,
        alt:         97.2,       visualAlt: 97.2,
        heading:     343,
        scale:       1
    },

    // === DAAG === (Elevation: 7.7m)
    // Air Algérie
    {
        name:        "DAAG Air Algérie",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
        visualLat:   36.696990,  visualLon: 3.201121,
        alt:         7.7,        visualAlt: 7.7,
        heading:     0,
        scale:       1
    },
    {
        name:        "DAAG Air Algérie",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
        visualLat:   36.696263,  visualLon: 3.201067,
        alt:         7.7,        visualAlt: 7.7,
        heading:     0,
        scale:       1
    },
    {
        name:        "DAAG Air Algérie",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
        visualLat:   36.698155,  visualLon: 3.201502,
        alt:         7.7,        visualAlt: 7.7,
        heading:     356,
        scale:       1
    },
    // Ita Airways
      {
        name:        "DAAG Ita Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        visualLat:   36.695648,  visualLon: 3.201899,
        alt:         7.9,        visualAlt: 7.9,
        heading:     321,
        scale:       1
    },
    {
        name:        "DAAG Ita Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
        visualLat:   36.695002,  visualLon: 3.205911,
        alt:         7.9,        visualAlt: 7.9,
        heading:     270,
        scale:       1
    },
   // Lufthansa
    {
        name:        "DAAG Lufthansa",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
        visualLat:   36.697609,  visualLon: 3.202650,
        alt:         7.75,      visualAlt: 7.75,
        heading:     180,
        scale:       1
    },
    // Vueling
    {
        name:        "DAAG Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        visualLat:   36.697175,  visualLon: 3.202548,
        alt:         7.7,        visualAlt: 7.7,
        heading:     185,
        scale:       1
    },
    {
        name:        "DAAG Vueling",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
        visualLat:   36.696457,  visualLon: 3.202585,
        alt:         7.7,        visualAlt: 7.7,
        heading:     183,
        scale:       1
    },
    // Turkish
    {
        name:        "DAAG Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
        visualLat:   36.698085,  visualLon: 3.204366,
        alt:         7.7,        visualAlt: 7.7,
        heading:     7,
        scale:       1
    },
    {
        name:        "DAAG Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   36.697235,  visualLon: 3.206019,
        alt:         7.9,        visualAlt: 7.9,
        heading:     257,
        scale:       1
    },
    {
        name:        "DAAG Qatar",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
        visualLat:   36.697278,  visualLon: 3.208277,
        alt:         8.3,        visualAlt: 8.3,
        heading:     250,
        scale:       1
    },

    // === HKJK === (Elevation: 807.35m)
    // Kenya Airways
    {
        name:        "HKJK Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   -1.329569,  visualLon: 36.927190,
        alt:         807.7,     visualAlt: 807.7,
        heading:     160,
        scale:       1
    },
    {
        name:        "HKJK Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Kenya%20Airways%20B787.glb",
        visualLat:   -1.330351,  visualLon: 36.927378,
        alt:         807.7,     visualAlt: 807.7,
        heading:     180,
        scale:       1
    },
    {
        name:        "HKJK Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   -1.328712,  visualLon: 36.925538,
        alt:         807.7,     visualAlt: 807.7,
        heading:     110,
        scale:       1
    },
    {
        name:        "HKJK Kenya Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   -1.328840,  visualLon: 36.924229,
        alt:         807.7,     visualAlt: 807.7,
        heading:     65,
        scale:       1
    },
    // Qatar
    {
        name:        "HKJK Qatar",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
        visualLat:   -1.329618,  visualLon: 36.923580,
        alt:         807.85,  visualAlt: 807.85,
        heading:     35,
        scale:       1
    },
    // KLM
    {
        name:        "HKJK KLM",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
        visualLat:   -1.331515,  visualLon: 36.923569,
        alt:         808,     visualAlt: 808,
        heading:     323,
        scale:       1
    },
    // Private G6000
    {
        name:        "HKJK Private G6000",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
        visualLat:   -1.327290,  visualLon: 36.925372,
        alt:         807.45,     visualAlt: 807.45,
        heading:     97,
        scale:       1
    },
    {
        name:        "HKJK Private G6000",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
        visualLat:   -1.328003,  visualLon: 36.927002,
        alt:         807.45,     visualAlt: 807.45,
        heading:     128,
        scale:       1
    },
    // Private 727
    {
        name:        "HKJK Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   -1.327365,  visualLon: 36.925731,
        alt:         807.4,   visualAlt: 807.4,
        heading:     102,
        scale:       1
    },
    {
        name:        "HKJK Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   -1.329327,  visualLon: 36.921348,
        alt:         807.75,     visualAlt: 807.75,
        heading:     188,
        scale:       1
    },
    {
        name:        "HKJK Indigo",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
        visualLat:   -1.333180,  visualLon: 36.924611,
        alt:         808.05,     visualAlt: 808.05,
        heading:     210,
        scale:       1
    },
{
        name:        "HKJK Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   -1.332580,  visualLon: 36.923860,
        alt:         808.35,     visualAlt: 808.35,
        heading:     9,
        scale:       1
    },


    // === DNMM === (Elevation: 14.7m)
    // British Airways
    {
        name:        "DNMM British Airways",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
        visualLat:   6.578908,   visualLon: 3.319851,
        alt:         13.2,       visualAlt: 13.2,
        heading:     339,
        scale:       1
    },
    // Virgin Atlantic
    {
        name:        "DNMM Virgin Atlantic",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
        visualLat:   6.580155,   visualLon: 3.319299,
        alt:         13,       visualAlt: 13,
        heading:     339,
        scale:       1
    },
    // Air France
    {
        name:        "DNMM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   6.580927,   visualLon: 3.319058,
        alt:         13,       visualAlt: 13,
        heading:     338,
        scale:       1
    },
    {
        name:        "DNMM Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   6.581300,   visualLon: 3.319728,
        alt:         13.3,       visualAlt: 13.3,
        heading:     159,
        scale:       1
    },
    // Ethiopian
    {
        name:        "DNMM Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   6.580672,   visualLon: 3.319927,
        alt:         13.5,       visualAlt: 13.5,
        heading:     159,
        scale:       1
    },
    {
        name:        "DNMM Ethiopian",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Ethiopian%20A350.glb",
        visualLat:   6.579617,   visualLon: 3.320318,
        alt:         13.5,       visualAlt: 13.5,
        heading:     159,
        scale:       1
    },
    // Kenya
    {
        name:        "DNMM Kenya",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   6.579084,   visualLon: 3.321799,
        alt:         14,       visualAlt: 14,
        heading:     13,
        scale:       1
    },
    {
        name:        "DNMM Kenya",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Kenya%20airways%20B737.glb",
        visualLat:   6.580075,   visualLon: 3.322196,
        alt:         14,       visualAlt: 14,
        heading:     12,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "DNMM Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   6.579218,   visualLon: 3.322565,
        alt:         14.3,       visualAlt: 14.3,
        heading:     195,
        scale:       1
    },
    // Private 727
    {
        name:        "DNMM Private 727",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
        visualLat:   6.576393,   visualLon: 3.323730,
        alt:         14.7,       visualAlt: 14.7,
        heading:     255,
        scale:       1
    },

    // === DTTA === (Elevation: 2.47m)
    // Tunisair
    {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.843659,  visualLon: 10.218386,
        alt:         2.2,       visualAlt: 2.2,
        heading:     198,
        scale:       1
    },
    {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.843187,  visualLon: 10.218241,
        alt:         2.2,       visualAlt: 2.2,
        heading:     198,
        scale:       1
    },
    {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.842749,  visualLon: 10.218198,
        alt:         2.2,       visualAlt: 2.2,
        heading:     198,
        scale:       1
    },
    {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.842976,  visualLon: 10.220623,
        alt:         2.2,       visualAlt: 2.2,
        heading:     18,
        scale:       1
    },
    {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.842500,  visualLon: 10.220467,
        alt:         2.2,       visualAlt: 2.2,
        heading:     17,
        scale:       1
    },
  {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.842736,  visualLon: 10.233401,
        alt:         1.42,       visualAlt: 1.42,
        heading:     46,
        scale:       1
    }, {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.843204,  visualLon: 10.233631,
        alt:         1.42,       visualAlt: 1.42,
        heading:     48,
        scale:       1
    }, {
        name:        "DTTA Tunisair",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Tunisair%20A320.glb",
        visualLat:   36.843435,  visualLon: 10.237505,
        alt:         1.42,       visualAlt: 1.42,
        heading:     52,
        scale:       1
    },
    // Air France
    {
        name:        "DTTA Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   36.846315,  visualLon: 10.219432,
        alt:         2.47,       visualAlt: 2.47,
        heading:     110,
        scale:       1
    },
    {
        name:        "DTTA Air France",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
        visualLat:   36.845933,  visualLon: 10.219829,
        alt:         2.47,       visualAlt: 2.47,
        heading:     164,
        scale:       1
    },
    // Emirates
    {
        name:        "DTTA Emirates",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
        visualLat:   36.845440,  visualLon: 10.218450,
        alt:         2.47,       visualAlt: 2.47,
        heading:     313,
        scale:       1
    },
    // Turkish
    {
        name:        "DTTA Turkish",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Turkish%20737.glb",
        visualLat:   36.845363,  visualLon: 10.218810,
        alt:         2.47,       visualAlt: 2.47,
        heading:     265,
        scale:       1
    },
    // Royal Air Maroc
    {
        name:        "DTTA Royal Air Maroc",
        model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Royal%20Air%20Maroc%20787.glb",
        visualLat:   36.845500,  visualLon: 10.219464,
        alt:         2.47,       visualAlt: 2.47,
        heading:     232,
        scale:       1
    },
    {
    name:        "OMDB Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   25.25957,  visualLon: 55.34065,
    alt:         1.05,      visualAlt: 1.05,
    heading:     35,
    scale:       1
},
{
    name:        "OMDB Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   25.258369,  visualLon: 55.345603,
    alt:         1.05,      visualAlt: 1.05,
    heading:     123,
    scale:       1
},
{
    name:        "OMDB Air India 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   25.255802,  visualLon: 55.348376,
    alt:         1.25,      visualAlt: 1.25,
    heading:     213,
    scale:       1
},
{
    name:        "OMDB Singapore Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Singapore%20A321.glb",
    visualLat:   25.257427,  visualLon: 55.347566,
    alt:         1.05,      visualAlt: 1.05,
    heading:     125,
    scale:       1
},
{
    name:        "OMDB Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.257985,  visualLon: 55.346268,
    alt:         1.05,      visualAlt: 1.05,
    heading:     123,
    scale:       1
},
{
    name:        "OMDB Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   25.259197,  visualLon: 55.344188,
    alt:         1.05,      visualAlt: 1.05,
    heading:     123,
    scale:       1
},
{
    name:        "OMDB Philippines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   25.257718,  visualLon: 55.346869,
    alt:         1.05,      visualAlt: 1.05,
    heading:     123,
    scale:       1
},
{
    name:        "OMDB Emirates 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.24224,  visualLon: 55.37265,
    alt:         2.75,      visualAlt: 2.75,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.242746,  visualLon: 55.371030,
    alt:         1.75,      visualAlt: 1.75,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.2414,   visualLon: 55.37417,
    alt:         2.75,      visualAlt: 2.75,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.24436,  visualLon: 55.36896,
    alt:         1.25,      visualAlt: 1.25,
    heading:     340,
    scale:       1
},
{
    name:        "OMDB Emirates 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.24502,  visualLon: 55.3703,
    alt:         1.2,      visualAlt: 1.2,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.24452,  visualLon: 55.37123,
    alt:         1.65,      visualAlt: 1.65,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.24408,  visualLon: 55.37198,
    alt:         1.65,      visualAlt: 1.65,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.24284,  visualLon: 55.37424,
    alt:         1.15,      visualAlt: 1.15,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.2456,   visualLon: 55.36557,
    alt:         1.05,      visualAlt: 1.05,
    heading:     280,
    scale:       1
},
{
    name:        "OMDB Emirates 10",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.246923,  visualLon: 55.362941,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 11",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.249227,   visualLon: 55.358891,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 12",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.24979,  visualLon: 55.35785,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 13",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25107,  visualLon: 55.35575,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 14",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25194,  visualLon: 55.35419,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 15",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25277,  visualLon: 55.35275,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 16",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25233,  visualLon: 55.35341,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 17",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25416,  visualLon: 55.35031,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Emirates 18",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.25468,  visualLon: 55.35189,
    alt:         1.05,      visualAlt: 1.05,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 19",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.24937,  visualLon: 55.36128,
    alt:         1.05,      visualAlt: 1.05,
    heading:     118,
    scale:       1
},
{
    name:        "OMDB Emirates 20",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.24686,  visualLon: 55.36606,
    alt:         1.05,      visualAlt: 1.05,
    heading:     167,
    scale:       1
},
{
    name:        "OMDB Emirates 21",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   25.25544,  visualLon: 55.3748,
    alt:         1.05,      visualAlt: 1.05,
    heading:     303,
    scale:       1
},
{
    name:        "OMDB Bombardier G6000 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25781,  visualLon: 55.37064,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Bombardier G6000 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25798,  visualLon: 55.37028,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Bombardier G6000 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25719,  visualLon: 55.37117,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "OMDB Private 727",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   25.25622,  visualLon: 55.37257,
    alt:         1.05,      visualAlt: 1.05,
    heading:     298,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   35.550146,  visualLon: 139.782149,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     330,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   35.550831,   visualLon: 139.781414,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     298,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   35.546571,   visualLon: 139.784847,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     330,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   35.55194,  visualLon: 139.7802,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     60,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   35.551310,  visualLon: 139.780373,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     341,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   35.54967,  visualLon: 139.7824,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     330,
    scale:       1
},
{
    name:        "RJTT Japan Airlines 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   35.545318,  visualLon: 139.784681,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     350,
    scale:       1
},
{
    name:        "RJTT ANA 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/ANA%20A320.glb",
    visualLat:   35.54928,  visualLon: 139.7925,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     55,
    scale:       1
},
{
    name:        "RJTT ANA 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/ANA%20A320.glb",
    visualLat:   35.54985,  visualLon: 139.7905,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     150,
    scale:       1
},
{
    name:        "RJTT ANA 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
    visualLat:   35.55148,  visualLon: 139.7893,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     150,
    scale:       1
},
{
    name:        "RJTT ANA 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
    visualLat:   35.55201,  visualLon: 139.7889,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     150,
    scale:       1
},
{
    name:        "RJTT ANA 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/ANA%20A320.glb",
    visualLat:   35.55313,  visualLon: 139.7881,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     150,
    scale:       1
},
{
    name:        "RJTT ANA 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
    visualLat:   35.554811,  visualLon: 139.788785,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     240,
    scale:       1
},
{
    name:        "RJTT Air Asia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   35.55956,  visualLon: 139.7861,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     330,
    scale:       1
},
{
    name:        "RJTT Air Asia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   35.55911,  visualLon: 139.7866,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     330,
    scale:       1
},
{
    name:        "RJTT Air Asia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   35.56158,  visualLon: 139.782,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     195,
    scale:       1
},
{
    name:        "RJTT Cebu Pacific 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   35.55125,  visualLon: 139.7683,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     240,
    scale:       1
},
{
    name:        "RJTT Cebu Pacific 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   35.55093,  visualLon: 139.7677,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     241,
    scale:       1
},
{
    name:        "RJTT Cebu Pacific 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   35.55062,  visualLon: 139.767,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     239,
    scale:       1
},
{
    name:        "RJTT Asiana 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   35.549092,  visualLon: 139.768234,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     60,
    scale:       1
},
{
    name:        "RJTT Asiana 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   35.549431,  visualLon: 139.768959,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     60,
    scale:       1
},
{
    name:        "RJTT Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   35.550071,  visualLon: 139.770404,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     60,
    scale:       1
},
{
    name:        "RJTT United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   35.542760,  visualLon: 139.772016,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},
{
    name:        "RJTT American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   35.543419,  visualLon: 139.771629,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},
{
    name:        "RJTT Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   35.544083,  visualLon: 139.771152,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},
{
    name:        "RJTT Korean",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   35.546513,  visualLon: 139.769580,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},
{
    name:        "RJTT Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   35.547661,  visualLon: 139.768872,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},
{
    name:        "RJTT Ita Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/ITA%20Airways%20A330.glb",
    visualLat:   35.545253,  visualLon: 139.770321,
    alt:         -1.4,      visualAlt: -1.4,
    heading:     145,
    scale:       1
},


{
    name:        "ZSPD China Eastern 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   31.13737,  visualLon: 121.8019,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD China Eastern 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   31.13331,  visualLon: 121.8036,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD China Eastern 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   31.13045,  visualLon: 121.8043,
    alt:         1.72,      visualAlt: 1.72,
    heading:     344,
    scale:       1
},
{
    name:        "ZSPD China Eastern 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   31.13038,  visualLon: 121.8047,
    alt:         1.72,      visualAlt: 1.72,
    heading:     302,
    scale:       1
},
{
    name:        "ZSPD Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   31.15013,  visualLon: 121.7973,
    alt:         1.72,      visualAlt: 1.72,
    heading:     337,
    scale:       1
},
{
    name:        "ZSPD Pakistan International Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/PIA%20777.glb",
    visualLat:   31.15078,  visualLon: 121.7971,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   31.15401,  visualLon: 121.7957,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   31.14881,  visualLon: 121.7978,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   31.1521,   visualLon: 121.7965,
    alt:         1.72,      visualAlt: 1.72,
    heading:     338,
    scale:       1
},
{
    name:        "ZSPD Air China 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   31.14784,  visualLon: 121.8094,
    alt:         1.72,      visualAlt: 1.72,
    heading:     180,
    scale:       1
},
{
    name:        "ZSPD Air China 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   31.14741,  visualLon: 121.8094,
    alt:         1.72,      visualAlt: 1.72,
    heading:     212,
    scale:       1
},
{
    name:        "ZSPD China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   31.14901,  visualLon: 121.8087,
    alt:         1.72,      visualAlt: 1.72,
    heading:     162,
    scale:       1
},
{
    name:        "ZSPD Bangladesh",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   31.13725,  visualLon: 121.8132,
    alt:         1.72,      visualAlt: 1.72,
    heading:     165,
    scale:       1
},
{
    name:        "ZSPD Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   31.13751,  visualLon: 121.8096,
    alt:         1.72,      visualAlt: 1.72,
    heading:     75,
    scale:       1
},
{
    name:        "ZSPD Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   31.15494,  visualLon: 121.8065,
    alt:         1.72,      visualAlt: 1.72,
    heading:     160,
    scale:       1
},
{
    name:        "VIDP Indigo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56573,  visualLon: 77.11523,
    alt:         115,    visualAlt: 115,
    heading:     104,
    scale:       1
},
{
    name:        "VIDP Indigo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56583,  visualLon: 77.11484,
    alt:         115,    visualAlt: 115,
    heading:     104,
    scale:       1
},
{
    name:        "VIDP Indigo 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56567,  visualLon: 77.11563,
    alt:         115,    visualAlt: 115,
    heading:     104,
    scale:       1
},
{
    name:        "VIDP Indigo 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56556,  visualLon: 77.11604,
    alt:         115,    visualAlt: 115,
    heading:     104,
    scale:       1
},
{
    name:        "VIDP Indigo 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.5643,   visualLon: 77.11671,
    alt:         115.4,    visualAlt: 115.4,
    heading:     284,
    scale:       1
},
{
    name:        "VIDP Indigo 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56459,  visualLon: 77.11535,
    alt:         115.25,    visualAlt: 115.25,
    heading:     284,
    scale:       1
},
{
    name:        "VIDP Indigo 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56278,  visualLon: 77.11572,
    alt:         116,    visualAlt: 116,
    heading:     104,
    scale:       1
},
{
    name:        "VIDP Indigo 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56412,  visualLon: 77.10852,
    alt:         115.35,    visualAlt: 115.35,
    heading:     200,
    scale:       1
},
{
    name:        "VIDP Indigo 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56482,  visualLon: 77.10872,
    alt:         115.25,    visualAlt: 115.25,
    heading:     201,
    scale:       1
},
{
    name:        "VIDP Indigo 10",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.561,    visualLon: 77.08275,
    alt:         116.4,    visualAlt: 116.4,
    heading:     150,
    scale:       1
},
{
    name:        "VIDP Indigo 11",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56031,  visualLon: 77.08311,
    alt:         116.5,    visualAlt: 116.5,
    heading:     150,
    scale:       1
},
{
    name:        "VIDP Indigo 12",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   28.56048,  visualLon: 77.08154,
    alt:         115.9,    visualAlt: 115.9,
    heading:     330,
    scale:       1
},
{
    name:        "VIDP Alliance Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   28.56715,  visualLon: 77.11772,
    alt:         114.75,    visualAlt: 114.75,
    heading:     180,
    scale:       1
},
{
    name:        "VIDP Alliance Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   28.56752,  visualLon: 77.11773,
    alt:         114.75,    visualAlt: 114.75,
    heading:     180,
    scale:       1
},
{
    name:        "VIDP Alliance Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   28.567,    visualLon: 77.1173,
    alt:         114.75,    visualAlt: 114.75,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Alliance Air 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   28.56121,  visualLon: 77.09578,
    alt:         116.7,    visualAlt: 116.7,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Alliance Air 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   28.56113,  visualLon: 77.09619,
    alt:         116.7,    visualAlt: 116.7,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Air India 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   28.55459,  visualLon: 77.0805,
    alt:         115.35,    visualAlt: 115.35,
    heading:     245,
    scale:       1
},
{
    name:        "VIDP Air India 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   28.55496,  visualLon: 77.08123,
    alt:         115.7,    visualAlt: 115.7,
    heading:     245,
    scale:       1
},
{
    name:        "VIDP Air India 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   28.55422,  visualLon: 77.07976,
    alt:         115.25,    visualAlt: 115.25,
    heading:     245,
    scale:       1
},
{
    name:        "VIDP Air India 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   28.55526,  visualLon: 77.08037,
    alt:         115.25,    visualAlt: 115.25,
    heading:     55,
    scale:       1
},
{
    name:        "VIDP Air India 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   28.55816,  visualLon: 77.08029,
    alt:         115.4,    visualAlt: 115.4,
    heading:     150,
    scale:       1
},
{
    name:        "VIDP Air India 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   28.56294,  visualLon: 77.08769,
    alt:         115.95,    visualAlt: 115.95,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Air India 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   28.56258,  visualLon: 77.0893,
    alt:         115.95,    visualAlt: 115.95,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   28.55211,  visualLon: 77.0872,
    alt:         118.25,    visualAlt: 118.25,
    heading:     290,
    scale:       1
},
{
    name:        "VIDP Bangladesh",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   28.54955,  visualLon: 77.08922,
    alt:         119,    visualAlt: 119,
    heading:     325,
    scale:       1
},
{
    name:        "VIDP Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   28.551283,  visualLon: 77.082173,
    alt:         116.7,    visualAlt: 116.7,
    heading:     240,
    scale:       1
},
{
    name:        "VIDP Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   28.551537,  visualLon: 77.083047,
    alt:         116.7,    visualAlt: 116.7,
    heading:     240,
    scale:       1
},
{
    name:        "VIDP Jetstar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   28.551890,  visualLon: 77.083772,
    alt:         116.7,    visualAlt: 116.7,
    heading:     240,
    scale:       1
},
{
    name:        "VIDP American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   28.552451,  visualLon: 77.085810,
    alt:         117.7,    visualAlt: 117.7,
    heading:     304,
    scale:       1
},
{
    name:        "VIDP Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   28.552272,  visualLon: 77.086518,
    alt:         117.7,    visualAlt: 117.7,
    heading:     304,
    scale:       1
},
{
    name:        "VIDP Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/Qatar%20A319.glb",
    visualLat:   28.550458,  visualLon: 77.088452,
    alt:         118.7,    visualAlt: 118.7,
    heading:     320,
    scale:       1
},
{
    name:        "VIDP Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   28.551515,  visualLon: 77.087586,
    alt:         118.2,    visualAlt: 118.2,
    heading:     320,
    scale:       1
},
{
    name:        "VIDP Virgin Atlantic",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Virgin%20Atlantic%20A330.glb",
    visualLat:   28.550957,  visualLon: 77.088066,
    alt:         118.2,    visualAlt: 118.2,
    heading:     320,
    scale:       1
},
{
    name:        "VIDP Vietnam Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
    visualLat:   28.550712,  visualLon: 77.089289,
    alt:         119.2,    visualAlt: 119.2,
    heading:     135,
    scale:       1
},
{
    name:        "VIDP Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   28.549413,  visualLon: 77.090222,
    alt:         119.6,    visualAlt: 119.6,
    heading:     135,
    scale:       1
},
{
    name:        "VIDP Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   28.551513,  visualLon: 77.088870,
    alt:         119,    visualAlt: 119,
    heading:     135,
    scale:       1
},
{
    name:        "VABB Akasa Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   19.091552, visualLon: 72.851026,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Akasa Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   19.091588, visualLon: 72.853665,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Akasa Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   19.091634, visualLon: 72.854126,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091618, visualLon: 72.851605,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091623, visualLon: 72.852115,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091558, visualLon: 72.853107,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091618, visualLon: 72.854502,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091623, visualLon: 72.854963,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Spicejet 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   19.091608, visualLon: 72.855988,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Air India 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   19.097656, visualLon: 72.872703,
    alt:         6.5,       visualAlt: 6.5,
    heading:     325,
    scale:       1
},
{
    name:        "VABB Air India 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   19.096693, visualLon: 72.872875,
    alt:         6.5,       visualAlt: 6.5,
    heading:     13,
    scale:       1
},
{
    name:        "VABB Air India 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   19.096222, visualLon: 72.872355,
    alt:         6.5,       visualAlt: 6.5,
    heading:     40,
    scale:       1
},
{
    name:        "VABB Air India 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   19.093814, visualLon: 72.872827,
    alt:         6.6,       visualAlt: 6.6,
    heading:     220,
    scale:       1
},
{
    name:        "VABB Indigo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   19.094969, visualLon: 72.871260,
    alt:         6.5,       visualAlt: 6.5,
    heading:     40,
    scale:       1
},
{
    name:        "VABB Indigo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   19.094230, visualLon: 72.870381,
    alt:         6.5,       visualAlt: 6.5,
    heading:     40,
    scale:       1
},
{
    name:        "VABB Indigo 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   19.093393, visualLon: 72.870496,
    alt:         6.5,       visualAlt: 6.5,
    heading:     322,
    scale:       1
},
{
    name:        "VABB Indigo 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   19.093277, visualLon: 72.871577,
    alt:         6.5,       visualAlt: 6.5,
    heading:     270,
    scale:       1
},
{
    name:        "VABB Alliance Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   19.091705, visualLon: 72.857350,
    alt:         6.5,       visualAlt: 6.5,
    heading:     210,
    scale:       1
},
{
    name:        "VABB Alliance Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   19.092130, visualLon: 72.857527,
    alt:         6.5,       visualAlt: 6.5,
    heading:     210,
    scale:       1
},
{
    name:        "VABB Alliance Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   19.092723, visualLon: 72.857817,
    alt:         6.5,       visualAlt: 6.5,
    heading:     210,
    scale:       1
},
{
    name:        "VABB Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-15@main/models/Qatar%20A350.glb",
    visualLat:   19.095081, visualLon: 72.875260,
    alt:         6.5,       visualAlt: 6.5,
    heading:     300,
    scale:       1
},
{
    name:        "VABB KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/KLM%20777.glb",
    visualLat:   19.094549, visualLon: 72.875809,
    alt:         6.5,       visualAlt: 6.5,
    heading:     300,
    scale:       1
},
{
    name:        "VABB Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   19.094301, visualLon: 72.876630,
    alt:         6.6,       visualAlt: 6.6,
    heading:     245,
    scale:       1
},
{
    name:        "VABB Kenya Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Kenya%20Airways%20B787.glb",
    visualLat:   19.095857, visualLon: 72.877220,
    alt:         6.6,       visualAlt: 6.6,
    heading:     130,
    scale:       1
},
{
    name:        "VABB Vietjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Vietjet%20A321.glb",
    visualLat:   19.094960, visualLon: 72.877290,
    alt:         6.6,       visualAlt: 6.6,
    heading:     210,
    scale:       1
},
{
    name:        "VABB Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20737.glb",
    visualLat:   19.098731, visualLon: 72.876678,
    alt:         6.6,       visualAlt: 6.6,
    heading:     205,
    scale:       1
},
{
    name:        "VABB Egyptair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
    visualLat:   19.099389, visualLon: 72.877209,
    alt:         6.5,       visualAlt: 6.5,
    heading:     205,
    scale:       1
},
{
    name:        "VOBL IndiGo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   13.201452, visualLon: 77.713946,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL IndiGo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Indigo%20Atr%2072.glb",
    visualLat:   13.201508, visualLon: 77.713096,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL IndiGo 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   13.201519, visualLon: 77.712291,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL IndiGo 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   13.201540, visualLon: 77.711422,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL IndiGo 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Indigo%20Atr%2072.glb",
    visualLat:   13.201493, visualLon: 77.710781,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Air India Express 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   13.200746, visualLon: 77.716593,
    alt:         447.85,       visualAlt: 447.85,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Air India Express 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   13.200621, visualLon: 77.718275,
    alt:         448.15,       visualAlt: 448.15,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Air India 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   13.200684, visualLon: 77.717315,
    alt:         447.95,       visualAlt: 447.95,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Air India 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   13.200715, visualLon: 77.719916,
    alt:         448.95,       visualAlt: 448.95,
    heading:     180,
    scale:       1
},
{
    name:        "VOBL Akasa Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   13.201473, visualLon: 77.710379,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Akasa Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   13.201462, visualLon: 77.709960,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Akasa Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   13.201436, visualLon: 77.709247,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL SpiceJet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   13.201441, visualLon: 77.709628,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL SpiceJet 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   13.201426, visualLon: 77.708844,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL SpiceJet 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   13.201431, visualLon: 77.708442,
    alt:         447.55,       visualAlt: 447.55,
    heading:     90,
    scale:       1
},
{
    name:        "VOBL Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   13.199509, visualLon: 77.719997,
    alt:         448.95,       visualAlt: 448.95,
    heading:     180,
    scale:       1
},
{
    name:        "VOBL Singapore Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   13.197917, visualLon: 77.719906,
    alt:         448.95,       visualAlt: 448.95,
    heading:     180,
    scale:       1
},
{
    name:        "VOBL Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-15@main/models/Qatar%20A350.glb",
    visualLat:   13.197090, visualLon: 77.719949,
    alt:         448.95,       visualAlt: 448.95,
    heading:     180,
    scale:       1
},
{
    name:        "VOBL Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   13.198689, visualLon: 77.719954,
    alt:         448.95,       visualAlt: 448.95,
    heading:     180,
    scale:       1
},
{
    name:        "VOBL British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   13.200619, visualLon: 77.719546,
    alt:         448.8,       visualAlt: 448.8,
    heading:     90,
    scale:       1
},
{
    name:        "VOHS IndiGo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   17.236337, visualLon: 78.433593,
    alt:         303.4,       visualAlt: 303.4,
    heading:     75,
    scale:       1
},
{
    name:        "VOHS IndiGo 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   17.235820, visualLon: 78.432257,
    alt:         302.8,       visualAlt: 302.8,
    heading:     75,
    scale:       1
},
{
    name:        "VOHS IndiGo 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   17.236475, visualLon: 78.434355,
    alt:         303,       visualAlt: 303,
    heading:     90,
    scale:       1
},
{
    name:        "VOHS Air India Express 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   17.234270, visualLon: 78.433357,
    alt:         303,       visualAlt: 303,
    heading:     270,
    scale:       1
},
{
    name:        "VOHS Air India Express 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   17.234329, visualLon: 78.430831,
    alt:         302.3,       visualAlt: 302.3,
    heading:     270,
    scale:       1
},
{
    name:        "VOHS Air India Express 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   17.234329, visualLon: 78.429854,
    alt:         302.1,       visualAlt: 302.1,
    heading:     270,
    scale:       1
},
{
    name:        "VOHS Akasa Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   17.234283, visualLon: 78.428223,
    alt:         301.6,       visualAlt: 301.6,
    heading:     270,
    scale:       1
},
{
    name:        "VOHS SpiceJet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   17.234288, visualLon: 78.427317,
    alt:         301.35,       visualAlt: 301.35,
    heading:     270,
    scale:       1
},
{
    name:        "VOHS Saudia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   17.234196, visualLon: 78.424833,
    alt:         300.9,       visualAlt: 300.9,
    heading:     310,
    scale:       1
},
{
    name:        "VOHS Saudia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   17.235204, visualLon: 78.423862,
    alt:         300.7,       visualAlt: 300.7,
    heading:     360,
    scale:       1
},
{
    name:        "VOHS KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   17.236079, visualLon: 78.423959,
    alt:         300.7,       visualAlt: 300.7,
    heading:     13,
    scale:       1
},
{
    name:        "VOHS Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   17.236392, visualLon: 78.424962,
    alt:         301.05,       visualAlt: 301.05,
    heading:     90,
    scale:       1
},
{
    name:        "VOHS Vietjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Vietjet%20A321.glb",
    visualLat:   17.236074, visualLon: 78.425729,
    alt:         301.2,       visualAlt: 301.2,
    heading:     110,
    scale:       1
},
{
    name:        "VOHS AirAsia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   17.235753, visualLon: 78.435390,
    alt:         303.7,       visualAlt: 303.7,
    heading:     180,
    scale:       1
},
{
    name:        "VOMM IndiGo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Indigo%20Atr%2072.glb",
    visualLat:   12.981673, visualLon: 80.158677,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM IndiGo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Indigo%20Atr%2072.glb",
    visualLat:   12.982059, visualLon: 80.159788,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM Air India 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   12.982949, visualLon: 80.162400,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM Air India 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   12.983513, visualLon: 80.163462,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM Air India 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   12.984124, visualLon: 80.165206,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM Air India Express 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   12.986404, visualLon: 80.166552,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM Air India Express 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   12.985902, visualLon: 80.165018,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM Akasa Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   12.986174, visualLon: 80.165893,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM SpiceJet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   12.985699, visualLon: 80.164509,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM SpiceJet 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   12.985217, visualLon: 80.163200,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM SpiceJet 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   12.984835, visualLon: 80.162400,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM Alliance Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   12.984093, visualLon: 80.160265,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM Alliance Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   12.983717, visualLon: 80.159337,
    alt:         6.2,       visualAlt: 6.2,
    heading:     245,
    scale:       1
},
{
    name:        "VOMM Batik Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Batik%20Air%20A320.glb",
    visualLat:   12.984871, visualLon: 80.167067,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VOMM Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20737.glb",
    visualLat:   12.984568, visualLon: 80.166332,
    alt:         6.2,       visualAlt: 6.2,
    heading:     65,
    scale:       1
},
{
    name:        "VECC IndiGo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   22.639700, visualLon: 88.437715,
    alt:         1.8,       visualAlt: 1.8,
    heading:     250,
    scale:       1
},
{
    name:        "VECC IndiGo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Indigo%20Atr%2072.glb",
    visualLat:   22.640304, visualLon: 88.439335,
    alt:         1.8,       visualAlt: 1.8,
    heading:     250,
    scale:       1
},
{
    name:        "VECC IndiGo 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   22.640966, visualLon: 88.440344,
    alt:         1.8,       visualAlt: 1.8,
    heading:     215,
    scale:       1
},
{
    name:        "VECC Air India Express",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-42@main/models/Air%20India%20Express%20B737.glb",
    visualLat:   22.642581, visualLon: 88.440554,
    alt:         1.8,       visualAlt: 1.8,
    heading:     189,
    scale:       1
},
{
    name:        "VECC Akasa Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   22.645897, visualLon: 88.443241,
    alt:         1.5,       visualAlt: 1.5,
    heading:     9,
    scale:       1
},
{
    name:        "VECC Akasa Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   22.645066, visualLon: 88.443133,
    alt:         1.5,       visualAlt: 1.5,
    heading:     9,
    scale:       1
},
{
    name:        "VECC Akasa Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Akasa%20Air%20737.glb",
    visualLat:   22.644452, visualLon: 88.443069,
    alt:         1.5,       visualAlt: 1.5,
    heading:     9,
    scale:       1
},
{
    name:        "VECC SpiceJet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Spicejet%20B737.glb",
    visualLat:   22.638421, visualLon: 88.438724,
    alt:         1.8,       visualAlt: 1.8,
    heading:     70,
    scale:       1
},
{
    name:        "VECC Alliance Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Alliance%20Air%20ATR72.glb",
    visualLat:   22.645720, visualLon: 88.441175,
    alt:         1.6,       visualAlt: 1.6,
    heading:     100,
    scale:       1
},
{
    name:        "VECC Singapore Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   22.643932, visualLon: 88.440684,
    alt:         1.8,       visualAlt: 1.8,
    heading:     189,
    scale:       1
},
{
    name:        "VECC Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/Qatar%20A319.glb",
    visualLat:   22.640581, visualLon: 88.439925,
    alt:         1.8,       visualAlt: 1.8,
    heading:     230,
    scale:       1
},
{
    name:        "VECC Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   22.641600, visualLon: 88.440483,
    alt:         1.8,       visualAlt: 1.8,
    heading:     189,
    scale:       1
},
{
    name:        "WSSS Qantas 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   1.363288,  visualLon: 103.9934,
    alt:         2.84,      visualAlt: 2.84,
    heading:     220,
    scale:       1
},
{
    name:        "WSSS Qantas 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   1.364226,  visualLon: 103.9945,
    alt:         2.84,      visualAlt: 2.84,
    heading:     235,
    scale:       1
},
{
    name:        "WSSS Qantas 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   1.364687,  visualLon: 103.9935,
    alt:         2.84,      visualAlt: 2.84,
    heading:     55,
    scale:       1
},
{
    name:        "WSSS British Airways 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   1.365728,  visualLon: 103.9893,
    alt:         2.84,      visualAlt: 2.84,
    heading:     350,
    scale:       1
},
{
    name:        "WSSS British Airways 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   1.364114,  visualLon: 103.9891,
    alt:         2.84,      visualAlt: 2.84,
    heading:     20,
    scale:       1
},
{
    name:        "WSSS Air France 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   1.363861,  visualLon: 103.99,
    alt:         2.84,      visualAlt: 2.84,
    heading:     200,
    scale:       1
},
{
    name:        "WSSS Air France 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   1.364489,  visualLon: 103.9903,
    alt:         2.84,      visualAlt: 2.84,
    heading:     201,
    scale:       1
},
{
    name:        "WSSS Emirates 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   1.362296,  visualLon: 103.9918,
    alt:         2.84,      visualAlt: 2.84,
    heading:     40,
    scale:       1
},
{
    name:        "WSSS Malaysia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   1.351155,  visualLon: 103.9914,
    alt:         2.84,      visualAlt: 2.84,
    heading:     168,
    scale:       1
},
{
    name:        "WSSS Malaysia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   1.351859,  visualLon: 103.9913,
    alt:         2.84,      visualAlt: 2.84,
    heading:     150,
    scale:       1
},
{
    name:        "WSSS Singapore 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Singapore%20A321.glb",
    visualLat:   1.356369,  visualLon: 103.9937,
    alt:         2.84,      visualAlt: 2.84,
    heading:     250,
    scale:       1
},
{
    name:        "WSSS Singapore 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   1.358359,  visualLon: 103.9856,
    alt:         2.84,      visualAlt: 2.84,
    heading:     15,
    scale:       1
},
{
    name:        "WSSS Singapore 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   1.35534,   visualLon: 103.9843,
    alt:         2.84,      visualAlt: 2.84,
    heading:     41,
    scale:       1
},
{
    name:        "WSSS Singapore 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Singapore%20A321.glb",
    visualLat:   1.351484,  visualLon: 103.9837,
    alt:         2.84,      visualAlt: 2.84,
    heading:     25,
    scale:       1
},
{
    name:        "WSSS Singapore 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Singapore%20A321.glb",
    visualLat:   1.349978,  visualLon: 103.9822,
    alt:         2.84,      visualAlt: 2.84,
    heading:     63,
    scale:       1
},
{
    name:        "WSSS Singapore 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   1.347312,  visualLon: 103.9866,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Singapore 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   1.351779,  visualLon: 103.9885,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   1.353034,  visualLon: 103.9891,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   1.349301,  visualLon: 103.9835,
    alt:         2.84,      visualAlt: 2.84,
    heading:     240,
    scale:       1
},
{
    name:        "WSSS Garuda Indonesia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Garuda%20Indonesia%20B737.glb ",
    visualLat:   1.356888,  visualLon: 103.990654,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   1.357509,  visualLon: 103.990901,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Cebu Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   1.361841,  visualLon: 103.995107,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Air Asia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   1.360640,  visualLon: 103.994688,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   1.358754,  visualLon: 103.991459,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   1.359472,  visualLon: 103.991674,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
    visualLat:   1.360050,  visualLon: 103.991974,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Asiana Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   1.361304,  visualLon: 103.992457,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   1.363430,  visualLon: 103.988892,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   1.362835,  visualLon: 103.988538,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   1.361958,  visualLon: 103.992693,
    alt:         2.84,      visualAlt: 2.84,
    heading:     203,
    scale:       1
},
{
    name:        "WSSS Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   1.362192,  visualLon: 103.988281,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   1.361592,  visualLon: 103.988034,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Fiji",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   1.360965,  visualLon: 103.987728,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   1.360274,  visualLon: 103.987487,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Qatar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   1.359631,  visualLon: 103.987159,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   1.353311,  visualLon: 103.984536,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "WSSS British",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   1.363482,  visualLon: 103.992425,
    alt:         2.84,      visualAlt: 2.84,
    heading:     23,
    scale:       1
},
{
    name:        "RKSI Lufthansa 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   37.44734,  visualLon: 126.4476,
    alt:         1.98,      visualAlt: 1.98,
    heading:     20,
    scale:       1
},
{
    name:        "RKSI Lufthansa 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   37.44528,  visualLon: 126.4477,
    alt:         1.98,      visualAlt: 1.98,
    heading:     315,
    scale:       1
},
{
    name:        "RKSI Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
    visualLat:   37.44564,  visualLon: 126.4488,
    alt:         1.98,      visualAlt: 1.98,
    heading:     258,
    scale:       1
},
{
    name:        "RKSI China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   37.45081,  visualLon: 126.4454,
    alt:         1.98,      visualAlt: 1.98,
    heading:     52,
    scale:       1
},
{
    name:        "RKSI Singapore 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Singapore%20A321.glb",
    visualLat:   37.4538,   visualLon: 126.4507,
    alt:         1.98,      visualAlt: 1.98,
    heading:     70,
    scale:       1
},
{
    name:        "RKSI Singapore 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   37.44966,  visualLon: 126.448,
    alt:         1.98,      visualAlt: 1.98,
    heading:     120,
    scale:       1
},
{
    name:        "RKSI Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   37.45151,  visualLon: 126.4512,
    alt:         1.98,      visualAlt: 1.98,
    heading:     340,
    scale:       1
},
{
    name:        "RKSI Air Asia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   37.45112,  visualLon: 126.4534,
    alt:         1.98,      visualAlt: 1.98,
    heading:     105,
    scale:       1
},
{
    name:        "RKSI Air Asia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   37.45004,  visualLon: 126.4568,
    alt:         1.98,      visualAlt: 1.98,
    heading:     160,
    scale:       1
},
{
    name:        "RKSI Air Asia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   37.45368,  visualLon: 126.452,
    alt:         1.98,      visualAlt: 1.98,
    heading:     121,
    scale:       1
},
{
    name:        "RKSI Air Asia 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   37.45669,  visualLon: 126.4474,
    alt:         1.98,      visualAlt: 1.98,
    heading:     230,
    scale:       1
},
{
    name:        "RKSI Bangladesh 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   37.45761,  visualLon: 126.447,
    alt:         1.98,      visualAlt: 1.98,
    heading:     50,
    scale:       1
},
{
    name:        "RKSI Bangladesh 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   37.46187,  visualLon: 126.441,
    alt:         1.98,      visualAlt: 1.98,
    heading:     53,
    scale:       1
},
{
    name:        "RKSI Korean Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.46626,  visualLon: 126.4403,
    alt:         1.98,      visualAlt: 1.98,
    heading:     315,
    scale:       1
},
{
    name:        "RKSI Korean Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.46289,  visualLon: 126.4342,
    alt:         1.98,      visualAlt: 1.98,
    heading:     150,
    scale:       1
},
{
    name:        "RKSI Korean Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.46593,  visualLon: 126.434,
    alt:         1.98,      visualAlt: 1.98,
    heading:     230,
    scale:       1
},
{
    name:        "RKSI Korean Air 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.4659,   visualLon: 126.427,
    alt:         1.98,      visualAlt: 1.98,
    heading:     150,
    scale:       1
},
{
    name:        "RKSI Korean Air 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.46648,  visualLon: 126.4266,
    alt:         1.98,      visualAlt: 1.98,
    heading:     150,
    scale:       1
},
{
    name:        "RKSI Korean Air 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   37.46987,  visualLon: 126.4267,
    alt:         1.98,      visualAlt: 1.98,
    heading:     330,
    scale:       1
},
{
    name:        "RKSI Asiana 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   37.46595,  visualLon: 126.4412,
    alt:         1.98,      visualAlt: 1.98,
    heading:     250,
    scale:       1
},
{
    name:        "RKSI Asiana 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   37.46736,  visualLon: 126.4411,
    alt:         1.98,      visualAlt: 1.98,
    heading:     130,
    scale:       1
},
{
    name:        "RKSI Asiana 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   37.46631,  visualLon: 126.4347,
    alt:         1.98,      visualAlt: 1.98,
    heading:     240,
    scale:       1
},
{
    name:        "RKSI Asiana 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   37.47106,  visualLon: 126.4371,
    alt:         1.98,      visualAlt: 1.98,
    heading:     150,
    scale:       1
},
{
    name:        "RKSI Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   37.470566, visualLon: 126.427641,
    alt:         2.05,      visualAlt: 2.05,
    heading:     76,
    scale:       1
},
{
    name:        "RKSI China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   37.470430, visualLon: 126.427276,
    alt:         2.05,      visualAlt: 2.05,
    heading:     35,
    scale:       1
},
{
    name:        "RKSI China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   37.468479, visualLon: 126.428352,
    alt:         2.05,      visualAlt: 2.05,
    heading:     330,
    scale:       1
},
{
    name:        "RKSI Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   37.467969, visualLon: 126.428770,
    alt:         2.05,      visualAlt: 2.05,
    heading:     330,
    scale:       1
},
{
    name:        "RKSI Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   37.467221, visualLon: 126.429669,
    alt:         2.05,      visualAlt: 2.05,
    heading:     330,
    scale:       1
},
{
    name:        "RKSI Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   37.465922, visualLon: 126.431085,
    alt:         2.05,      visualAlt: 2.05,
    heading:     330,
    scale:       1
},
{
    name:        "RKSI Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20737.glb",
    visualLat:   37.465022, visualLon: 126.431635,
    alt:         2.05,      visualAlt: 2.05,
    heading:     340,
    scale:       1
},
{
    name:        "RKSI Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   37.462529, visualLon: 126.432780,
    alt:         2.05,      visualAlt: 2.05,
    heading:     340,
    scale:       1
},
{
    name:        "RKSI Cebu Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   37.473859, visualLon: 126.433165,
    alt:         2.05,      visualAlt: 2.05,
    heading:     20,
    scale:       1
},
{
    name:        "RKSI Garuda Indonesia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Garuda%20Indonesia%20B737.glb ",
    visualLat:   37.472533, visualLon: 126.435497,
    alt:         2.05,      visualAlt: 2.05,
    heading:     140,
    scale:       1
},
{
    name:        "RKSI Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   37.471971, visualLon: 126.435948,
    alt:         2.05,      visualAlt: 2.05,
    heading:     140,
    scale:       1
},
{
    name:        "RKSI Indigo",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   37.468156, visualLon: 126.439649,
    alt:         2.05,      visualAlt: 2.05,
    heading:     135,
    scale:       1
},
{
    name:        "RKSI Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   37.467866, visualLon: 126.437976,
    alt:         2.05,      visualAlt: 2.05,
    heading:     315,
    scale:       1
},
{
    name:        "RKSI Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   37.467654, visualLon: 126.439145,
    alt:         2.05,      visualAlt: 2.05,
    heading:     325,
    scale:       1
},
{
    name:        "RKSI Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
    visualLat:   37.452435, visualLon: 126.452256,
    alt:         2.05,      visualAlt: 2.05,
    heading:     167,
    scale:       1
},
{
    name:        "RKSI Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   37.449709, visualLon: 126.445947,
    alt:         2.05,      visualAlt: 2.05,
    heading:     295,
    scale:       1
},
{
    name:        "RKSI Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   37.449400, visualLon: 126.446737,
    alt:         2.05,      visualAlt: 2.05,
    heading:     295,
    scale:       1
},
{
    name:        "RKSI Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   37.448150, visualLon: 126.447954,
    alt:         2.05,      visualAlt: 2.05,
    heading:     25,
    scale:       1
},
{
    name:        "RKSI United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   37.446719, visualLon: 126.447342,
    alt:         2.05,      visualAlt: 2.05,
    heading:     10,
    scale:       1
},
{
    name:        "RKSI American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   37.446073, visualLon: 126.447292,
    alt:         2.05,      visualAlt: 2.05,
    heading:     10,
    scale:       1
},
{
    name:        "RKSI Hawaiian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   37.451854, visualLon: 126.459326,
    alt:         2.05,      visualAlt: 2.05,
    heading:     310,
    scale:       1
},
{
    name:        "RKSI Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   37.450042, visualLon: 126.450099,
    alt:         2.05,      visualAlt: 2.05,
    heading:     60,
    scale:       1
},
{
    name:        "RKSI Aeromexico",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Aeromexico%20B787.glb",
    visualLat:   37.454399, visualLon: 126.443249,
    alt:         2.05,      visualAlt: 2.05,
    heading:     230,
    scale:       1
},
{
    name:        "RKSI Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   37.455914, visualLon: 126.443871,
    alt:         2.05,      visualAlt: 2.05,
    heading:     52,
    scale:       1
},
{
    name:        "RKSI Jetstar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   37.458611, visualLon: 126.438228,
    alt:         2.05,      visualAlt: 2.05,
    heading:     230,
    scale:       1
},
{
    name:        "WIII Air Asia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   -6.120253, visualLon: 106.653,
    alt:         4.2,       visualAlt: 4.2,
    heading:     117,
    scale:       1
},
{
    name:        "WIII Air Asia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   -6.119694, visualLon: 106.6521,
    alt:         4.2,       visualAlt: 4.2,
    heading:     105,
    scale:       1
},
{
    name:        "WIII Air Asia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   -6.119891, visualLon: 106.6513,
    alt:         4.2,       visualAlt: 4.2,
    heading:     70,
    scale:       1
},
{
    name:        "WIII Air Asia 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   -6.12141,  visualLon: 106.651,
    alt:         4.2,       visualAlt: 4.2,
    heading:     20,
    scale:       1
},
{
    name:        "WIII Air Asia 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   -6.122323, visualLon: 106.6499,
    alt:         4.2,       visualAlt: 4.2,
    heading:     67,
    scale:       1
},
{
    name:        "WIII Jetstar 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   -6.124707, visualLon: 106.6501,
    alt:         4.2,       visualAlt: 4.2,
    heading:     320,
    scale:       1
},
{
    name:        "WIII Jetstar 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   -6.123427, visualLon: 106.6486,
    alt:         4.2,       visualAlt: 4.2,
    heading:     30,
    scale:       1
},
{
    name:        "WIII Garuda Indonesia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Garuda%20Indonesia%20A220.glb",
    visualLat:   -6.117,    visualLon: 106.6669,
    alt:         4.2,       visualAlt: 4.2,
    heading:     45,
    scale:       1
},
{
    name:        "WIII Garuda Indonesia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Garuda%20Indonesia%20A220.glb",
    visualLat:   -6.118114, visualLon: 106.6639,
    alt:         4.2,       visualAlt: 4.2,
    heading:     65,
    scale:       1
},
{
    name:        "WIII Garuda Indonesia 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Garuda%20Indonesia%20A220.glb",
    visualLat:   -6.117565, visualLon: 106.6654,
    alt:         4.2,       visualAlt: 4.2,
    heading:     45,
    scale:       1
},
{
    name:        "WIII Garuda Indonesia 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Garuda%20Indonesia%20A220.glb",
    visualLat:   -6.113858, visualLon: 106.6703,
    alt:         4.2,       visualAlt: 4.2,
    heading:     330,
    scale:       1
},
{
    name:        "WIII Garuda Indonesia 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Garuda%20Indonesia%20A220.glb",
    visualLat:   -6.113661, visualLon: 106.6713,
    alt:         4.2,       visualAlt: 4.2,
    heading:     150,
    scale:       1
},
{
    name:        "WIII ANA 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/ANA%20A320.glb",
    visualLat:   -6.114642, visualLon: 106.6739,
    alt:         4.2,       visualAlt: 4.2,
    heading:     330,
    scale:       1
},
{
    name:        "WIII ANA 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
    visualLat:   -6.113753, visualLon: 106.6735,
    alt:         4.2,       visualAlt: 4.2,
    heading:     330,
    scale:       1
},
{
    name:        "WIII Cebu Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   -6.115167, visualLon: 106.6645,
    alt:         4.2,       visualAlt: 4.2,
    heading:     248,
    scale:       1
},
{
    name:        "WIII Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   -6.124031, visualLon: 106.649214,
    alt:         4.2,       visualAlt: 4.2,
    heading:     320,
    scale:       1
},
{
    name:        "WIII Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20737.glb",
    visualLat:   -6.122475, visualLon: 106.649601,
    alt:         4.2,       visualAlt: 4.2,
    heading:     60,
    scale:       1
},
{
    name:        "WIII Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   -6.120746, visualLon: 106.651162,
    alt:         4.2,       visualAlt: 4.2,
    heading:     10,
    scale:       1
},
{
    name:        "WIII Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   -6.120694, visualLon: 106.654420,
    alt:         4.2,       visualAlt: 4.2,
    heading:     85,
    scale:       1
},
{
    name:        "WIII China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   -6.120128, visualLon: 106.654976,
    alt:         4.2,       visualAlt: 4.2,
    heading:     87,
    scale:       1
},
{
    name:        "WIII Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   -6.120144, visualLon: 106.655394,
    alt:         4.2,       visualAlt: 4.2,
    heading:     115,
    scale:       1
},
{
    name:        "WIII Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   -6.120266, visualLon: 106.656134,
    alt:         4.2,       visualAlt: 4.2,
    heading:     120,
    scale:       1
},
{
    name:        "WIII ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
    visualLat:   -6.120777, visualLon: 106.656306,
    alt:         4.2,       visualAlt: 4.2,
    heading:     145,
    scale:       1
},
{
    name:        "WIII Qatar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   -6.120910, visualLon: 106.656395,
    alt:         4.2,       visualAlt: 4.2,
    heading:     190,
    scale:       1
},
{
    name:        "WIII Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   -6.121657, visualLon: 106.656424,
    alt:         4.2,       visualAlt: 4.2,
    heading:     200,
    scale:       1
},
{
    name:        "WIII Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   -6.122291, visualLon: 106.656145,
    alt:         4.2,       visualAlt: 4.2,
    heading:     210,
    scale:       1
},
{
    name:        "WIII Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   -6.118159, visualLon: 106.659396,
    alt:         4.2,       visualAlt: 4.2,
    heading:     147,
    scale:       1
},
{
    name:        "WIII Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
    visualLat:   -6.132395, visualLon: 106.652835,
    alt:         4.2,       visualAlt: 4.2,
    heading:     265,
    scale:       1
},
{
    name:        "WIII KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   -6.131629, visualLon: 106.651513,
    alt:         5.7,       visualAlt: 5.7,
    heading:     330,
    scale:       1
},
{
    name:        "WIII Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   -6.133045, visualLon: 106.656725,
    alt:         4.2,       visualAlt: 4.2,
    heading:     255,
    scale:       1
},
{
    name:        "WIII Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -6.131920, visualLon: 106.657502,
    alt:         4.2,       visualAlt: 4.2,
    heading:     200,
    scale:       1
},
{
    name:        "WIII Indigo",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   -6.120816, visualLon: 106.653495,
    alt:         4.2,       visualAlt: 4.2,
    heading:     155,
    scale:       1
},
{
    name:        "WIII Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   -6.129861, visualLon: 106.658978,
    alt:         4.4,       visualAlt: 4.4,
    heading:     245,
    scale:       1
},
{
    name:        "WIII Iberia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
    visualLat:   -6.129323, visualLon: 106.660045,
    alt:         4.2,       visualAlt: 4.2,
    heading:     240,
    scale:       1
},
{
    name:        "WIII Egyptair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Egyptair%20A321.glb",
    visualLat:   -6.127963, visualLon: 106.659332,
    alt:         4.2,       visualAlt: 4.2,
    heading:     120,
    scale:       1
},
{
    name:        "WMKK Malaysia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.75156,   visualLon: 101.7031,
    alt:         10.25,     visualAlt: 10.25,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Malaysia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.751083,  visualLon: 101.7037,
    alt:         10.25,     visualAlt: 10.25,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Malaysia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.75149,   visualLon: 101.7043,
    alt:         10.25,     visualAlt: 10.25,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Malaysia 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.75292,   visualLon: 101.7065,
    alt:         10.25,     visualAlt: 10.25,
    heading:     230,
    scale:       1
},
{
    name:        "WMKK Malaysia 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.753016,  visualLon: 101.707,
    alt:         10.25,     visualAlt: 10.25,
    heading:     253,
    scale:       1
},
{
    name:        "WMKK Malaysia 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.755129,  visualLon: 101.71,
    alt:         11.35,     visualAlt: 11.35,
    heading:     230,
    scale:       1
},
{
    name:        "WMKK Malaysia 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.755702,  visualLon: 101.7107,
    alt:         11.35,     visualAlt: 11.35,
    heading:     230,
    scale:       1
},
{
    name:        "WMKK Malaysia 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.756607,  visualLon: 101.7121,
    alt:         11.35,     visualAlt: 11.35,
    heading:     320,
    scale:       1
},
{
    name:        "WMKK Malaysia 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.754652,  visualLon: 101.7076,
    alt:         10.25,     visualAlt: 10.25,
    heading:     50,
    scale:       1
},
{
    name:        "WMKK Malaysia 10",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   2.755102,  visualLon: 101.7083,
    alt:         10.25,     visualAlt: 10.25,
    heading:     51,
    scale:       1
},
{
    name:        "WMKK Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   2.746325,  visualLon: 101.7121,
    alt:         12.05,     visualAlt: 12.05,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   2.746174,  visualLon: 101.7153,
    alt:         12.35,     visualAlt: 12.35,
    heading:     140,
    scale:       1
},
{
    name:        "WMKK Vietnam Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
    visualLat:   2.748329,  visualLon: 101.7151,
    alt:         12.25,     visualAlt: 12.25,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   2.749443,  visualLon: 101.7147,
    alt:         12.05,     visualAlt: 12.05,
    heading:     55,
    scale:       1
},
{
    name:        "WMKK Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Japan%20Airlines%20A350.glb",
    visualLat:   2.747161,  visualLon: 101.7115,
    alt:         12.05,     visualAlt: 12.05,
    heading:     55,
    scale:       1
},
{
    name:        "WMKK Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   2.748747,  visualLon: 101.7123,
    alt:         12.05,     visualAlt: 12.05,
    heading:     326,
    scale:       1
},
{
    name:        "WMKK China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   2.744776,  visualLon: 101.7128,
    alt:         12.05,     visualAlt: 12.05,
    heading:     151,
    scale:       1
},
{
    name:        "WMKK Air Asia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.737179, visualLon: 101.685903,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.737964, visualLon: 101.687002,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.736433, visualLon: 101.684738,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740172, visualLon: 101.690252,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741092, visualLon: 101.691561,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741542, visualLon: 101.692269,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740203, visualLon: 101.683998,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740910, visualLon: 101.684963,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741274, visualLon: 101.685650,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 10",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.742871, visualLon: 101.688021,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 11",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.743803, visualLon: 101.689340,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 12",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.744017, visualLon: 101.689662,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 13",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.744199, visualLon: 101.689973,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 14",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.744852, visualLon: 101.690907,
    alt:         11.2,      visualAlt: 11.2,
    heading:     240,
    scale:       1
},
{
    name:        "WMKK Air Asia 15",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.737385, visualLon: 101.684867,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 16",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.737771, visualLon: 101.685510,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 17",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.738039, visualLon: 101.685843,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 18",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.738724, visualLon: 101.686819,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 19",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.739141, visualLon: 101.687420,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 20",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740760, visualLon: 101.689845,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 21",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741446, visualLon: 101.690800,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 22",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741874, visualLon: 101.691454,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 23",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.742088, visualLon: 101.691797,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 24",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740343, visualLon: 101.683158,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 25",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.740804, visualLon: 101.683823,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 26",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.741248, visualLon: 101.684445,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 27",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.743914, visualLon: 101.688388,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 28",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.744594, visualLon: 101.689354,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 29",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.745028, visualLon: 101.689998,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "WMKK Air Asia 30",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   2.745450, visualLon: 101.690657,
    alt:         11.2,      visualAlt: 11.2,
    heading:     60,
    scale:       1
},
{
    name:        "VTBS Thai Airways 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68644,  visualLon: 100.7535,
    alt:         1.83,      visualAlt: 1.83,
    heading:     195,
    scale:       1
},
{
    name:        "VTBS Thai Airways 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68914,  visualLon: 100.7542,
    alt:         1.83,      visualAlt: 1.83,
    heading:     194,
    scale:       1
},
{
    name:        "VTBS Thai Airways 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68869,  visualLon: 100.7531,
    alt:         1.83,      visualAlt: 1.83,
    heading:     15,
    scale:       1
},
{
    name:        "VTBS Thai Airways 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.69359,  visualLon: 100.7578,
    alt:         1.83,      visualAlt: 1.83,
    heading:     14,
    scale:       1
},
{
    name:        "VTBS Thai Airways 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68842,  visualLon: 100.7541,
    alt:         1.83,      visualAlt: 1.83,
    heading:     194,
    scale:       1
},
{
    name:        "VTBS Thai Airways 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68102,  visualLon: 100.7504,
    alt:         1.83,      visualAlt: 1.83,
    heading:     286,
    scale:       1
},
{
    name:        "VTBS Thai Airways 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   13.68235,  visualLon: 100.7508,
    alt:         1.83,      visualAlt: 1.83,
    heading:     106,
    scale:       1
},
{
    name:        "VTBS Malaysia Airlines 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   13.69009,  visualLon: 100.7433,
    alt:         1.83,      visualAlt: 1.83,
    heading:     192,
    scale:       1
},
{
    name:        "VTBS Malaysia Airlines 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   13.69637,  visualLon: 100.7473,
    alt:         1.83,      visualAlt: 1.83,
    heading:     14,
    scale:       1
},
{
    name:        "VTBS Vietnam Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
    visualLat:   13.69329,  visualLon: 100.7457,
    alt:         1.83,      visualAlt: 1.83,
    heading:     111,
    scale:       1
},
{
    name:        "VTBS Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20A350.glb",
    visualLat:   13.69052,  visualLon: 100.7459,
    alt:         1.83,      visualAlt: 1.83,
    heading:     20,
    scale:       1
},
{
    name:        "VTBS Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   13.68851,  visualLon: 100.7454,
    alt:         1.83,      visualAlt: 1.83,
    heading:     20,
    scale:       1
},
{
    name:        "VTBS KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   13.68896,  visualLon: 100.7464,
    alt:         1.83,      visualAlt: 1.83,
    heading:     200,
    scale:       1
},
{
    name:        "VTBS Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   13.69136,  visualLon: 100.7493,
    alt:         1.83,      visualAlt: 1.83,
    heading:     285,
    scale:       1
},
{
    name:        "VTBS American Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   13.69064,  visualLon: 100.7521,
    alt:         1.83,      visualAlt: 1.83,
    heading:     286,
    scale:       1
},
{
    name:        "VTBS Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
    visualLat:   13.69072,  visualLon: 100.7514,
    alt:         1.83,      visualAlt: 1.83,
    heading:     284,
    scale:       1
},
{
    name:        "VTBS Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   13.681331,  visualLon: 100.749005,
    alt:         1.83,      visualAlt: 1.83,
    heading:     286,
    scale:       1
},
{
    name:        "VTBS China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   13.68354,  visualLon: 100.7457,
    alt:         1.83,      visualAlt: 1.83,
    heading:     107,
    scale:       1
},
{
    name:        "VTBS Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   13.682850, visualLon: 100.743521,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   13.682745, visualLon: 100.744122,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-38@main/models/Lufthansa%20B747.glb",
    visualLat:   13.682256, visualLon: 100.746096,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   13.682047, visualLon: 100.746847,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Austrian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
    visualLat:   13.681849, visualLon: 100.747625,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   13.681698, visualLon: 100.748365,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Norse",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Norse%20787.glb",
    visualLat:   13.681474, visualLon: 100.749148,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   13.681271, visualLon: 100.749878,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Qatar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   13.680766, visualLon: 100.751898,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   13.681746, visualLon: 100.752735,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
    visualLat:   13.682162, visualLon: 100.751501,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Egyptair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
    visualLat:   13.682506, visualLon: 100.750149,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   13.682704, visualLon: 100.749398,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   13.683974, visualLon: 100.744388,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   13.683808, visualLon: 100.745031,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   13.683454, visualLon: 100.746405,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   13.683277, visualLon: 100.747091,
    alt:         1.83,       visualAlt: 1.83,
    heading:     105,
    scale:       1
},
{
    name:        "VTBS Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   13.692282, visualLon: 100.754966,
    alt:         1.83,       visualAlt: 1.83,
    heading:     210,
    scale:       1
},
{
    name:        "VTBS Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   13.693750, visualLon: 100.755309,
    alt:         1.83,       visualAlt: 1.83,
    heading:     210,
    scale:       1
},
{
    name:        "VTBS Korean",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   13.692993, visualLon: 100.755144,
    alt:         1.83,       visualAlt: 1.83,
    heading:     210,
    scale:       1
},
{
    name:        "VTBS Garuda Indonesia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Garuda%20Indonesia%20B737.glb ",
    visualLat:   13.703541, visualLon: 100.760363,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Jetstar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   13.702520, visualLon: 100.760116,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Vietnam",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
    visualLat:   13.700750, visualLon: 100.759751,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   13.697255, visualLon: 100.758888,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Cebu Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   13.696026, visualLon: 100.758544,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-30@main/models/Air%20India%20A320.glb",
    visualLat:   13.694464, visualLon: 100.758051,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Indigo",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   13.687563, visualLon: 100.756271,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS PIA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/PIA%20777.glb",
    visualLat:   13.692048, visualLon: 100.757536,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Bangladesh",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   13.687144, visualLon: 100.752735,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "VTBS Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   13.692603, visualLon: 100.744511,
    alt:         1.83,       visualAlt: 1.83,
    heading:     295,
    scale:       1
},
{
    name:        "VTBS Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   13.690334, visualLon: 100.746673,
    alt:         1.83,       visualAlt: 1.83,
    heading:     205,
    scale:       1
},
{
    name:        "VTBS Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   13.694930, visualLon: 100.747048,
    alt:         1.83,       visualAlt: 1.83,
    heading:     25,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.26956,  visualLon: 51.60807,
    alt:         1.15,      visualAlt: 1.15,
    heading:     65,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
    visualLat:   25.26982,  visualLon: 51.60883,
    alt:         1.55,      visualAlt: 1.55,
    heading:     65,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.27149,  visualLon: 51.61208,
    alt:         2,      visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.27233,  visualLon: 51.61477,
    alt:         1.3,  visualAlt: 1.3,
    heading:     160,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.26808,  visualLon: 51.61667,
    alt:         1.1,   visualAlt: 1.1,
    heading:     160,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
    visualLat:   25.26518,  visualLon: 51.61255,
    alt:         1.5,      visualAlt: 1.5,
    heading:     160,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.28045,  visualLon: 51.61012,
    alt:         2,      visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.26803,  visualLon: 51.60694,
    alt:         2,     visualAlt: 2,
    heading:     290,
    scale:       1
},
{
    name:        "OTHH Qatar Airways 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Qatar%20Airways%20A330.glb",
    visualLat:   25.26048,  visualLon: 51.6092,
    alt:         1.35,      visualAlt: 1.35,
    heading:     64,
    scale:       1
},
{
    name:        "OTHH Emirates 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.26357,  visualLon: 51.61768,
    alt:         1.15,      visualAlt: 1.15,
    heading:     130,
    scale:       1
},
{
    name:        "OTHH Emirates 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   25.27113,  visualLon: 51.61395,
    alt:         1.35,      visualAlt: 1.35,
    heading:     250,
    scale:       1
},
{
    name:        "OTHH Bombardier G6000 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25656,  visualLon: 51.62145,
    alt:         0.85,      visualAlt: 0.85,
    heading:     340,
    scale:       1
},
{
    name:        "OTHH Bombardier G6000 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25604,  visualLon: 51.62123,
    alt:         0.85,      visualAlt: 0.85,
    heading:     190,
    scale:       1
},
{
    name:        "OTHH Bombardier G6000 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   25.25545,  visualLon: 51.62164,
    alt:         0.85,      visualAlt: 0.85,
    heading:     191,
    scale:       1
},
{
    name:        "OTHH Private 727 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   25.2853,   visualLon: 51.60943,
    alt:         2.65,      visualAlt: 2.65,
    heading:     160,
    scale:       1
},
{
    name:        "OTHH Private 727 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   25.28135,  visualLon: 51.60017,
    alt:         2.65,      visualAlt: 2.65,
    heading:     250,
    scale:       1
},
{
    name:        "OTHH Saudia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-11@main/models/Saudia%20B787.glb",
    visualLat:   25.261009, visualLon: 51.610556,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "OTHH Indigo",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   25.261281, visualLon: 51.611382,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "OTHH Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   25.262793, visualLon: 51.612048,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH PIA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/PIA%20777.glb",
    visualLat:   25.263442, visualLon: 51.611640,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH Biman Bangladesh",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bangladesh%20787.glb",
    visualLat:   25.264034, visualLon: 51.611361,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   25.264722, visualLon: 51.611264,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   25.265362, visualLon: 51.610964,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH Iberia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
    visualLat:   25.266089, visualLon: 51.610717,
    alt:         1.6,       visualAlt: 1.6,
    heading:     335,
    scale:       1
},
{
    name:        "OTHH Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   25.267087, visualLon: 51.609172,
    alt:         1.6,       visualAlt: 1.6,
    heading:     275,
    scale:       1
},
{
    name:        "OTHH Aeroflot",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Aeroflot%20777.glb",
    visualLat:   25.267407, visualLon: 51.608400,
    alt:         1.6,       visualAlt: 1.6,
    heading:     275,
    scale:       1
},
{
    name:        "OTHH Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   25.267698, visualLon: 51.607692,
    alt:         1.6,       visualAlt: 1.6,
    heading:     275,
    scale:       1
},
{
    name:        "OTHH Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   25.263221, visualLon: 51.616765,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "OTHH Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   25.269971, visualLon: 51.609537,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "OTHH China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   25.270272, visualLon: 51.610385,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "OTHH Egyptair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Egyptair%20A330.glb",
    visualLat:   25.265936, visualLon: 51.612241,
    alt:         1.6,       visualAlt: 1.6,
    heading:     165,
    scale:       1
},
{
    name:        "OTHH Ethiopian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/Ethiopian%20B787.glb",
    visualLat:   25.263969, visualLon: 51.613008,
    alt:         1.6,       visualAlt: 1.6,
    heading:     165,
    scale:       1
},
{
    name:        "OTHH Royal Air Maroc",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Royal%20Air%20Maroc%20737.glb",
    visualLat:   25.263406, visualLon: 51.613378,
    alt:         1.6,       visualAlt: 1.6,
    heading:     165,
    scale:       1
},
{
    name:        "OTHH Air Algérie",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Air%20Algérie%20A330.glb",
    visualLat:   25.262989, visualLon: 51.615996,
    alt:         1.6,       visualAlt: 1.6,
    heading:     50,
    scale:       1
},
{
    name:        "ZKPY Air Koryo 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Air%20Koryo%20TU134.glb ",
    visualLat:   39.19781,  visualLon: 125.6765,
    alt:         13.93,     visualAlt: 13.93,
    heading:     165,
    scale:       1
},
{
    name:        "ZKPY Air Koryo 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Air%20Koryo%20TU134.glb ",
    visualLat:   39.20048,  visualLon: 125.6758,
    alt:         13.15,     visualAlt: 13.15,
    heading:     345,
    scale:       1
},
{
    name:        "ZKPY Private TU204",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   39.19742,  visualLon: 125.6766,
    alt:         13.93,     visualAlt: 13.93,
    heading:     165,
    scale:       1
},
{
    name:        "ZKPY Private TU154 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   39.19892,  visualLon: 125.676,
    alt:         13.93,     visualAlt: 13.93,
    heading:     164,
    scale:       1
},
{
    name:        "ZKPY Private TU154 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   39.19855,  visualLon: 125.6762,
    alt:         13.93,     visualAlt: 13.93,
    heading:     163,
    scale:       1
},
{
    name:        "ZKPY YAK 40",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Yak40.glb",
    visualLat:   39.203939,  visualLon: 125.674506,
    alt:         12.5,     visualAlt: 12.5,
    heading:     163,
    scale:       1
},
{
    name:        "VHHH Jeju Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Jeju%20B737.glb",
    visualLat:   22.312889, visualLon: 113.929108,
    alt:         2,       visualAlt: 2,
    heading:     252,
    scale:       1
},
{
    name:        "VHHH Jeju Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Jeju%20B737.glb",
    visualLat:   22.313157, visualLon: 113.929794,
    alt:         2,       visualAlt: 2,
    heading:     252,
    scale:       1
},
{
    name:        "VHHH Jeju Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Jeju%20B737.glb",
    visualLat:   22.313653, visualLon: 113.931329,
    alt:         2,       visualAlt: 2,
    heading:     252,
    scale:       1
},
{
    name:        "VHHH HK Express 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/HK%20Express%20A320.glb",
    visualLat:   22.313107, visualLon: 113.934547,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH HK Express 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/HK%20Express%20A320.glb",
    visualLat:   22.312443, visualLon: 113.934751,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH HK Express 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/HK%20Express%20A320.glb",
    visualLat:   22.311253, visualLon: 113.935255,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH AirAsia 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   22.311946, visualLon: 113.927649,
    alt:         2,       visualAlt: 2,
    heading:     210,
    scale:       1
},
{
    name:        "VHHH AirAsia 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Asia%20A320.glb",
    visualLat:   22.31303, visualLon: 113.927214,
    alt:         2,       visualAlt: 2,
    heading:     210,
    scale:       1
},
{
    name:        "VHHH Bangkok Airways 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Bangkok%20Airways%20A320.glb",
    visualLat:   22.310637, visualLon: 113.926898,
    alt:         2,       visualAlt: 2,
    heading:     210,
    scale:       1
},
{
    name:        "VHHH Bangkok Airways 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-41@main/models/Bangkok%20Airways%20A320.glb",
    visualLat:   22.309397, visualLon: 113.926329,
    alt:         2,       visualAlt: 2,
    heading:     210,
    scale:       1
},
{
    name:        "VHHH Batik Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Batik%20Air%20A320.glb",
    visualLat:   22.309406, visualLon: 113.925055,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Batik Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Batik%20Air%20A320.glb",
    visualLat:   22.310056, visualLon: 113.925398,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Batik Air 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Batik%20Air%20A320.glb",
    visualLat:   22.3103400, visualLon: 113.925554,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Cebu Pacific 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   22.311331, visualLon: 113.925935,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Cebu Pacific 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   22.311882, visualLon: 113.926316,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Hainan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Hainan%20A330.glb",
    visualLat:   22.313366, visualLon: 113.9255292,
    alt:         2,       visualAlt: 2,
    heading:     292,
    scale:       1
},
{
    name:        "VHHH Indigo",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-8@main/models/Indigo%20A320.glb",
    visualLat:   22.313648, visualLon: 113.924824,
    alt:         2,       visualAlt: 2,
    heading:     292,
    scale:       1
},
{
    name:        "VHHH Jeju Air 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Jeju%20B737.glb",
    visualLat:   22.313936, visualLon: 113.924186,
    alt:         2,       visualAlt: 2,
    heading:     292,
    scale:       1
},
{
    name:        "VHHH Jeju Air 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Jeju%20B737.glb",
    visualLat:   22.314195, visualLon: 113.923572,
    alt:         2,       visualAlt: 2,
    heading:     292,
    scale:       1
},
{
    name:        "VHHH Lion Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Lion%20Air%20B737.glb",
    visualLat:   22.314873, visualLon: 113.9292324,
    alt:         2,       visualAlt: 2,
    heading:     30,
    scale:       1
},
{
    name:        "VHHH Vietjet Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Vietjet%20A321.glb",
    visualLat:   22.315267, visualLon: 113.923827,
    alt:         2,       visualAlt: 2,
    heading:     270,
    scale:       1
},
{
    name:        "VHHH Cathay Pacific 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Cathay%20Pacific%20A321.glb",
    visualLat:   22.314944, visualLon: 113.924733,
    alt:         2,       visualAlt: 2,
    heading:     120,
    scale:       1
},
{
    name:        "VHHH Cathay Pacific 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   22.314517, visualLon: 113.925511,
    alt:         2,       visualAlt: 2,
    heading:     120,
    scale:       1
},
{
    name:        "VHHH Cathay Pacific 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Cathay%20Pacific%20A321.glb",
    visualLat:   22.314215, visualLon: 113.926267,
    alt:         2,       visualAlt: 2,
    heading:     120,
    scale:       1
},
{
    name:        "VHHH Cathay Pacific 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Cathay%20Pacific%20A321.glb",
    visualLat:   22.313733, visualLon: 113.928005,
    alt:         2,       visualAlt: 2,
    heading:     78,
    scale:       1
},
{
    name:        "VHHH Cathay Pacific 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-40@main/models/Cathay%20Pacific%20A321.glb",
    visualLat:   22.314125, visualLon: 113.929298,
    alt:         2,       visualAlt: 2,
    heading:     78,
    scale:       1
},
{
    name:        "VHHH British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/British%20Airways%20777.glb",
    visualLat:   22.314576, visualLon: 113.930629,
    alt:         2,       visualAlt: 2,
    heading:     78,
    scale:       1
},
{
    name:        "VHHH United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   22.317276, visualLon: 113.929599,
    alt:         2,       visualAlt: 2,
    heading:     348,
    scale:       1
},
{
    name:        "VHHH Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   22.317751, visualLon: 113.930613,
    alt:         2,       visualAlt: 2,
    heading:     168,
    scale:       1
},
{
    name:        "VHHH Egyptair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-292@main/models/Egyptair%20A330.glb",
    visualLat:   22.317062, visualLon: 113.930945,
    alt:         2,       visualAlt: 2,
    heading:     168,
    scale:       1
},
{
    name:        "VHHH Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   22.317459, visualLon: 113.932967,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH China Southern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/China%20Southern%20A330.glb",
    visualLat:   22.318641, visualLon: 113.932490,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-39@main/models/ANA%20A320.glb",
    visualLat:   22.307455, visualLon: 113.917985,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH Vietnam Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Vietnam%20Airlines%20A350.glb",
    visualLat:   22.308771, visualLon: 113.917437,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH ANZ",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   22.312815, visualLon: 113.915994,
    alt:         2,       visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "VHHH Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Qantas%20A350.glb",
    visualLat:   22.313291, visualLon: 113.917287,
    alt:         2,       visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "VHHH Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   22.310091, visualLon: 113.918564,
    alt:         2,       visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "VHHH EVA Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   22.307555, visualLon: 113.919438,
    alt:         2,       visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "YSSY Qantas 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -33.93243, visualLon: 151.1679,
    alt:         2,         visualAlt: 2,
    heading:     200,
    scale:       1
},
{
    name:        "YSSY Qantas 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/Qantas%20737.glb",
    visualLat:   -33.9305,  visualLon: 151.1674,
    alt:         2,         visualAlt: 2,
    heading:     173,
    scale:       1
},
{
    name:        "YSSY Qantas 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -33.92985, visualLon: 151.1673,
    alt:         2,         visualAlt: 2,
    heading:     173,
    scale:       1
},
{
    name:        "YSSY Qantas 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -33.93114, visualLon: 151.1676,
    alt:         2,         visualAlt: 2,
    heading:     172,
    scale:       1
},
{
    name:        "YSSY Qantas 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -33.93803, visualLon: 151.1693,
    alt:         2,         visualAlt: 2,
    heading:     162,
    scale:       1
},
{
    name:        "YSSY American Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   -33.935544, visualLon: 151.167961,
    alt:         2,         visualAlt: 2,
    heading:     165,
    scale:       1
},
{
    name:        "YSSY Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   -33.938330, visualLon: 151.168335,
    alt:         2,         visualAlt: 2,
    heading:     340,
    scale:       1
},
{
    name:        "YSSY Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   -33.93947, visualLon: 151.1691,
    alt:         2,         visualAlt: 2,
    heading:     341,
    scale:       1
},
{
    name:        "YSSY Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   -33.938838, visualLon: 151.166404,
    alt:         2,         visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "YSSY Qatar Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Qatar%20787.glb",
    visualLat:   -33.938655, visualLon: 151.165203,
    alt:         2,         visualAlt: 2,
    heading:     354,
    scale:       1
},
{
    name:        "YSSY Jetstar 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jetstar%20A320.glb",
    visualLat:   -33.93483, visualLon: 151.1776,
    alt:         2,         visualAlt: 2,
    heading:     187,
    scale:       1
},
{
    name:        "YSSY Jetstar 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jetstar%20A320.glb",
    visualLat:   -33.93561, visualLon: 151.1774,
    alt:         2,         visualAlt: 2,
    heading:     187,
    scale:       1
},
{
    name:        "YSSY Jetstar 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   -33.93593, visualLon: 151.1771,
    alt:         2,         visualAlt: 2,
    heading:     350,
    scale:       1
},
{
    name:        "YSSY Fiji",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   -33.940048, visualLon: 151.163769,
    alt:         2,        visualAlt: 2,
    heading:     360,
    scale:       1
},
{
    name:        "YSSY United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   -33.940342, visualLon: 151.164617,
    alt:         2,        visualAlt: 2,
    heading:     251,
    scale:       1
},
{
    name:        "YSSY Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   -33.940004, visualLon: 151.166119,
    alt:         2,        visualAlt: 2,
    heading:     251,
    scale:       1
},
{
    name:        "YSSY Hawaiian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   -33.939276, visualLon: 151.169627,
    alt:         2,        visualAlt: 2,
    heading:     160,
    scale:       1
},
{
    name:        "YSSY Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   -33.936342, visualLon: 151.170054,
    alt:         2,        visualAlt: 2,
    heading:     71,
    scale:       1
},
{
    name:        "YSSY Phillipines Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   -33.934033, visualLon: 151.167589,
    alt:         2,        visualAlt: 2,
    heading:     173,
    scale:       1
},
{
    name:        "YSSY Cathay Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Cathay%20Pacific%20777.glb",
    visualLat:   -33.931620, visualLon: 151.178436,
    alt:         2,        visualAlt: 2,
    heading:     97,
    scale:       1
},
{
    name:        "YSSY Asiana",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Asiana%20A330.glb",
    visualLat:   -33.931825, visualLon: 151.179562,
    alt:         2,        visualAlt: 2,
    heading:     97,
    scale:       1
},
{
    name:        "YSSY Air India",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20India%20787.glb",
    visualLat:   -33.931007, visualLon: 151.176601,
    alt:         2,        visualAlt: 2,
    heading:     97,
    scale:       1
},
{
    name:        "YSSY British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   -33.935547, visualLon: 151.179895,
    alt:         2,        visualAlt: 2,
    heading:     187,
    scale:       1
},
{
    name:        "YSSY Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   -33.936249, visualLon: 151.179798,
    alt:         2,        visualAlt: 2,
    heading:     187,
    scale:       1
},
{
    name:        "YSSY ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/ANA%20787.glb",
    visualLat:   -33.935902, visualLon: 151.179122,
    alt:         2,        visualAlt: 2,
    heading:     7,
    scale:       1
},
{
    name:        "YSSY Eva Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Eva%20Air%20777.glb",
    visualLat:   -33.936667, visualLon: 151.178822,
    alt:         2,        visualAlt: 2,
    heading:     7,
    scale:       1
},
{
    name:        "YMML Qantas 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -37.66651, visualLon: 144.849,
    alt:         58.5,      visualAlt: 58.5,
    heading:     70,
    scale:       1
},
{
    name:        "YMML Qantas 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -37.66652, visualLon: 144.8497,
    alt:         58.6,      visualAlt: 58.6,
    heading:     175,
    scale:       1
},
{
    name:        "YMML Qantas 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/Qantas%20737.glb",
    visualLat:   -37.66769, visualLon: 144.8465,
    alt:         57.5,      visualAlt: 57.5,
    heading:     70,
    scale:       1
},
{
    name:        "YMML Qantas 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/Qantas%20737.glb",
    visualLat:   -37.66789, visualLon: 144.8446,
    alt:         56.6,      visualAlt: 56.6,
    heading:     72,
    scale:       1
},
{
    name:        "YMML Qantas 6",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -37.6689,  visualLon: 144.8452,
    alt:         57.3,      visualAlt: 57.3,
    heading:     282,
    scale:       1
},
{
    name:        "YMML Qantas 7",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Qantas%20B787.glb",
    visualLat:   -37.670692, visualLon: 144.846342,
    alt:         57.5,      visualAlt: 57.5,
    heading:     77,
    scale:       1
},
{
    name:        "YMML Qantas 8",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -37.670667, visualLon: 144.847200,
    alt:         57.8,      visualAlt: 57.8,
    heading:     77,
    scale:       1
},
{
    name:        "YMML Qantas 9",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -37.670870, visualLon: 144.845682,
    alt:         57.2,      visualAlt: 57.2,
    heading:     77,
    scale:       1
},
{
    name:        "YMML Air New Zealand",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   -37.66758, visualLon: 144.8436,
    alt:         56.6,      visualAlt: 56.6,
    heading:     344,
    scale:       1
},
{
    name:        "YMML Jetstar 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Jetstar%20787.glb",
    visualLat:   -37.669083,  visualLon: 144.846857,
    alt:         57.6,      visualAlt: 57.6,
    heading:     273,
    scale:       1
},
{
    name:        "YMML Jetstar 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jetstar%20A320.glb",
    visualLat:   -37.67612, visualLon: 144.8483,
    alt:         58.3,  visualAlt: 58.3,
    heading:     258,
    scale:       1
},
{
    name:        "YMML Jetstar 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jetstar%20A320.glb",
    visualLat:   -37.67613, visualLon: 144.8475,
    alt:         58,    visualAlt: 58,
    heading:     259,
    scale:       1
},
{
    name:        "YMML Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Emirates%20A380.glb",
    visualLat:   -37.66555, visualLon: 144.8448,
    alt:         57,      visualAlt: 57,
    heading:     258,
    scale:       1
},
{
    name:        "YMML Fiji",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   -37.66796, visualLon: 144.8526,
    alt:         59.3,    visualAlt: 59.3,
    heading:     172,
    scale:       1
},
{
    name:        "YMML Malaysia Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Malaysia%20Airlines%20777.glb",
    visualLat:   -37.67352, visualLon: 144.8451,
    alt:         57.05,    visualAlt: 57.05,
    heading:     258,
    scale:       1
},
{
    name:        "YMML United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   -37.668265, visualLon: 144.843541,
    alt:         56.6,       visualAlt: 56.6,
    heading:     344,
    scale:       1
},
{
    name:        "YMML Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   -37.667636, visualLon: 144.849214,
    alt:         58.5,       visualAlt: 58.5,
    heading:     344,
    scale:       1
},
{
    name:        "YMML Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   -37.667801, visualLon: 144.851805,
    alt:         59.2,       visualAlt: 59.2,
    heading:     344,
    scale:       1
},
{
    name:        "YMML Thai",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Thai%20777.glb",
    visualLat:   -37.667602, visualLon: 144.849935,
    alt:         58.9,       visualAlt: 58.9,
    heading:     164,
    scale:       1
},
{
    name:        "YMML China Eastern",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-28@main/models/China%20Eastern%20B777.glb",
    visualLat:   -37.666846, visualLon: 144.849063,
    alt:         58.5,       visualAlt: 58.5,
    heading:     344,
    scale:       1
},
{
    name:        "YMML Japan Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/Japan%20Airlines%20767.glb",
    visualLat:   -37.671216, visualLon: 144.845872,
    alt:         57.2,       visualAlt: 57.2,
    heading:     258,
    scale:       1
},
{
    name:        "YMML Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   -37.671105, visualLon: 144.847223,
    alt:         57.8,       visualAlt: 57.8,
    heading:     290,
    scale:       1
},
{
    name:        "YMML Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   -37.672786, visualLon: 144.846639,
    alt:         57.5,      visualAlt: 57.5,
    heading:     78,
    scale:       1
},
{
    name:        "NZAA Air New Zealand 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   -37.00638, visualLon: 174.7829,
    alt:         5.63,      visualAlt: 5.63,
    heading:     208,
    scale:       1
},
{
    name:        "NZAA Air New Zealand 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   -37.00685, visualLon: 174.7889,
    alt:         5.43,      visualAlt: 5.43,
    heading:     330,
    scale:       1
},
{
    name:        "NZAA Air New Zealand 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   -37.00714, visualLon: 174.7905,
    alt:         5.43,      visualAlt: 5.43,
    heading:     253,
    scale:       1
},
{
    name:        "NZAA Air New Zealand 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   -37.006371510826945, visualLon: 174.7933001251821,
    alt:         5.43,      visualAlt: 5.43,
    heading:     255,
    scale:       1
},
{
    name:        "NZAA Qantas 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -37.00478, visualLon: 174.7788,
    alt:         5.83,      visualAlt: 5.83,
    heading:     253,
    scale:       1
},
{
    name:        "NZAA Qantas 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -37.00748, visualLon: 174.7824,
    alt:         5.43,      visualAlt: 5.43,
    heading:     208,
    scale:       1
},
{
    name:        "NZAA Singapore",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Singapore%20A350.glb",
    visualLat:   -37.00807, visualLon: 174.7817,
    alt:         5.43,      visualAlt: 5.43,
    heading:     310,
    scale:       1
},
{
    name:        "NZAA Fiji",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   -37.005243, visualLon: 174.776975,
    alt:         5.83,       visualAlt: 5.83,
    heading:     253,
    scale:       1
},
{
    name:        "NZAA United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   -37.006349, visualLon: 174.781985,
    alt:         5.63,       visualAlt: 5.63,
    heading:     28,
    scale:       1
},
{
    name:        "NZAA American",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   174.781470, visualLon: 174.781470,
    alt:         5.83,       visualAlt: 5.83,
    heading:     28,
    scale:       1
},
{
    name:        "NZAA Korean Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-9@main/models/Korean%20Air%20787.glb",
    visualLat:   -37.008293, visualLon: 174.782339,
    alt:         5.43,       visualAlt: 5.43,
    heading:     245,
    scale:       1
},
{
    name:        "NZAA Air China",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20China%20787.glb",
    visualLat:   -37.006658, visualLon: 174.792376,
    alt:         5.43,       visualAlt: 5.43,
    heading:     253,
    scale:       1
},
{
    name:        "NZAA Emirates",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Emirates%20777.glb",
    visualLat:   -37.006975, visualLon: 174.791432,
    alt:         5.43,       visualAlt: 5.43,
    heading:     253,
    scale:       1
},
{
    name:        "NFFN Fiji Airways 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   -17.75162, visualLon: 177.4512,
    alt:         6.3,       visualAlt: 6.3,
    heading:     105,
    scale:       1
},
{
    name:        "NFFN Fiji Airways 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Fiji%20A330.glb",
    visualLat:   -17.751333, visualLon: 177.450406,
    alt:         6.3,       visualAlt: 6.3,
    heading:     105,
    scale:       1
},
{
    name:        "NFFN Air New Zealand 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-29@main/models/Air%20New%20Zealand%20777.glb",
    visualLat:   -17.752155, visualLon: 177.450239,
    alt:         6.3,       visualAlt: 6.3,
    heading:     18,
    scale:       1
},
{
    name:        "NFFN Air New Zealand 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-4@main/models/Air%20New%20Zealand%20A320.glb",
    visualLat:   -17.752829, visualLon: 177.449891,
    alt:         6.3,       visualAlt: 6.3,
    heading:     17,
    scale:       1
},
{
    name:        "NFFN Qantas",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Qantas%20A330.glb",
    visualLat:   -17.75246, visualLon: 177.4517,
    alt:         6.3,       visualAlt: 6.3,
    heading:     106,
    scale:       1
},
{
    name:        "NFFN Jetstar",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jetstar%20A320.glb",
    visualLat:   -17.75267, visualLon: 177.4524,
    alt:         6.7,       visualAlt: 6.7,
    heading:     107,
    scale:       1
},
{
    name:        "VRMM Sri Lankan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Sri%20Lankan%20A320.glb",
    visualLat:   4.181347,  visualLon: 73.52743,
    alt:         0,         visualAlt: 0,
    heading:     181,
    scale:       1
},
{
    name:        "VRMM Turkish",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Turkish%20777.glb",
    visualLat:   4.180604,  visualLon: 73.52746,
    alt:         0,         visualAlt: 0,
    heading:     182,
    scale:       1
},
{
    name:        "VRMM Cessna 172",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Cessna%20172.glb",
    visualLat:   4.195636,  visualLon: 73.5331,
    alt:         0,         visualAlt: 0,
    heading:     212,
    scale:       1
},
{
    name:        "VRMM G6000",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   4.19608,   visualLon: 73.53303,
    alt:         0,         visualAlt: 0,
    heading:     167,
    scale:       1
},
{
    name:        "LGSR Aegan",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Aegean%20A320.glb",
    visualLat:   36.403,    visualLon: 25.47384,
    alt:         11.75,     visualAlt: 11.75,
    heading:     150,
    scale:       1
},
{
    name:        "LGSR Ryanair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
    visualLat:   36.40338,  visualLon: 25.47367,
    alt:         11.7,      visualAlt: 11.7,
    heading:     150,
    scale:       1
},
{
    name:        "LGSR Easyjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
    visualLat:   36.40417,  visualLon: 25.47332,
    alt:         11.4,      visualAlt: 11.4,
    heading:     151,
    scale:       1
},
{
    name:        "LGSR Wizz",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
    visualLat:   36.40379,  visualLon: 25.4735,
    alt:         11.55,     visualAlt: 11.55,
    heading:     151,
    scale:       1
},
{
    name:        "LEPA Jet2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Jet%202%20737.glb",
    visualLat:   39.5504,   visualLon: 2.728077,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     60,
    scale:       1
},
{
    name:        "LEPA Easyjet 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
    visualLat:   39.54982,  visualLon: 2.726837,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     61,
    scale:       1
},
{
    name:        "LEPA Easyjet 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
    visualLat:   39.54475,  visualLon: 2.731225,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     265,
    scale:       1
},
{
    name:        "LEPA Ryanair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
    visualLat:   39.55238,  visualLon: 2.732185,
    alt:         -0.67,    visualAlt: -0.67,
    heading:     115,
    scale:       1
},
{
    name:        "LEPA British Airways",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/British%20Airways%20777.glb",
    visualLat:   39.55079,  visualLon: 2.729084,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     105,
    scale:       1
},
{
    name:        "LEPA Eurowings 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Eurowings%20A320.glb",
    visualLat:   39.54722,  visualLon: 2.736839,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     325,
    scale:       1
},
{
    name:        "LEPA Eurowings 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Eurowings%20A320.glb",
    visualLat:   39.54731,  visualLon: 2.733504,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     145,
    scale:       1
},
{
    name:        "LEPA Wizz",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
    visualLat:   39.55161,  visualLon: 2.727292,
    alt:         -0.75,     visualAlt: -0.75,
    heading:     117,
    scale:       1
},
{
    name:        "LEPA Vueling",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-37@main/models/Vueling%20A320NEO.glb",
    visualLat:   39.54889,  visualLon: 2.737984,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     160,
    scale:       1
},
{
    name:        "LEPA Condor",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-6@main/models/Condor%20A321.glb",
    visualLat:   39.54876,  visualLon: 2.735484,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     315,
    scale:       1
},
{
    name:        "LEPA Iberia",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Iberia%20A330.glb",
    visualLat:   39.54496,  visualLon: 2.731707,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     240,
    scale:       1
},
{
    name:        "LEPA Lufthansa",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Lufthansa%20A340.glb",
    visualLat:   39.545448, visualLon: 2.732707,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     240,
    scale:       1
},
{
    name:        "LEPA Norwegian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-26@main/models/Norwegian%20737.glb",
    visualLat:   39.548073, visualLon: 2.736256,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     315,
    scale:       1
},
{
    name:        "LEPA SAS",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
    visualLat:   39.549898, visualLon: 2.737058,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     160,
    scale:       1
},
{
    name:        "LEPA TAP",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-1@main/models/TAP%20A320.glb",
    visualLat:   39.546792, visualLon: 2.733766,
    alt:         -0.6,      visualAlt: -0.6,
    heading:     145,
    scale:       1
},
{
    name:        "LEPA Brussels",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Brussels%20Airlines.glb",
    visualLat:   39.549836, visualLon: 2.734517,
    alt:         -0.7,      visualAlt: -0.7,
    heading:     60,
    scale:       1
},
{
    name:        "LEPA KLM",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/KLM%20777.glb",
    visualLat:   39.550299, visualLon: 2.735448,
    alt:         -0.7,      visualAlt: -0.7,
    heading:     60,
    scale:       1
},
{
    name:        "LEPA Swiss",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/Swiss%20B777.glb",
    visualLat:   39.550688, visualLon: 2.736290,
    alt:         -0.7,      visualAlt: -0.7,
    heading:     70,
    scale:       1
},
{
    name:        "LEPA Austrian",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Austrian%20777.glb",
    visualLat:   39.551445, visualLon: 2.730041,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     105,
    scale:       1
},
{
    name:        "LEPA Air Baltic",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Baltic%20Dash8%20Q400.glb",
    visualLat:   39.552854, visualLon: 2.733101,
    alt:         -0.67,     visualAlt: -0.67,
    heading:     115,
    scale:       1
},
{
    name:        "LEPA United",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   39.548351, visualLon: 2.738409,
    alt:         -0.8,      visualAlt: -0.8,
    heading:     160,
    scale:       1
},
{
    name:        "GCLA Ryanair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
    visualLat:   28.62063,  visualLon: -17.75365,
    alt:         17.6,        visualAlt: 17.6,
    heading:     0,
    scale:       1
},
{
    name:        "GCLA Easyjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
    visualLat:   28.62121,  visualLon: -17.75343,
    alt:         17.3,        visualAlt: 17.3,
    heading:     358,
    scale:       1
},
{
    name:        "GCLA Eurowings",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Eurowings%20A320.glb",
    visualLat:   28.62244,  visualLon: -17.75344,
    alt:         17.4,        visualAlt: 17.4,
    heading:     358,
    scale:       1
},
{
    name:        "GCLA Wizz",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
    visualLat:   28.62444,  visualLon: -17.75343,
    alt:         17.4,        visualAlt: 17.4,
    heading:     359,
    scale:       1
},
{
    name:        "GCLA TAP Air Portugal",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-12@main/models/TAP%20A330.glb",
    visualLat:   28.62344,  visualLon: -17.7534,
    alt:         17.6,        visualAlt: 17.6,
    heading:     358,
    scale:       1
},
{
    name:        "LGSK Easyjet",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-32@main/models/Easyjet%20A320.glb",
    visualLat:   39.17844,  visualLon: 23.50182,
    alt:         9,         visualAlt: 9,
    heading:     195,
    scale:       1
},
{
    name:        "LGSK Ryanair",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Ryanair%20737.glb",
    visualLat:   39.17957,  visualLon: 23.50239,
    alt:         9,         visualAlt: 9,
    heading:     194,
    scale:       1
},
{
    name:        "LGSK Wizz",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-13@main/models/Wizz%20A320NEO.glb",
    visualLat:   39.17995,  visualLon: 23.50253,
    alt:         9,         visualAlt: 9,
    heading:     196,
    scale:       1
},
{
    name:        "LGSK SAS",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-24@main/models/SAS%20A320.glb",
    visualLat:   39.17653,  visualLon: 23.50168,
    alt:         9,         visualAlt: 9,
    heading:     195,
    scale:       1
},
{
    name:        "LGSK Cessna 172 Seaplane",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-6@main/models/Cessna%20172%20Seaplane.glb",
    visualLat:   39.18845,  visualLon: 23.50742,
    alt:         8.4,         visualAlt: 8.4,
    heading:     168,
    scale:       1
},
{
    name:        "LGSK DHC2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/DHC2.glb",
    visualLat:   39.1884,   visualLon: 23.5103,
    alt:         8.4,         visualAlt: 8.4,
    heading:     106,
    scale:       1
},
{
    name:        "FMEE Corsair 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-22@main/models/Corsair%20A330.glb",
    visualLat:   -20.89072, visualLon: 55.51158,
    alt:         11.5,      visualAlt: 11.5,
    heading:     115,
    scale:       1
},
{
    name:        "FMEE Corsair 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-22@main/models/Corsair%20A330.glb",
    visualLat:   -20.89123, visualLon: 55.51283,
    alt:         11.5,      visualAlt: 11.5,
    heading:     123,
    scale:       1
},
{
    name:        "FMEE Air France",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-36@main/models/Air%20France%20777.glb",
    visualLat:   -20.89097, visualLon: 55.51222,
    alt:         11.5,      visualAlt: 11.5,
    heading:     114,
    scale:       1
},
{
    name:        "KDJT Allegiant Air",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-19@main/models/Allegiant%20A320.glb",
    visualLat:   26.68801,  visualLon: -80.09226,
    alt:         5,         visualAlt: 5,
    heading:     50,
    scale:       1
},
{
    name:        "KDJT American Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   26.68642,  visualLon: -80.09345,
    alt:         5,         visualAlt: 5,
    heading:     305,
    scale:       1
},
{
    name:        "KDJT United 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   26.68695,  visualLon: -80.09255,
    alt:         5,         visualAlt: 5,
    heading:     233,
    scale:       1
},
{
    name:        "KDJT United 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-25@main/models/United%20B777.glb",
    visualLat:   26.68734,  visualLon: -80.09200,
    alt:         5,         visualAlt: 5,
    heading:     235,
    scale:       1
},
{
    name:        "KDJT Southwest",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
    visualLat:   26.68775,  visualLon: -80.09255,
    alt:         5,         visualAlt: 5,
    heading:     55,
    scale:       1
},
{
    name:        "KDJT Jetblue",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-23@main/models/Jetblue%20A321.glb",
    visualLat:   26.68548,  visualLon: -80.08872,
    alt:         5,         visualAlt: 5,
    heading:     220,
    scale:       1
},
{
    name:        "KDJT Air Canada",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-3@main/models/Air%20Canada%20A330.glb",
    visualLat:   26.68639,  visualLon: -80.08982,
    alt:         5,         visualAlt: 5,
    heading:     7,
    scale:       1
},
{
    name:        "PHNL Hawaiian 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   21.33559,  visualLon: -157.9241,
    alt:         8.1,       visualAlt: 8.1,
    heading:     325,
    scale:       1
},
{
    name:        "PHNL Hawaiian 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   21.33672,  visualLon: -157.9245,
    alt:         8.8,       visualAlt: 8.8,
    heading:     97,
    scale:       1
},
{
    name:        "PHNL Hawaiian 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   21.33664,  visualLon: -157.9238,
    alt:         8.8,       visualAlt: 8.8,
    heading:     97,
    scale:       1
},
{
    name:        "PHNL Hawaiian 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   21.33082,  visualLon: -157.9285,
    alt:         4.8,       visualAlt: 4.8,
    heading:     230,
    scale:       1
},
{
    name:        "PHNL Hawaiian 5",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/Hawaiian%20A330.glb",
    visualLat:   21.33137,  visualLon: -157.928,
    alt:         4.8,       visualAlt: 4.8,
    heading:     241,
    scale:       1
},
{
    name:        "PHNL American Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-31@main/models/American%20777.glb",
    visualLat:   21.33016,  visualLon: -157.9232,
    alt:         5.5,       visualAlt: 5.5,
    heading:     195,
    scale:       1
},
{
    name:        "PHNL Southwest 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
    visualLat:   21.33009,  visualLon: -157.9206,
    alt:         5.4,       visualAlt: 5.4,
    heading:     15,
    scale:       1
},
{
    name:        "PHNL Southwest 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
    visualLat:   21.32958,  visualLon: -157.9207,
    alt:         5.2,       visualAlt: 5.2,
    heading:     16,
    scale:       1
},
{
    name:        "PHNL Southwest 3",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
    visualLat:   21.32878,  visualLon: -157.9145,
    alt:         4.2,       visualAlt: 4.2,
    heading:     285,
    scale:       1
},
{
    name:        "PHNL Southwest 4",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-17@main/models/Southwest%20737.glb",
    visualLat:   21.32875,  visualLon: -157.9141,
    alt:         4.2,       visualAlt: 4.2,
    heading:     282,
    scale:       1
},
{
    name:        "PHNL ANA",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/ANA%20777.glb",
    visualLat:   21.32903,  visualLon: -157.9234,
    alt:         4.4,       visualAlt: 4.4,
    heading:     230,
    scale:       1
},
{
    name:        "PHNL Bombardier G6000 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   21.33479,  visualLon: -157.9243,
    alt:         7.5,     visualAlt: 7.5,
    heading:     10,
    scale:       1
},
{
    name:        "PHNL Bombardier G6000 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-5@main/models/Bombardier%20G6000.glb",
    visualLat:   21.33449,  visualLon: -157.9244,
    alt:         7.5,     visualAlt: 7.5,
    heading:     9,
    scale:       1
},
{
    name:        "PHNL Private 727",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-10@main/models/Private%20727.glb",
    visualLat:   21.33312,  visualLon: -157.9245,
    alt:         6.7,     visualAlt: 6.7,
    heading:     11,
    scale:       1
},
{
    name:        "PHNL Cessna 172 1",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Cessna%20172.glb",
    visualLat:   21.331,    visualLon: -157.9109,
    alt:         4.4,       visualAlt: 4.4,
    heading:     315,
    scale:       1
},
{
    name:        "PHNL Cessna 172 2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-21@main/models/Cessna%20172.glb",
    visualLat:   21.33115,  visualLon: -157.9108,
    alt:         4.25,      visualAlt: 4.25,
    heading:     136,
    scale:       1
},
{
    name:        "RPVE Phillipine Airlines",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-27@main/models/Phillipines%20Airlines%20777.glb",
    visualLat:   11.92621,  visualLon: 121.9635,
    alt:         3.25,      visualAlt: 3.25,
    heading:     65,
    scale:       1
},
{
    name:        "RPVE Cebu Pacific",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-35@main/models/Cebu%20Pacific%20A320.glb",
    visualLat:   11.92668,  visualLon: 121.9644,
    alt:         3.25,      visualAlt: 3.25,
    heading:     65,
    scale:       1
},
{
    name:        "RPVE Cessna 172 Seaplane",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-6@main/models/Cessna%20172%20Seaplane.glb",
    visualLat:   11.92962,  visualLon: 121.9706,
    alt:         3,      visualAlt: 3,
    heading:     315,
    scale:       1
},
{
    name:        "RPVE DHC2",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-7@main/models/DHC2.glb",
    visualLat:   11.92777,  visualLon: 121.9736,
    alt:         1.4,      visualAlt: 1.4,
    heading:     47,
    scale:       1
},
{
    name:        "ENOE Norse",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-18@main/models/Norse%20787.glb",
    visualLat:   -71.949, visualLon: 2.486,
    alt:         600.9,   visualAlt: 600.9,
    heading:     252,
    scale:       1
},
{
    name:        "ENOE Hi Fly A340",
    model:       "https://cdn.jsdelivr.net/gh/drew-crypto/Geofs-3D-models-34@main/models/Hi%20Fly%20A340.glb",
    visualLat:   -71.952, visualLon: 2.459,
    alt:         602.4,   visualAlt: 602.4,
    heading:     253,
    scale:       1
}
            // Add your plane objects here
        ];

        // This Map keeps track of which models are currently spawned in the world
        const loadedEntities = new Map();

        // Pre-calculate positions and orientations so we don't do heavy math in the loop
        planes.forEach((plane, index) => {
            plane.id = "mod_model_" + index; // Give each model a unique ID
            plane.cartesianPos = Cesium.Cartesian3.fromDegrees(
                plane.visualLon,
                plane.visualLat,
                plane.alt + (plane.visualAlt || 0)
            );
            plane.orientation = Cesium.Transforms.headingPitchRollQuaternion(
                plane.cartesianPos,
                new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(plane.heading || 0), 0, 0)
            );
        });

        // 2. PROXIMITY SPAWNER LOOP (Checks distance every 3 seconds)
        setInterval(() => {
            // IF TRAFFIC IS OFF: Deactivate and remove all loaded models immediately
            if (!isTrafficOn) {
                if (loadedEntities.size > 0) {
                    loadedEntities.forEach(entity => viewer.entities.remove(entity));
                    loadedEntities.clear();
                    viewer.scene.requestRender();
                }
                return;
            }

            // Get the player's current location [lat, lon, alt]
            const playerLla = geofs.aircraft.instance.llaLocation;
            if (!playerLla) return;

            // Convert player location to Cartesian3 for distance calculation
            const playerPos = Cesium.Cartesian3.fromDegrees(playerLla[1], playerLla[0], playerLla[2]);

            // FIRST: Sort all planes strictly into "In Range" and "Out of Range"
            const planesInRange = [];
            const planesOutOfRange = [];

            planes.forEach(plane => {
                const distance = Cesium.Cartesian3.distance(playerPos, plane.cartesianPos);
                if (distance <= RENDER_DISTANCE) {
                    planesInRange.push(plane);
                } else {
                    planesOutOfRange.push(plane);
                }
            });

            // SECOND: Calculate the exact density allowance based ONLY on the planes nearby
            let densityFraction = 1.0;
            if (currentDensity === 'low') densityFraction = 0.33;
            else if (currentDensity === 'medium') densityFraction = 0.66;

            // Math.ceil ensures that if you have 1 plane nearby and density is 33%, it still shows at least 1.
            const allowedRenderCount = Math.ceil(planesInRange.length * densityFraction);

            // THIRD: Process the in-range planes. Keep up to the allowed limit, remove the rest.
            planesInRange.forEach((plane, localIndex) => {
                if (localIndex < allowedRenderCount) {
                    // Under the density limit -> Spawn or Keep
                    if (!loadedEntities.has(plane.id)) {
                        const entity = viewer.entities.add({
                            id: plane.id,
                            position: plane.cartesianPos,
                            orientation: plane.orientation,
                            model: {
                                uri: plane.model,
                                scale: plane.scale,
                                minimumPixelSize: 0,
                                maximumScale: 100000
                            }
                        });
                        loadedEntities.set(plane.id, entity);
                    }
                } else {
                    // Over the density limit -> Remove if currently loaded
                    if (loadedEntities.has(plane.id)) {
                        viewer.entities.remove(loadedEntities.get(plane.id));
                        loadedEntities.delete(plane.id);
                    }
                }
            });

            // FOURTH: Always remove anything that is explicitly out of bounds
            planesOutOfRange.forEach(plane => {
                if (loadedEntities.has(plane.id)) {
                    viewer.entities.remove(loadedEntities.get(plane.id));
                    loadedEntities.delete(plane.id);
                }
            });

            // Ping the renderer if any changes were made
            viewer.scene.requestRender();

        }, 3000); // 3000 milliseconds = 3 seconds

        console.log(TAG, `ENABLED — Proximity spawner active for ${planes.length} aircrafts. Range: ${RENDER_DISTANCE / 1000}km`);
    }
})();

/* =========================================
   SMOCZE WŁOŚCI — SCRIPT.JS
   Wersja z systemem świata, cech, zaklęć, misji i areny
========================================= */

/* ======= sec1_systems.js ======= */
/* =========================================
   SYSTEM WALUT (NAPRAWIONY)
   100 miedzi = 1 srebro, 50 srebra = 1 złoto
   1 złoto = 50 srebra = 5000 miedzi
========================================= */

function totalInCopper() {
    return copper + silver * 100 + gold * 5000;
}

function canAfford(copperCost) {
    return totalInCopper() >= copperCost;
}

function costToCopper(c, s, g) {
    return (c || 0) + (s || 0) * 100 + (g || 0) * 5000;
}

function spendCurrency(copperCost) {
    if (!canAfford(copperCost)) return false;
    let total = totalInCopper() - copperCost;
    gold = Math.floor(total / 5000);
    total %= 5000;
    silver = Math.floor(total / 100);
    copper = total % 100;
    localStorage.setItem('copper', copper);
    localStorage.setItem('silver', silver);
    localStorage.setItem('gold', gold);
    updateCurrencyDisplay();
    return true;
}

function formatCostLabel(c, s, g) {
    const parts = [];
    if (g) parts.push(`${g} złoto`);
    if (s) parts.push(`${s} srebro`);
    if (c) parts.push(`${c} miedź`);
    return parts.join(', ');
}

/* =========================================
   SYSTEM CECH SMOKÓW
========================================= */

function getDefaultDragonStats() {
    return { sila: 5, wytrzymalosc: 5, zrecznosc: 5, inteligencja: 5, sila_woli: 5, szczescie: 5 };
}

function loadDragonStats(num) {
    const stored = localStorage.getItem(`dragon${num}Stats`);
    return stored ? JSON.parse(stored) : getDefaultDragonStats();
}

function saveDragonStats(num, stats) {
    localStorage.setItem(`dragon${num}Stats`, JSON.stringify(stats));
}

function getDragonMaxHP(stats) { return 50 + (stats.wytrzymalosc * 10); }
function getDragonMaxMana(stats) { return 20 + (stats.inteligencja * 5); }
function getDragonMaxFatigue() { return 100; }

function loadDragonVitals(num) {
    return {
        hp: Number(localStorage.getItem(`dragon${num}HP`)) || null,
        mana: Number(localStorage.getItem(`dragon${num}Mana`)) || null,
        fatigue: Number(localStorage.getItem(`dragon${num}Fatigue`)) || 0
    };
}

function saveDragonVitals(num, vitals) {
    if (vitals.hp !== null) localStorage.setItem(`dragon${num}HP`, vitals.hp);
    if (vitals.mana !== null) localStorage.setItem(`dragon${num}Mana`, vitals.mana);
    localStorage.setItem(`dragon${num}Fatigue`, vitals.fatigue);
}

function initDragonVitalsIfNeeded(num, stats) {
    const v = loadDragonVitals(num);
    if (v.hp === null || v.hp === 0) {
        v.hp = getDragonMaxHP(stats);
        v.mana = getDragonMaxMana(stats);
        saveDragonVitals(num, v);
    }
    return v;
}

const STAT_LABELS = {
    sila: 'Siła',
    wytrzymalosc: 'Wytrzymałość',
    zrecznosc: 'Zręczność',
    inteligencja: 'Inteligencja',
    sila_woli: 'Siła Woli',
    szczescie: 'Szczęście'
};
const RAISABLE_STATS = ['sila', 'wytrzymalosc', 'zrecznosc', 'inteligencja', 'sila_woli'];

/* =========================================
   SYSTEM ZAKLĘĆ SMOKÓW
========================================= */

const DRAGON_SPELLS = {
    ogien: [
        { id: 'ogniste_uderzenie', name: 'Ogniste Uderzenie', desc: 'Potężny atak ogniem, zadający obrażenia jednemu celowi.', manaCost: 5 },
        { id: 'sciana_ognia', name: 'Ściana Ognia', desc: 'Smok tworzy barierę z płomieni, blokującą wrogów.', manaCost: 8 },
        { id: 'oddech_smoka', name: 'Smocze Żar', desc: 'Klasyczny oddech smoka — szeroki i niszczycielski.', manaCost: 10 }
    ],
    woda: [
        { id: 'wodne_uderzenie', name: 'Wodne Uderzenie', desc: 'Strumień wody o zabójczej sile trafia w cel.', manaCost: 5 },
        { id: 'lodowy_podmuch', name: 'Lodowy Podmuch', desc: 'Zamarza teren wokół wroga, spowalniając go.', manaCost: 8 },
        { id: 'uzdrawiajacy_strumien', name: 'Uzdrawiający Strumień', desc: 'Smok leczy siebie lub sojusznika strumieniem magicznej wody.', manaCost: 10 }
    ],
    ziemia: [
        { id: 'kamienne_uderzenie', name: 'Kamienne Uderzenie', desc: 'Głaz wali z ogromną siłą w przeciwnika.', manaCost: 5 },
        { id: 'trzesienie_ziemi', name: 'Trzęsienie Ziemi', desc: 'Smok uderza w ziemię, destabilizując wrogów.', manaCost: 8 },
        { id: 'kamienna_skora', name: 'Kamienna Skóra', desc: 'Ciało smoka pokrywa się skałą, zwiększając obronę.', manaCost: 10 }
    ],
    powietrze: [
        { id: 'powietrzne_uderzenie', name: 'Powietrzne Uderzenie', desc: 'Ostra podmuch powietrza tnie jak ostrze.', manaCost: 5 },
        { id: 'cyklon', name: 'Cyklon', desc: 'Smok wznosi spiralę wichru, odrzucając wrogów.', manaCost: 8 },
        { id: 'taniec_wiatru', name: 'Taniec Wiatru', desc: 'Smok staje się nieuchwytny jak wiatr, unikając ataków.', manaCost: 10 }
    ]
};

function loadDragonSpells(num) {
    const stored = localStorage.getItem(`dragon${num}Spells`);
    return stored ? JSON.parse(stored) : [];
}

function saveDragonSpells(num, spells) {
    localStorage.setItem(`dragon${num}Spells`, JSON.stringify(spells));
}

function isDragonEnrolled(num) {
    return localStorage.getItem(`dragon${num}Enrolled`) === 'true';
}

function enrollDragon(num) {
    // costs 2 gold total
    if (!canAfford(10000)) return false; // 2 gold = 10000 copper
    spendCurrency(10000);
    localStorage.setItem(`dragon${num}Enrolled`, 'true');
    return true;
}

function learnSpell(dragonNum, spellId, element) {
    // costs 1 silver = 100 copper per spell
    if (!canAfford(100)) return { ok: false, msg: 'Brakuje ci 1 srebrnej monety za naukę zaklęcia.' };
    const knownSpells = loadDragonSpells(dragonNum);
    if (knownSpells.includes(spellId)) return { ok: false, msg: 'Twój smok już zna to zaklęcie.' };
    const elementSpells = DRAGON_SPELLS[element] || [];
    const spell = elementSpells.find(s => s.id === spellId);
    if (!spell) return { ok: false, msg: 'Nieznane zaklęcie.' };
    if (!spendCurrency(100)) return { ok: false, msg: 'Nie masz wystarczająco pieniędzy.' };
    knownSpells.push(spellId);
    saveDragonSpells(dragonNum, knownSpells);
    return { ok: true, msg: `${dragonNum === 1 ? dragonName : dragonNum === 2 ? secondDragonName : thirdDragonName} nauczył się zaklęcia: ${spell.name}!` };
}

/* =========================================
   SYSTEM MISJI SMOKA (ZMĘCZENIE)
========================================= */

const DRAGON_MISSIONS = [
    { id: 'patrol', name: 'Patrol okolic wioski', duration: 5000, fatigue: 15, reward: { copper: 30 }, desc: 'Krótki lot patrolowy. Smok sprawdza czy okolice są bezpieczne.' },
    { id: 'eskort_karawany', name: 'Eskorta karawany z powietrza', duration: 10000, fatigue: 25, reward: { silver: 1 }, desc: 'Smok leci nad karawaną kupców, odpędzając zagrożenia.' },
    { id: 'polow_ryb', name: 'Połów ryb na jeziorze', duration: 7000, fatigue: 10, reward: { copper: 50 }, desc: 'Smok nurkuje w Jeziorze Snu w poszukiwaniu ryb.' },
    { id: 'wyprawa_las', name: 'Zwiad nad Lasem Mgieł', duration: 12000, fatigue: 30, reward: { silver: 1, copper: 50 }, desc: 'Smok penetruje Las Mgieł z powietrza, szukając informacji.' },
    { id: 'wyprawa_gory', name: 'Lot przez Góry Sarak', duration: 18000, fatigue: 45, reward: { silver: 3 }, desc: 'Długa wyprawa przez niebezpieczne górskie szczyty.' },
    { id: 'misja_tajna', name: 'Tajna misja dla Posterunku', duration: 22000, fatigue: 60, reward: { silver: 5 }, desc: 'Kapitan Posterunku prosi o dyskretną pomoc. Szczegóły niedostępne.' }
];

function loadDragonMission(num) {
    const stored = localStorage.getItem(`dragon${num}Mission`);
    return stored ? JSON.parse(stored) : null;
}

function saveDragonMission(num, mission) {
    if (mission === null) {
        localStorage.removeItem(`dragon${num}Mission`);
    } else {
        localStorage.setItem(`dragon${num}Mission`, JSON.stringify(mission));
    }
}

function startDragonMission(dragonNum, missionId) {
    const mission = DRAGON_MISSIONS.find(m => m.id === missionId);
    if (!mission) return { ok: false, msg: 'Nieznana misja.' };
    const vitals = loadDragonVitals(dragonNum);
    if (vitals.fatigue + mission.fatigue > 100) {
        return { ok: false, msg: `Smok jest zbyt zmęczony na tę misję (zmęczenie: ${vitals.fatigue}/100). Pozwól mu odpocząć.` };
    }
    const existing = loadDragonMission(dragonNum);
    if (existing) return { ok: false, msg: 'Smok jest już na misji.' };

    const missionData = {
        ...mission,
        endTime: Date.now() + mission.duration,
        dragonNum
    };
    saveDragonMission(dragonNum, missionData);
    return { ok: true, msg: `Smok wyrusza na misję: ${mission.name}. Wróci za ${formatTime(mission.duration)}.` };
}

function completeDragonMission(dragonNum) {
    const mission = loadDragonMission(dragonNum);
    if (!mission) return;
    Object.entries(mission.reward).forEach(([type, amt]) => adjustCurrency(type, amt));
    const vitals = loadDragonVitals(dragonNum);
    vitals.fatigue = Math.min(100, vitals.fatigue + mission.fatigue);
    saveDragonVitals(dragonNum, vitals);
    saveDragonMission(dragonNum, null);
    let rewardText = Object.entries(mission.reward).map(([t,a]) => `${a} ${t}`).join(', ');
    alert(`Misja zakończona! ${mission.name}\nNagroda: ${rewardText}\nZmęczenie smoka wzrosło o ${mission.fatigue}.`);
    updateHomeTab();
}

function restDragon(dragonNum) {
    const vitals = loadDragonVitals(dragonNum);
    const before = vitals.fatigue;
    vitals.fatigue = Math.max(0, vitals.fatigue - 20);
    saveDragonVitals(dragonNum, vitals);
    return `Smok odpoczął. Zmęczenie: ${before} → ${vitals.fatigue}.`;
}

/* =========================================
   SYSTEM ARENY
========================================= */

// Walki smoka — 3 dziennie
function loadArenaFights(dragonNum) {
    const today = new Date().toISOString().slice(0,10);
    const key = `dragon${dragonNum}ArenaDate`;
    const countKey = `dragon${dragonNum}ArenaCount`;
    if (localStorage.getItem(key) !== today) {
        localStorage.setItem(key, today);
        localStorage.setItem(countKey, '0');
    }
    return Number(localStorage.getItem(countKey)) || 0;
}

function incrementArenaFights(dragonNum) {
    const countKey = `dragon${dragonNum}ArenaCount`;
    const count = loadArenaFights(dragonNum) + 1;
    localStorage.setItem(countKey, count);
    return count;
}

const ARENA_OPPONENTS = [
    { name: 'Dziki Szczur Podziemi', sila: 4, wytrzymalosc: 3, zrecznosc: 6 },
    { name: 'Leśny Padalec', sila: 5, wytrzymalosc: 5, zrecznosc: 5 },
    { name: 'Smoczek z Gór', sila: 7, wytrzymalosc: 6, zrecznosc: 4 },
    { name: 'Starszy Gryf', sila: 8, wytrzymalosc: 7, zrecznosc: 7 },
    { name: 'Chimera Miejska', sila: 10, wytrzymalosc: 9, zrecznosc: 8 },
];

function simulateDragonFight(dragonNum) {
    const fightsDone = loadArenaFights(dragonNum);
    if (fightsDone >= 3) return { ok: false, msg: 'Ten smok walczył już 3 razy dzisiaj. Wróć jutro.' };

    const vitals = loadDragonVitals(dragonNum);
    if (vitals.fatigue >= 80) return { ok: false, msg: 'Smok jest zbyt zmęczony na walkę (zmęczenie ≥80). Pozwól mu odpocząć.' };

    const mission = loadDragonMission(dragonNum);
    if (mission) return { ok: false, msg: 'Smok jest na misji. Nie może teraz walczyć.' };

    const stats = loadDragonStats(dragonNum);
    const opponent = ARENA_OPPONENTS[Math.min(fightsDone, ARENA_OPPONENTS.length - 1)];

    // Simple combat formula with some randomness
    const dragonPower = stats.sila * 1.5 + stats.wytrzymalosc + stats.zrecznosc * 0.8 + stats.sila_woli * 0.5;
    const oppPower = opponent.sila * 1.5 + opponent.wytrzymalosc + opponent.zrecznosc * 0.8;
    const roll = (Math.random() * 0.4 + 0.8); // 0.8 - 1.2
    const luck = stats.szczescie / 10; // 0.5 - 1.5 bonus

    const win = (dragonPower * roll + luck * 2) > oppPower;

    incrementArenaFights(dragonNum);
    vitals.fatigue = Math.min(100, vitals.fatigue + 10);
    saveDragonVitals(dragonNum, vitals);

    let result = '';
    if (win) {
        // raise a random raisable stat
        const stat = RAISABLE_STATS[Math.floor(Math.random() * RAISABLE_STATS.length)];
        stats[stat]++;
        saveDragonStats(dragonNum, stats);
        adjustCurrency('silver', 1);
        result = `🏆 ZWYCIĘSTWO!\n\nTwój smok pokonał ${opponent.name}!\nNagroda: 1 srebro.\n${STAT_LABELS[stat]} wzrósł o 1!`;
    } else {
        result = `💀 PORAŻKA\n\nTwój smok przegrał z ${opponent.name}.\nBrak nagrody. Nie martw się — następnym razem pójdzie lepiej.`;
    }

    return { ok: true, win, msg: result, fightsDone: fightsDone + 1 };
}

// Turniej gracza — 1 walka dziennie
function loadPlayerTournament() {
    const today = new Date().toISOString().slice(0,10);
    if (localStorage.getItem('playerTournDate') !== today) {
        localStorage.setItem('playerTournDate', today);
        localStorage.setItem('playerTournDone', 'false');
    }
    return localStorage.getItem('playerTournDone') === 'true';
}

function playerTournamentFight() {
    if (loadPlayerTournament()) return { ok: false, msg: 'Walczyłeś już dziś w turnieju. Wróć jutro.' };

    const opponents = [
        { name: 'Karczmarz Broda', desc: 'Tężyzna fizyczna, zero techniki.' },
        { name: 'Strażniczka Mira', desc: 'Szybka, doświadczona.' },
        { name: 'Wędrowny Rycerz', desc: 'Veteran wielu bitew.' }
    ];
    const opp = opponents[Math.floor(Math.random() * opponents.length)];
    const win = Math.random() > 0.4;

    localStorage.setItem('playerTournDone', 'true');

    if (win) {
        adjustCurrency('silver', 2);
        return { ok: true, msg: `⚔️ TURNIEJ — Twój rywal to ${opp.name}.\n${opp.desc}\n\n🏆 ZWYCIĘSTWO! Nagroda: 2 srebro.` };
    } else {
        return { ok: true, msg: `⚔️ TURNIEJ — Twój rywal to ${opp.name}.\n${opp.desc}\n\n💀 Przegrałeś. Trening czyni mistrza.` };
    }
}

/* =========================================
   DYNAMICZNY OPIS DOMU
========================================= */

function getDragonHomeDesc() {
    const dragons = [];
    if (eggHeats >= 3) dragons.push({ name: dragonName, element: chosenDragon, num: 1 });
    if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ name: secondDragonName, element: secondDragonElement, num: 2 });
    if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ name: thirdDragonName, element: thirdDragonElement, num: 3 });

    if (dragons.length === 0) {
        return 'Dom jest cichy. Na stoliku leży jajko — ciepłe, pulsujące życiem. Czekasz.';
    }

    if (dragons.length === 1) {
        const d = dragons[0];
        const descs = {
            ogien: `${d.name} leży zwinięty przy kominku i śpi. Od czasu do czasu z nozdrzy wydobywa się mały język ognia — pewnie śni o walce.`,
            woda: `${d.name} siedzi przy misce z wodą i wpatruje się w nią jak zahipnotyzowany. Woda w misce kręci się sama, powoli.`,
            ziemia: `${d.name} leży dokładnie tam, gdzie go zostawiłeś. Nie ruszył się ani o centymetr. Jak posąg — tylko ciepły.`,
            powietrze: `${d.name} siedzi na najwyższej półce i stamtąd patrzy na pokój. Jak tam wlazł — nie masz pojęcia.`
        };
        return descs[d.element] || `${d.name} czeka spokojnie.`;
    }

    if (dragons.length === 2) {
        const [d1, d2] = dragons;
        const pair = [d1.element, d2.element].sort().join('_');
        if (pair === 'ogien_woda') {
            const f = dragons.find(d => d.element === 'ogien');
            const w = dragons.find(d => d.element === 'woda');
            return `Wchodząc do domu widzisz, że ${f.name} i ${w.name} patrzą na siebie z bezpiecznej odległości. Na dywanie widać mokrą plamę i spalony skraj materiału. Krzesło między nimi zostało wyraźnie przesunięte kilka razy. Walka o terytorium trwa od twojego wyjścia.`;
        }
        if (pair === 'ogien_ziemia') {
            return `${d1.name} siedzi przy kominku, ${d2.name} w kącie — każdy w swoim miejscu. Atmosfera jest spokojna. Może nawet zbyt spokojna.`;
        }
        if (pair === 'ogien_powietrze') {
            return `${d1.name} śledzi każdy ruch ${d2.name}, który kręci się po całym pokoju jak wicher. Wyraźnie go to drażni. Kilka rzeczy zostało strąconych z półek.`;
        }
        if (pair === 'woda_ziemia') {
            return `${d1.name} i ${d2.name} leżą w swoich miejscach w milczeniu. Raz na jakiś czas jedno zerknie na drugie. Cisza jest niemal namacalna.`;
        }
        return `${d1.name} i ${d2.name} są w domu. Wygląda na to, że dzień minął spokojnie.`;
    }

    // 3 smoki
    const elements = dragons.map(d => d.element);
    if (elements.includes('ogien') && elements.includes('woda')) {
        const fireD = dragons.find(d => d.element === 'ogien');
        const waterD = dragons.find(d => d.element === 'woda');
        const thirdD = dragons.find(d => d.element !== 'ogien' && d.element !== 'woda');
        const thirdDesc = {
            ziemia: `${thirdD.name} czeka dokładnie w tym miejscu, co był gdy wychodziłeś. Pewnie siedział tutaj cały czas jak kamień, ignorując całe zamieszanie.`,
            powietrze: `${thirdD.name} gdzieś zniknął — po chwili widzisz go na belce pod sufitem, skąd spokojnie obserwuje konflikt.`,
        }[thirdD.element] || `${thirdD.name} ignoruje całą sytuację.`;
        return `Wchodząc do domu widzisz jak ${fireD.name} i ${waterD.name} patrzą groźnie na siebie. Przypalone krzesło i mokre ślady wokół niego sugerują, że trwa walka o terytorium. ${thirdDesc}`;
    }
    return `Wszystkie trzy smoki są w domu. Panuje względny spokój — jak na trójkę smoków przystało.`;
}


/* ======= sec2_modified_functions.js ======= */
/* =========================================
   ZAKŁADKA DOM (NOWA WERSJA)
========================================= */

function updateHomeTab() {
    const home = document.getElementById("home-content");
    dragonLevel = Math.min(15, dragonFeedings * 5);
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);
    thirdDragonLevel = Math.min(15, thirdDragonFeedings * 5);

    // Dynamiczny opis domu
    const homeDesc = getDragonHomeDesc();
    let html = `
        <div style="padding:15px; margin-bottom:20px; background:rgba(10,20,40,0.5); border-left:3px solid #5a6a8a; border-radius:6px;">
            <p style="color:#c0cce0; font-style:italic; line-height:1.7; margin:0;">${homeDesc}</p>
        </div>
    `;

    html += renderDragonHomeSlot(1, dragonName, chosenDragon, eggHeats, dragonLevel, dragonFeedings);

    if (secondDragonUnlocked) {
        html += renderDragonHomeSlot(2, secondDragonName, secondDragonElement, secondEggHeats, secondDragonLevel, secondDragonFeedings);
    }
    if (thirdDragonUnlocked) {
        html += renderDragonHomeSlot(3, thirdDragonName, thirdDragonElement, thirdEggHeats, thirdDragonLevel, thirdDragonFeedings);
    }

    home.innerHTML = html;
}

function renderDragonHomeSlot(num, name, element, heats, level, feedings) {
    const stats = loadDragonStats(num);
    const vitals = initDragonVitalsIfNeeded(num, stats);
    const maxHP = getDragonMaxHP(stats);
    const maxMana = getDragonMaxMana(stats);
    const mission = loadDragonMission(num);
    const fightsDone = loadArenaFights(num);

    // Check if mission completed
    if (mission && Date.now() >= mission.endTime) {
        completeDragonMission(num);
        return renderDragonHomeSlot(num, name, element, heats, level, feedings);
    }

    const isOnMission = !!mission;
    let missionHtml = '';
    if (isOnMission) {
        const remaining = Math.max(0, mission.endTime - Date.now());
        missionHtml = `
            <div style="margin:8px 0; padding:8px; background:rgba(40,30,10,0.6); border-left:3px solid #cc9900; border-radius:4px;">
                🦅 Na misji: <b>${mission.name}</b><br>
                Pozostały czas: <b>${formatTime(remaining)}</b>
                <div class="dialog-button" style="margin-top:6px;" onclick="checkMissionStatus(${num})">Sprawdź status</div>
            </div>
        `;
    }

    if (heats < 3) {
        return `
            <div class="dragon-slot">
                <b>Smok ${num}</b> — ${element ? element.toUpperCase() : '?'}<br>
                Ogrzania: ${heats}/3<br>
                <div class="dialog-button" onclick="heatEgg${num}()">🔥 Zadbaj o jajo</div>
            </div>
        `;
    }

    const spells = loadDragonSpells(num);
    const enrolled = isDragonEnrolled(num);
    const elementSpells = DRAGON_SPELLS[element] || [];

    return `
        <div class="dragon-slot">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div>
                    <b>${name}</b> — ${element ? element.toUpperCase() : '?'} | Poziom ${level}
                </div>
            </div>

            <!-- Statystyki życiowe -->
            <div style="margin:8px 0; font-size:13px; color:#aab;">
                ❤️ HP: ${vitals.hp}/${maxHP} &nbsp;|&nbsp; 💧 Mana: ${vitals.mana}/${maxMana} &nbsp;|&nbsp; 😴 Zmęczenie: ${vitals.fatigue}/100
            </div>
            <div style="margin:4px 0 10px 0; font-size:12px; color:#8090aa;">
                ${Object.entries(stats).map(([k,v]) => `${STAT_LABELS[k]}: <b>${v}</b>`).join(' | ')}
            </div>

            ${missionHtml}

            ${!isOnMission ? `
                ${level < 15 ? `<div class="dialog-button" onclick="feedDragon${num}()">🍖 Nakarm smoka</div>` : ''}
                ${vitals.fatigue > 0 ? `<div class="dialog-button" onclick="handleRestDragon(${num})">💤 Pozwól odpocząć</div>` : ''}
            ` : ''}

            <!-- Misje smoka -->
            ${!isOnMission ? `
                <details style="margin:8px 0;">
                    <summary style="cursor:pointer; color:#9ab; padding:6px 0;">🗺️ Wyślij na misję</summary>
                    <div style="margin-top:8px;">
                        ${DRAGON_MISSIONS.map(m => `
                            <div style="margin:6px 0; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px; font-size:13px;">
                                <b>${m.name}</b><br>
                                <span style="color:#8090aa; font-size:12px;">${m.desc}</span><br>
                                ⏱ ${formatTime(m.duration)} | 😴 Zmęczenie: +${m.fatigue} | 💰 ${Object.entries(m.reward).map(([t,a])=>`${a} ${t}`).join(', ')}
                                <div class="dialog-button" style="margin-top:4px;" onclick="handleStartMission(${num}, '${m.id}')">Wyślij</div>
                            </div>
                        `).join('')}
                    </div>
                </details>
            ` : ''}

            <!-- Zaklęcia -->
            ${enrolled ? `
                <details style="margin:8px 0;">
                    <summary style="cursor:pointer; color:#9ab; padding:6px 0;">✨ Zaklęcia smoka</summary>
                    <div style="margin-top:6px; font-size:13px;">
                        ${elementSpells.map(spell => {
                            const known = spells.includes(spell.id);
                            return `<div style="margin:5px 0; padding:7px; background:rgba(20,10,40,0.5); border-radius:5px;">
                                ${known ? '✅' : '📖'} <b>${spell.name}</b> — mana: ${spell.manaCost}<br>
                                <span style="color:#8090aa; font-size:12px;">${spell.desc}</span>
                                ${!known ? `<div class="dialog-button" style="margin-top:4px;" onclick="handleLearnSpell(${num}, '${spell.id}', '${element}')">Naucz (1 srebro)</div>` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </details>
            ` : `<div style="font-size:12px; color:#6070a0; margin:6px 0;">Zapisz smoka do Szkoły Magii, by mógł uczyć się zaklęć.</div>`}

            <!-- Zmień imię -->
            <input class="name-input" id="name${num}" placeholder="Nowe imię">
            <div class="dialog-button" onclick="renameDragon${num}()">Zmień imię</div>
        </div>
    `;
}

function handleRestDragon(num) {
    const result = restDragon(num);
    alert(result);
    updateHomeTab();
}

function handleStartMission(num, missionId) {
    const result = startDragonMission(num, missionId);
    alert(result.msg);
    if (result.ok) updateHomeTab();
}

function handleLearnSpell(num, spellId, element) {
    const result = learnSpell(num, spellId, element);
    alert(result.msg);
    if (result.ok) updateHomeTab();
}

function checkMissionStatus(num) {
    const mission = loadDragonMission(num);
    if (!mission) {
        alert('Smok nie jest na misji.');
        updateHomeTab();
        return;
    }
    const remaining = mission.endTime - Date.now();
    if (remaining <= 0) {
        completeDragonMission(num);
    } else {
        alert(`Misja: ${mission.name}\nPowrót za: ${formatTime(remaining)}`);
    }
}

/* =========================================
   ZAKŁADKA SMOKI (ZAKTUALIZOWANA Z CECHAMI)
========================================= */

function updateDragonsTab() {
    const list = document.getElementById("dragons-list");
    dragonLevel = Math.min(15, dragonFeedings * 5);
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);
    thirdDragonLevel = Math.min(15, thirdDragonFeedings * 5);

    let html = renderDragonOverviewSlot(1, dragonName, chosenDragon, eggHeats, dragonLevel);

    html += `
        <div class="dragon-slot">
            <b>Smok 2:</b><br>
            ${secondDragonUnlocked ?
                renderDragonOverviewSlot(2, secondDragonName, secondDragonElement, secondEggHeats, secondDragonLevel, true)
                :
                "🔒 Zablokowany — odwiedź Handlarza"
            }
        </div>
    `;

    html += `
        <div class="dragon-slot">
            <b>Smok 3:</b><br>
            ${thirdDragonUnlocked ?
                renderDragonOverviewSlot(3, thirdDragonName, thirdDragonElement, thirdEggHeats, thirdDragonLevel, true)
                :
                "🔒 Zablokowany"
            }
        </div>
    `;

    list.innerHTML = html;
}

function renderDragonOverviewSlot(num, name, element, heats, level, inline) {
    const stats = loadDragonStats(num);
    const vitals = initDragonVitalsIfNeeded(num, stats);
    const maxHP = getDragonMaxHP(stats);
    const maxMana = getDragonMaxMana(stats);
    const mission = loadDragonMission(num);

    const content = `
        <b>${inline ? '' : 'Smok 1:'}</b> ${name} | ${element ? element.toUpperCase() : '?'}<br>
        Status: ${heats < 3 ? 'Jajko' : `Wykluty — Poziom ${level}`}${mission ? ' 🦅 <em>(na misji)</em>' : ''}<br>
        ${heats >= 3 ? `
            <div style="font-size:12px; color:#aab; margin:4px 0;">
                ❤️ ${vitals.hp}/${maxHP} | 💧 ${vitals.mana}/${maxMana} | 😴 ${vitals.fatigue}/100
            </div>
            <div style="font-size:12px; color:#7080aa; margin:2px 0;">
                ${Object.entries(stats).map(([k,v]) => `${STAT_LABELS[k]}: ${v}`).join(' · ')}
            </div>
        ` : ''}
    `;

    return inline ? content : `<div class="dragon-slot">${content}</div>`;
}

/* =========================================
   SZKOŁA MAGII — ZAKTUALIZOWANE AKCJE
========================================= */

function renderMagicSchoolContent() {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    const dragons = [];
    if (eggHeats >= 3) dragons.push({ num: 1, name: dragonName, element: chosenDragon });
    if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ num: 2, name: secondDragonName, element: secondDragonElement });
    if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ num: 3, name: thirdDragonName, element: thirdDragonElement });

    let html = '';

    if (dragons.length === 0) {
        html = `<div style="color:#8090aa; font-style:italic; margin:10px 0;">Nie masz jeszcze wyklutego smoka, którego można zapisać.</div>`;
    } else {
        dragons.forEach(d => {
            const enrolled = isDragonEnrolled(d.num);
            const spells = loadDragonSpells(d.num);
            const elementSpells = DRAGON_SPELLS[d.element] || [];
            html += `
                <div style="margin:10px 0; padding:12px; background:rgba(20,30,50,0.6); border:1px solid #3a4a6a; border-radius:8px;">
                    <b>${d.name}</b> — ${d.element ? d.element.toUpperCase() : '?'}
                    ${enrolled ? `<span style="color:#66cc88; font-size:12px;"> ✅ Zapisany</span>` : `
                        <div class="dialog-button" style="margin:6px 0;" onclick="handleEnrollDragon(${d.num})">Zapisz za 2 złote</div>
                    `}
                    ${enrolled ? `
                        <div style="margin-top:8px;">
                            <b style="font-size:13px;">Dostępne zaklęcia:</b>
                            ${elementSpells.map(spell => {
                                const known = spells.includes(spell.id);
                                return `<div style="margin:5px 0; padding:6px; background:rgba(10,15,30,0.5); border-radius:5px; font-size:13px;">
                                    ${known ? '✅' : '📖'} <b>${spell.name}</b> — mana: ${spell.manaCost}<br>
                                    <span style="color:#8090aa;">${spell.desc}</span>
                                    ${!known ? `<div class="dialog-button" style="margin-top:4px;" onclick="handleLearnSpell(${d.num}, '${spell.id}', '${d.element}')">Naucz — 1 srebro</div>` : '<span style="color:#66cc88; font-size:12px;"> Znane</span>'}
                                </div>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    box.innerHTML = html + `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>`;
}

function handleEnrollDragon(num) {
    if (!canAfford(10000)) {
        alert('Nie masz wystarczająco pieniędzy. Potrzebujesz 2 złote.');
        return;
    }
    enrollDragon(num);
    alert(`Smok został zapisany do Szkoły Smoczej Magii! Możesz teraz uczyć go zaklęć za 1 srebro każde.`);
    renderMagicSchoolContent();
    updateHomeTab();
}

/* =========================================
   ARENA — ZAKTUALIZOWANE AKCJE
========================================= */

function renderArenaContent(arenaType) {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    if (arenaType === 'smocza') {
        // Smocza arena
        const dragons = [];
        if (eggHeats >= 3) dragons.push({ num: 1, name: dragonName, element: chosenDragon });
        if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ num: 2, name: secondDragonName, element: secondDragonElement });
        if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ num: 3, name: thirdDragonName, element: thirdDragonElement });

        let html = `<p style="color:#aab; font-size:13px; font-style:italic;">Smoki mogą walczyć do 3 razy dziennie. Zwycięstwo podnosi losową cechę i przynosi 1 srebro.</p>`;

        if (dragons.length === 0) {
            html += `<p style="color:#7080aa;">Nie masz wyklutego smoka do walki.</p>`;
        } else {
            dragons.forEach(d => {
                const fights = loadArenaFights(d.num);
                const mission = loadDragonMission(d.num);
                const vitals = loadDragonVitals(d.num);
                html += `
                    <div style="margin:8px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px;">
                        <b>${d.name}</b> | Walki dziś: ${fights}/3 | 😴 ${vitals.fatigue}/100
                        ${mission ? `<div style="color:#cc9900; font-size:12px;">Na misji — walka niedostępna.</div>` : ''}
                        ${!mission && fights < 3 ? `<div class="dialog-button" style="margin-top:6px;" onclick="handleDragonFight(${d.num})">⚔️ Wyślij do walki</div>` : ''}
                        ${fights >= 3 ? `<div style="color:#7080aa; font-size:12px; margin-top:4px;">Wyczerpany. Wróć jutro.</div>` : ''}
                    </div>
                `;
            });
        }

        box.innerHTML = html + `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>`;
    } else {
        // Ludzka arena / turniej
        const tournamentDone = loadPlayerTournament();
        let html = `
            <p style="color:#aab; font-size:13px; font-style:italic;">Arena dla smoczych wojowników. Turniej odbywa się codziennie — jedna szansa dziennie.</p>
            <div style="margin:10px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px;">
                <b>Turniej Wojowników</b><br>
                Status: ${tournamentDone ? '✅ Walczyłeś dziś' : '⚔️ Gotowy do walki'}<br>
                Nagroda za zwycięstwo: 2 srebro
                ${!tournamentDone ? `<div class="dialog-button" style="margin-top:8px;" onclick="handlePlayerFight()">⚔️ Wejdź do areny</div>` : ''}
            </div>
            <div style="margin:10px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px;">
                <b>Obserwuj walkę smoków</b><br>
                <span style="color:#8090aa; font-size:12px;">Rozsiądziesz się na trybunie i obserwujesz trening.</span>
                <div class="dialog-button" style="margin-top:6px;" onclick="handleWatchFight()">👁️ Obserwuj</div>
            </div>
        `;
        box.innerHTML = html + `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>`;
    }
}

function handleDragonFight(num) {
    const result = simulateDragonFight(num);
    alert(result.msg);
    renderArenaContent('smocza');
    updateHomeTab();
}

function handlePlayerFight() {
    const result = playerTournamentFight();
    alert(result.msg);
    renderArenaContent('ludzka');
}

function handleWatchFight() {
    const fights = [
        "Dwa smoki latają nad areną w ciaśniejszych i ciaśniejszych kręgach. Jeden trąca drugiego skrzydłem — tłum ryczy.",
        "Młody smok ognisty staje naprzeciwko starszego smoka ziemi. Ogień nie robi mu wrażenia. Starszy wygrywa bez wysiłku.",
        "Walka jest krótka — dwa uderzenia i zwycięzca siada. Przegrany odchodzi z opuszczoną głową, zostawiając ślad ognia na piasku."
    ];
    alert(fights[Math.floor(Math.random() * fights.length)]);
}

/* =========================================
   KOWAL — MOŻLIWOŚĆ ZAKUPU
========================================= */

const SMITH_ITEMS = [
    { id: 'obroza_smocza', name: 'Obroża Smocza', desc: 'Pomaga smokowi skupić energię żywiołu.', cost: { silver: 3 }, inventoryKey: 'Obroża smocza' },
    { id: 'zbroja_lusk', name: 'Zbroja z Łusek', desc: 'Lekka, wytrzymała. Rozmiar: ludzki.', cost: { gold: 50 }, inventoryKey: 'Zbroja z łusek' },
    { id: 'helm_ognisty', name: 'Hełm Ognisty', desc: 'Odporna na ogień. Wykuta z rudy Gór Sarak.', cost: { silver: 8 }, inventoryKey: 'Hełm ognisty' },
    { id: 'amulet_smoka', name: 'Amulet Smoczego Pazura', desc: 'Podobno przynosi szczęście hodowcom.', cost: { silver: 3 }, inventoryKey: 'Amulet smoczego pazura' }
];

function renderSmithShop() {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    let html = `<p style="color:#aab; font-size:13px; font-style:italic;">Wystawa kowala Braga Żelaznorękiego:</p>`;
    SMITH_ITEMS.forEach(item => {
        const totalCopper = costToCopper(item.cost.copper, item.cost.silver, item.cost.gold);
        const affordable = canAfford(totalCopper);
        const owned = inventory[item.inventoryKey] || 0;
        html += `
            <div style="margin:8px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px;">
                <b>${item.name}</b> ${owned > 0 ? `<span style="color:#66cc88; font-size:12px;">(masz: ${owned})</span>` : ''}
                <br><span style="color:#8090aa; font-size:13px;">${item.desc}</span>
                <br>💰 ${formatCostLabel(item.cost.copper, item.cost.silver, item.cost.gold)}
                ${affordable
                    ? `<div class="dialog-button" style="margin-top:6px;" onclick="handleBuySmithItem('${item.id}')">Kup</div>`
                    : `<div style="color:#7080aa; font-size:12px; margin-top:4px;">Za mało pieniędzy.</div>`
                }
            </div>
        `;
    });
    box.innerHTML = html + `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>`;
}

function handleBuySmithItem(itemId) {
    const item = SMITH_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const totalCopper = costToCopper(item.cost.copper, item.cost.silver, item.cost.gold);
    if (!spendCurrency(totalCopper)) {
        alert('Nie masz wystarczająco pieniędzy.');
        return;
    }
    inventory[item.inventoryKey] = (inventory[item.inventoryKey] || 0) + 1;
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTab();
    alert(`Kupiłeś: ${item.name}!`);
    renderSmithShop();
}

/* =========================================
   BIBLIOTEKA — OPCJE PO RUNACH
========================================= */

function renderLibrarianRuneOptions() {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    const runeProgress = localStorage.getItem('runeQuestProgress') || 'none';

    let html = `
        <div style="margin:10px 0; padding:12px; background:rgba(10,20,40,0.6); border-left:3px solid #9966cc; border-radius:6px; color:#c0c0e0; font-style:italic; line-height:1.7;">
            Bibliotekarz unosi głowę znad notatek. Jego oczy błyszczą pod grubymi szkłami lunetki.
        </div>
    `;

    if (runeProgress === 'none') {
        html += `
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Dobrze, postaram się je naszkicować gdy następnym razem tam będę."</div>
            <div class="dialog-button" onclick="handleRuneChoice('readFirst')">„Najpierw przeczytam księgi tutaj, może coś znajdę."</div>
            <div class="dialog-button" onclick="handleRuneChoice('notInterested')">„W sumie to tylko ciekawość — specjalnie po to nie chcę tam iść."</div>
            <div class="dialog-button" onclick="handleRuneChoice('knowAlready')">„Byłem już przy bramie. Runy są bardzo precyzyjne."</div>
        `;
    } else if (runeProgress === 'sketch') {
        const hasSketch = inventory['Szkic run'] > 0;
        html += hasSketch ? `
            <div style="color:#66cc88; margin:8px 0; font-style:italic; padding:8px; background:rgba(10,40,20,0.5); border-radius:6px;">
                Wyjmujesz szkicownik i podajesz bibliotekarzowi. Przegląda strony przez długi czas w milczeniu.<br><br>
                — Niesamowite... — szepcze. — Te dwa symbole przypominają runiczne pismo Starszej Epoki. Ale ten trzeci... tego nie znam. Zostawię kopię i dam znać, jeśli coś odkryję.
            </div>
            <div class="dialog-button" onclick="handleRuneChoice('done')">„Dziękuję. Czekam na wieści."</div>
        ` : `
            <div style="color:#9ab; margin:8px 0; font-style:italic; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px;">
                — Czekam na ten szkic — mówi bibliotekarz z nutą niecierpliwości. — Jeśli znajdziesz czas, by odwiedzić bramę i naszkicować runy, bardzo chętnie je przejrzę.
            </div>
            <div class="dialog-button" onclick="openLocation('gory', 'ksiezycowa_brama')">Idź do Księżycowej Bramy</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
    } else if (runeProgress === 'readFirst') {
        html += `
            <div style="color:#9ab; margin:8px 0; font-style:italic; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px;">
                Bibliotekarz prowadzi cię do regału w głębi sali. Wyciąga trzy cienkie tomy.<br><br>
                — Tu są wzmianki. Żadna pełna. Autorzy pisali jakby sami nie rozumieli, co widzieli.
            </div>
            <div class="dialog-button" onclick="handleRuneChoice('readBooks')">Zacznij czytać</div>
        `;
    } else if (runeProgress === 'readBooks') {
        html += `
            <div style="color:#c0cce0; margin:8px 0; font-style:italic; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px;">
                Czytasz przez godzinę. Wzmianka pierwsza: <em>„brama, gdy księżyc jest pełen, oddycha."</em><br>
                Wzmianka druga: <em>„nie można jej otworzyć — ona sama decyduje."</em><br>
                Wzmianka trzecia: urwana w połowie zdania.<br><br>
                Bibliotekarz patrzy pytająco.
            </div>
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Pójdę naszkicować runy. Może razem coś odkryjemy."</div>
            <div class="dialog-button" onclick="handleRuneChoice('done')">„Dziękuję. To dużo do przemyślenia."</div>
        `;
    } else if (runeProgress === 'notInterested') {
        html += `
            <div style="color:#8090aa; margin:8px 0; font-style:italic; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px;">
                — Rozumiem — mówi bibliotekarz, wracając do pracy. — Jeśli kiedyś zmienisz zdanie, będę tutaj.
            </div>
            <div class="dialog-button" onclick="handleRuneChoice('changed_mind')">„Właściwie... zmieniam zdanie. Chcę dowiedzieć się więcej."</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
    }

    box.innerHTML = html;
}

function handleRuneChoice(choice) {
    localStorage.setItem('runeQuestProgress', choice);
    if (choice === 'sketch' && !inventory['Szkicownik']) {
        inventory['Szkicownik'] = 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        alert('Wziąłeś szkicownik z biblioteki. Odwiedź Księżycową Bramę by naszkicować runy.');
    }
    renderLibrarianRuneOptions();
}

/* =========================================
   MODYFIKACJA HANDLARZA — POWRÓT DO MIASTA
========================================= */
let merchantCalledFromCity = false;

function openMerchantFromCity() {
    merchantCalledFromCity = true;
    openTab('merchant');
}

function updateMerchantTabWithBack() {
    updateMerchantTab();
    if (merchantCalledFromCity) {
        const box = document.getElementById("merchant-content");
        // Append back button after content loads
        setTimeout(() => {
            const existing = document.getElementById("merchant-back-btn");
            if (!existing) {
                const btn = document.createElement('div');
                btn.id = 'merchant-back-btn';
                btn.className = 'dialog-button';
                btn.style.marginTop = '15px';
                btn.style.borderColor = '#778';
                btn.style.color = '#aab';
                btn.textContent = '← Wróć do Astorveil';
                btn.onclick = () => {
                    merchantCalledFromCity = false;
                    openTab('world');
                    setTimeout(() => openRegion('miasto'), 50);
                };
                box.appendChild(btn);
            }
        }, 50);
    }
}


/* ======= world_v2.js ======= */
/* -----------------------------------------
   SYSTEM ŚWIATA - ZMIENNE
----------------------------------------- */
let worldHistory = JSON.parse(localStorage.getItem("worldHistory")) || [];
let visitedLocations = JSON.parse(localStorage.getItem("visitedLocations")) || {};

function saveWorldState() {
    localStorage.setItem("worldHistory", JSON.stringify(worldHistory));
    localStorage.setItem("visitedLocations", JSON.stringify(visitedLocations));
}

/* -----------------------------------------
   SPRAWDZENIE KSIĘŻYCA DLA KSIĘŻYCOWEJ BRAMY
----------------------------------------- */
function getMoonPhase() {
    const knownNewMoon = new Date("2000-01-06T18:14:00Z");
    const now = new Date();
    const diff = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const cycle = diff % 29.53058770576;
    return cycle;
}

function isMoonGateOpen() {
    const phase = getMoonPhase();
    const hour = new Date().getHours();
    const inNight = (hour >= 21 || hour < 5);
    // pelnia ~14-15 dzien cyklu, dzien przed i po = 13-16
    const nearFullMoon = (phase >= 13 && phase <= 16);
    return inNight && nearFullMoon;
}

function getMoonGateStatus() {
    const phase = getMoonPhase();
    const hour = new Date().getHours();
    const inNight = (hour >= 21 || hour < 5);
    const nearFullMoon = (phase >= 13 && phase <= 16);
    const daysToFull = Math.round(14.76 - phase);

    if (nearFullMoon && inNight) {
        return { open: true, msg: null };
    }
    if (nearFullMoon && !inNight) {
        return { open: false, msg: "Brama istnieje, lecz milczy. Powróć gdy księżyc wzniesie się wyżej — między dziewiątą a piątą." };
    }
    if (!nearFullMoon) {
        const d = daysToFull > 0 ? daysToFull : Math.round(29.53 - phase + 14.76);
        return { open: false, msg: `Runiczne symbole są martwe. Brama nie reaguje na żaden dotyk. Być może jest tylko skałą.` };
    }
    return { open: false, msg: "Brama milczy." };
}

/* -----------------------------------------
   SPRAWDZENIE CZY SMOK MA MIN. POZIOM
----------------------------------------- */
function hasHighLevelDragon(minLevel) {
    const l1 = Math.min(30, dragonFeedings * 5);
    const l2 = secondDragonUnlocked ? Math.min(30, secondDragonFeedings * 5) : 0;
    const l3 = thirdDragonUnlocked ? Math.min(30, thirdDragonFeedings * 5) : 0;
    return Math.max(l1, l2, l3) >= minLevel;
}

/* -----------------------------------------
   DANE LOKACJI
----------------------------------------- */
const worldData = {
    miasto: {
        label: "Miasto Astorveil",
        firstVisitDesc: `Twoje stopy dotykają brukowanych ulic Astorveil — miasta zbudowanego w cieniu Smoczej Góry, której sylwetka dominuje nad każdym dachem i każdą wieżą. Powietrze pachnie dymem z kuźni, korzennymi przyprawami z kramów i czymś nieuchwytnym — może to woń łusek, może starożytnej magii przesiąkniętej w kamienie fundamentów.\n\nMiasto żyje. Dzieci biegają między straganami, kuźnie grają rytmicznym stukaniem młotów, a gdzieś w oddali słyszysz ryk — nie wiadomo, czy to człowiek czy stworzenie. Astorveil nie jest miejscem dla słabych. Jest miejscem dla tych, którzy mają powód tu być.\n\nWitaj. Dokąd się udasz?`,
        desc: `Gwar Astorveil wita Cię jak zawsze — hałaśliwie i bez ceremonii. Brukowane ulice, dym z kuźni, krzyki handlarzy. Miasto nie śpi i nie zwalnia. Dokąd się udasz?`,
        icon: "🏙️",
        locations: [
            {
                id: "tablica",
                label: "Tablica Ogłoszeń",
                icon: "📋",
                desc: `Dębowa tablica przy głównej bramie jest oblepiona kawałkami pergaminu. Niektóre świeże, niektóre pożółkłe i prawie nieczytelne. Miejski gończy właśnie przybija nowe ogłoszenie. Zapach tuszu miesza się z wonią siana z pobliskiej stajni.`,
                actions: [
                    { label: "Sprawdź zlecenia", action: "openWorkTab", desc: "Przejrzyj dostępne prace i zlecenia." },
                    { label: "Przeczytaj plotki", action: "readRumors", desc: "Może coś ciekawego krąży wśród mieszkańców." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "handlarz_jaj",
                label: "Handlarz Smoczych Jaj",
                icon: "🥚",
                desc: `Przed Tobą budynek z kamienia, ciemny niczym łuski smoka. Rytowane runami drzwi stoją lekko uchylone. Z wnętrza wydobywa się ciepło inkubatorów i zapach żywicy. Handlarz patrzy na Ciebie spokojnymi oczami.`,
                actions: [
                    { label: "Porozmawiaj z Handlarzem", action: "openMerchantTab", desc: "Może ma dla ciebie coś wyjątkowego." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "handlarz_zywnosci",
                label: "Handlarz Smoczej Żywności",
                icon: "🍖",
                desc: `Stragan zastawiony jest kośćmi, suszonymi ziołami i mięsem o dziwnych barwach. Handlarz — gruba, pogodna kobieta o smagłej cerze — wykrzykuje nazwy towarów z entuzjazmem, który trochę niepokoi.\n\n— Mięso z gór? Mam! Jagody z Lasu Mgieł? Mam! Co dla smoczka, co?`,
                actions: [
                    { label: "Kup mięso (10 miedzi)", action: "buyMeat", desc: "Surowe mięso, smoki przepadają za nim." },
                    { label: "Kup jagody (5 miedzi)", action: "buyBerries", desc: "Dzikie jagody z Lasu Mgieł, bogate w magię." },
                    { label: "Pogadaj o smokach", action: "chatFoodMerchant", desc: "Handlarka zna wiele historii." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "kowal",
                label: "Smoczy Kowal",
                icon: "⚒️",
                desc: `Kuźnia Braga Żelaznorękiego słynie w całym Astorveil. Mężczyzna o ramionach grubych jak bale drzewa pracuje bez przerwy. Na ścianie wiszą narzędzia i zbroje — część z nich pokryta jest dziwnymi runami.\n\n— Podkuć smoka? Naprawić siodło? Czy może coś większego? — pyta nie odrywając wzroku od kowadła.`,
                actions: [
                    { label: "Zamów obrożę dla smoka", action: "orderCollar", desc: "Obroże pomagają smokowi skupić energię żywiołu." },
                    { label: "Naostrz broń", action: "sharpenWeapon", desc: "Kowal naostrzy twoje narzędzia za niewielką opłatą." },
                    { label: "Obejrzyj wystawę", action: "browseSmith", desc: "Może coś przykuje twój wzrok." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "swiatynia",
                label: "Świątynia Astor",
                icon: "🛕",
                desc: `Kamienna świątynia poświęcona Astor — Smoczej Matce — stoi w centrum miasta jak kotwica. Przez witraże wpada złote światło. Kapłanka w szacie koloru dymu klęczy przy głównym ołtarzu. Atmosfera jest cicha i pełna powagi.\n\nNa ołtarzu leżą trzy kamienne jaja — symbole pierwszego daru Astor dla ludzi.`,
                actions: [
                    { label: "Pomódl się o błogosławieństwo", action: "pray", desc: "Astor może być przychylna tym, którzy o to proszą." },
                    { label: "Poproś o uzdrowienie smoka", action: "healDragon", desc: "Kapłanka może pomóc choremu smokowi." },
                    { label: "Posłuchaj kazania", action: "listenSermon", desc: "Stara kapłanka zna wiele historii o smokach." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "szkola_magii",
                label: "Szkoła Smoczej Magii",
                icon: "✨",
                desc: `Wieża Szkoły Smoczej Magii wznosi się nad miastem jak palec wskazujący niebo. Z okien co jakiś czas wydobywają się kolorowe błyski — efekty nieudanych zaklęć lub bardzo udanych eksperymentów. Trudno powiedzieć.\n\nU progu siedzi stary nauczyciel z brodą splecioną w dwa warkocze. Drzema — albo udaje, że drzema.`,
                actions: [
                    { label: "Zapisz się na lekcję", action: "magicLesson", desc: "Nauka o smoczyj magii może się przydać." },
                    { label: "Przejrzyj biblioteczkę zaklęć", action: "spellBook", desc: "Małe zaklęcia dostępne dla każdego." },
                    { label: "Porozmawiaj z mistrzem", action: "talkMaster", desc: "Stary mistrz wie więcej niż mówi." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "arena",
                label: "Arena",
                icon: "⚔️",
                desc: `Głośna, gorąca, cuchnąca potem i krwią — Arena Astorveil to serce rozrywki dla mieszkańców. Trybuny wypełnione są po brzegi. Na piasku dwie osoby właśnie kończą walkę. Organizator walk — łysy mężczyzna z blizną przez całą twarz — kiwa na ciebie.`,
                actions: [
                    { label: "Obserwuj walkę", action: "watchFight", desc: "Możesz się czegoś nauczyć patrząc na mistrzów." },
                    { label: "Zapisz się do turnieju", action: "joinTournament", desc: "Turniej trwa przez cały miesiąc. Nagrody są pokaźne." },
                    { label: "Porozmawiaj z organizatorem", action: "talkOrganizer", desc: "Może wie coś ciekawego o innych uczestnikach." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "posterunek",
                label: "Posterunek Straży",
                icon: "🛡️",
                desc: `Posterunek Straży Miejskiej to solidny kamienny budynek przy wschodniej bramie. Strażnicy wchodzą i wychodzą w rytm zmiany warty. Na ścianie wisi tablica z listami gończymi i zawiadomieniami.\n\nKapitan — kobieta w lśniącej kolczudze — siedzi za biurkiem i przegląda raporty.`,
                actions: [
                    { label: "Zgłoś problem", action: "reportIssue", desc: "Straż chętnie przyjmuje zgłoszenia od mieszkańców." },
                    { label: "Sprawdź listy gończe", action: "wantedList", desc: "Może ktoś znajomy jest na liście?" },
                    { label: "Zaoferuj pomoc", action: "offerHelp", desc: "Straż płaci za pomoc przy pewnych sprawach." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "port",
                label: "Port",
                icon: "⛵",
                desc: `Port Astorveil jest skromny jak na stolicę — kilka drewnianych pomostów, kilkanaście łodzi. Ale to przez tutejsze wody przepływa większość smoczych jaj importowanych z wysp. Rybacy patrzą na ciebie z mieszaniną ciekawości i podejrzliwości.`,
                actions: [
                    { label: "Porozmawiaj z rybakami", action: "talkFishermen", desc: "Rybacy widzą dużo z morza." },
                    { label: "Sprawdź przybywające statki", action: "checkShips", desc: "Może coś interesującego właśnie zawinęło." },
                    { label: "Kup rybę", action: "buyFish", desc: "Świeża ryba — może smoki ją lubią?" },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "palac",
                label: "Pałac",
                icon: "🏛️",
                desc: `Pałac Władcy Astorveil strzeżony jest przez czterech strażników w złotych zbrojach. Brama jest zamknięta. Przez kratę widać rozległy ogród i fontannę w kształcie smoka.\n\nJeden ze strażników patrzy na ciebie ze spokojem, który mówi: „Nie tędy."`,
                actions: [
                    { label: "Zapytaj o audiencję", action: "requestAudience", desc: "Może uda się umówić na spotkanie z władcą." },
                    { label: "Poobserwuj zmianę warty", action: "watchGuards", desc: "Strażnicy mają swoje rytuały." },
                    { label: "Odejdź", action: "back" }
                ]
            },
            {
                id: "biblioteka",
                label: "Biblioteka",
                icon: "📚",
                desc: `Miejska Biblioteka Astorveil pachnie starym pergaminem i woskiem świec. Regały sięgają sufitu. Bibliotekarz — stary mężczyzna z lunetką przy oku — wita cię szepcząc, jakby hałas mógł uszkodzić księgi.\n\n— Czego szukasz, wędrowcze?`,
                actions: [
                    { label: "Szukaj ksiąg o smokach", action: "searchDragonBooks", desc: "Tu może być wiedza, której potrzebujesz." },
                    { label: "Czytaj stare mapy", action: "readMaps", desc: "Stare mapy pokazują miejsca, które dziś są zapomniane." },
                    { label: "Porozmawiaj z bibliotekarzem", action: "talkLibrarian", desc: "Zna każdą książkę w tym miejscu." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "plac",
                label: "Główny Plac",
                icon: "🏟️",
                desc: `Główny Plac Astorveil jest sercem miasta — tu odbywają się targi, ogłoszenia i festiwale. Fontanna z posągiem Astor pośrodku jest miejscem spotkań. Kilka osób siedzi na ławkach, obserwując przechodniów. Dziecko goni gołębia. Stara kobieta sprzedaje kwiaty.`,
                actions: [
                    { label: "Posłuchaj rozmów", action: "listenPlaza", desc: "Plotki miejskie krążą szybko." },
                    { label: "Poobserwuj ludzi", action: "watchPeople", desc: "Interesujące postacie pojawiają się na placu." },
                    { label: "Usiądź i odpoczywaj", action: "restPlaza", desc: "Chwila spokoju dobrze robi." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "karczma",
                label: "Karczma Pod Smokiem",
                icon: "🍺",
                desc: `Karczma Pod Smokiem jest głośna, ciepła i pachnie piwem oraz smażonym mięsem. Karczmarz — wysoki mężczyzna z rudą brodą — krząta się za ladą. Kilku gości siedzi przy stolikach. Przy kominku śpi stary pies.`,
                actions: [
                    { label: "Zamów piwo (3 miedzi)", action: "buyDrink", desc: "Dobre piwo po długim dniu." },
                    { label: "Posłuchaj plotek", action: "listenTavern", desc: "Karczma to skarbnica informacji." },
                    { label: "Zagadaj wędrowca", action: "talkTraveler", desc: "Obcy ludzie przynoszą ciekawe wieści." },
                    { label: "Wynajmij izbę (5 miedzi)", action: "rentRoom", desc: "Odpoczynek w karczmie przynosi siły." },
                    { label: "Zawróć", action: "back" }
                ]
            }
        ]
    },

    las: {
        label: "Las Mgieł",
        firstVisitDesc: `Las Mgieł rozciąga się na południe od Astorveil — gęsty, mroczny, pełen szeptów. Wchodzisz między drzewa i natychmiast tracisz z oczu miasto. Mgła kręci się między korzeniami jak żywa. Gałęzie splecione wysoko nad głową tworzą sklepienie, przez które prawie nie przechodzi światło.\n\nW Lesie Mgieł czas płynie inaczej. Mówi się, że kto zostanie tu za długo, wraca odmieniony. Albo nie wraca wcale.\n\nMimo to — wchodzisz. Gdzie się udasz?`,
        desc: `Las Mgieł wita cię ciszą i zapachem wilgotnej ziemi. Mgła pełznie między drzewami jak zawsze. Dokąd tym razem?`,
        icon: "🌲",
        locations: [
            {
                id: "siedziba",
                label: "Siedziba Leśnika",
                icon: "🏚️",
                desc: `Pośród drzew stoi mała chata — solidna, choć omszała. Przy progu suszone zioła i pęki piór. Leśnik — stara kobieta o bystre oczach — siedzi przed domem i ceruje skórzane ubranie. Nie odwraca głowy, ale wie, że jesteś.`,
                actions: [
                    { label: "Porozmawiaj z Leśniczką", action: "talkForester", desc: "Zna las jak własną kieszeń." },
                    { label: "Zapytaj o ścieżki", action: "askPaths", desc: "Może wskaże bezpieczną drogę przez las." },
                    { label: "Kup zioła (8 miedzi)", action: "buyHerbs", desc: "Leśne zioła mają właściwości lecznicze." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "jezioro_snu",
                label: "Jezioro Snu",
                icon: "🌙",
                desc: `Małe, nieruchome jezioro leży w zagłębieniu lasu. Woda jest czarna jak atrament — odbija gwiazdy nawet w środku dnia. Wokół brzegów rosną niebieskie kwiaty, których nie ma nigdzie indziej w lesie.\n\nStan jest dziwny. Masz wrażenie, że jezioro patrzy na ciebie.`,
                actions: [
                    { label: "Napij się wody", action: "drinkLake", desc: "Woda wygląda czystą. Chyba." },
                    { label: "Rzuć kamień", action: "throwStone", desc: "Ciekawość bierze górę." },
                    { label: "Posiedź w ciszy", action: "sitLake", desc: "Może spokój ci powie coś ważnego." },
                    { label: "Zbierz niebieskie kwiaty", action: "pickFlowers", desc: "Rzadkie rośliny mogą się do czegoś przydać." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "polana_urodzaju",
                label: "Polana Urodzaju",
                icon: "🌿",
                desc: `Polana jest zaskakująco jasna po mroku lasu. Trawa wysoka, soczysta. Kwiaty rosną w nieregularnych kępach. Owady brzęczą leniwie. Pośrodku polany rośnie ogromne drzewo z rozłożystą koroną — jego korzenie wystają z ziemi jak splecione palce.\n\nPowietrze pachnie tu inaczej. Głębiej. Starszej.`,
                actions: [
                    { label: "Zbieraj jagody", action: "gatherBerries", desc: "Dzikie jagody są tu duże i syte." },
                    { label: "Zbieraj zioła", action: "gatherHerbs", desc: "Na polanie rośnie kilka rzadkich roślin." },
                    { label: "Usiądź pod drzewem", action: "sitTree", desc: "Stare drzewo ma coś do powiedzenia." },
                    { label: "Baw się z robakami", action: "digDirt", desc: "Ziemia jest tu wyjątkowo bogata." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "wodospad",
                label: "Wodospad Milczenia",
                icon: "💧",
                desc: `Słyszysz go zanim go widzisz — głuchy szum, który narasta z każdym krokiem. Wodospad spada z mchu pokrytego urwiska do głębokiego basenu. Mgła nad wodą jest gęstsza niż gdziekolwiek indziej.\n\nKamienie za kaskadą wody są pokryte rysunkami — może pradawne malowidła, może ślady pazurów.`,
                actions: [
                    { label: "Wejdź za wodospad", action: "behindWaterfall", desc: "Co kryje się za zasłoną wody?" },
                    { label: "Napełnij bukłak", action: "fillFlask", desc: "Czysta woda ze źródła." },
                    { label: "Zbadaj malowidła", action: "examineDrawings", desc: "Rysunki mogą coś znaczyć." },
                    { label: "Posłuchaj wodospadu", action: "listenWaterfall", desc: "Mówi się, że woda tu mówi." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "ruiny_swiatyni",
                label: "Ruiny Leśnej Świątyni",
                icon: "🗿",
                desc: `Między drzewami wyłaniają się z mgły kamienne kolumny — jedne stojące, inne powalone. Chwasty wspinają się po kamieniach. Pośrodku ruin stoi ołtarz — gruby, płaski kamień z wyrytym symbolem, który przypomina skrzydlate stworzenie.\n\nNikt tu nie przychodzi. A jednak kamień wygląda na wyczyszczony.`,
                actions: [
                    { label: "Zbadaj ołtarz", action: "examineAltar", desc: "Symbol na kamieniu może coś znaczyć." },
                    { label: "Zostaw ofiarę", action: "leaveOffering", desc: "Może bóstwo lasu przyjmie twój dar." },
                    { label: "Przeszukaj ruiny", action: "searchRuins", desc: "Stare miejsca kryją stare przedmioty." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "gniazdo_straznika",
                label: "Gniazdo Leśnego Strażnika",
                icon: "🦅",
                desc: `Wysokie w koronach drzew widzisz ogromne gniazdo — splot gałęzi i traw tak duży, że zmieściłoby się w nim kilka osób. Coś w nim jest. Nie rusza się.\n\nOdgłos skrzydeł w koronach jest bliższy niż byś chciał.`,
                actions: [
                    { label: "Wspinaj się na drzewo", action: "climbTree", desc: "Może uda się zajrzeć do gniazda." },
                    { label: "Zostań w miejscu i obserwuj", action: "observeNest", desc: "Cierpliwość to cnota." },
                    { label: "Odejdź cicho", action: "sneakAway", desc: "Dyskrecja bywa mądrością." },
                    { label: "Zawróć", action: "back" }
                ]
            }
        ]
    },

    gory: {
        label: "Góry Sarak",
        firstVisitDesc: `Góry Sarak wznoszą się na wschodzie — ich szczyty giną w chmurach, a zbocza pokrywa las, który z czasem ustępuje nagim skałom. Mówi się, że Góry Sarak istniały zanim powstało pierwsze miasto — że to one nadały kształt tej ziemi.\n\nKamienne ścieżki wiją się ku górze. Powietrze jest chłodniejsze, ostrzejsze. Gdzieś w górze śpiewa wiatr między skałami.\n\nDokąd się udasz?`,
        desc: `Chłodne powietrze Gór Sarak wita Cię jak zawsze — spokojnie i z dystansem. Skały milczą. Dokąd tym razem?`,
        icon: "⛰️",
        locations: [
            {
                id: "podnoze",
                label: "Podnóże Góry",
                icon: "🪨",
                desc: `Podnóże Sarak to miejsce, gdzie ścieżka z doliny kończy się i zaczyna prawdziwa wspinaczka. Kilka chat pasterzy stoi przy płaskim kamieniu zwanym Pierwszym Progiem. Starszy mężczyzna siedzi przed chatą i wygrzewa się w słońcu. Kozy pasą się na pobliskiej łące.`,
                actions: [
                    { label: "Porozmawiaj z pasterzem", action: "talkShepherd", desc: "Pasterze znają górskie ścieżki." },
                    { label: "Zbadaj Pierwszy Próg", action: "examineFirstStep", desc: "Wielki kamień wygląda na bardzo stary." },
                    { label: "Odpoczywaj przy chacie", action: "restFoot", desc: "Przed wspinaczką warto złapać oddech." },
                    { label: "Kup ser (4 miedzi)", action: "buyCheese", desc: "Górski ser — może smoki go lubią?" },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "szczyt",
                label: "Szczyt Sarak",
                icon: "🏔️",
                requiresLevel: 30,
                lockedDesc: `Ścieżka ku szczytowi jest stroma i wymagająca. W połowie drogi zatrzymujesz się — nie tyle przez zmęczenie, co przez poczucie, że góra cię nie przepuszcza.\n\nZ jakiegoś powodu nogi odmawiają posłuszeństwa. Wiatr jest silniejszy niż powinieneś. Może nie czas.`,
                desc: `Szczyt Sarak jest miejscem między niebem a ziemią. Stoisz nad chmurami. Poniżej widać całe Astorveil — małe jak model z drewna. Wiatr szarpie ubraniem. W powietrzu czuć elektryczność.\n\nI nagle rozumiesz, dlaczego smoki lubią latać wysoko.`,
                actions: [
                    { label: "Medytuj na szczycie", action: "meditateTop", desc: "Spokój w tak ekstremalnym miejscu coś znaczy." },
                    { label: "Obserwuj horyzont", action: "watchHorizon", desc: "Widać stąd bardzo daleko." },
                    { label: "Przeszukaj skalne szczeliny", action: "searchCracks", desc: "Góry kryją skarby dla cierpliwych." },
                    { label: "Przywołaj smoka", action: "callDragon", desc: "Na szczycie, blisko nieba — może smok cię usłyszy inaczej." },
                    { label: "Zawróć", action: "back" }
                ]
            },
            {
                id: "ksiezycowa_brama",
                label: "Księżycowa Brama",
                icon: "🌕",
                desc: `Przy wschodnim zboczu Sarak, tam gdzie skały tworzą naturalny łuk, stoi coś, czego nie powinno tu być — kamienna brama. Jej filary są pokryte runami tak precyzyjnymi, że musiały być wykute przez nieludzką rękę.\n\nNikt nie przetłumaczył tych symboli. Nikt nie wie, kiedy brama powstała. Wiadomo tylko jedno — czasem, w nocy, coś w niej drga.`,
                actions: [
                    { label: "Zbadaj runy", action: "examineRunes", desc: "Może uda się odcyfrować choć jeden symbol." },
                    { label: "Dotknij bramy", action: "touchGate", desc: "Czy reaguje na dotyk?" },
                    { label: "Przejdź przez bramę", action: "enterGate", desc: "Jeśli jest otwarta..." },
                    { label: "Zawróć", action: "back" }
                ]
            }
        ]
    }
};

/* -----------------------------------------
   SYSTEM WYŚWIETLANIA ZAKŁADKI ŚWIAT
----------------------------------------- */
function updateWorldTab() {
    const worldDiv = document.getElementById("world");
    worldDiv.innerHTML = `
        <h2>🗺️ Świat</h2>
        <p style="color:#aab; font-style:italic; margin-bottom:20px;">Wybierz region, który chcesz odwiedzić.</p>
        <div id="world-subregions">
            ${Object.entries(worldData).map(([key, region]) => `
                <div class="world-region-btn" onclick="openRegion('${key}')">
                    <span class="region-icon">${region.icon}</span>
                    <span class="region-label">${region.label}</span>
                    <span class="region-arrow">›</span>
                </div>
            `).join('')}
        </div>
        <div id="world-content-area"></div>
    `;
}

function openRegion(regionKey) {
    const region = worldData[regionKey];
    const wasVisited = visitedLocations[regionKey];
    if (!wasVisited) {
        visitedLocations[regionKey] = true;
        saveWorldState();
    }
    const desc = wasVisited ? region.desc : region.firstVisitDesc;

    // push to history
    worldHistory = [{ type: 'region', key: regionKey }];

    const area = document.getElementById("world-content-area");
    const subregions = document.getElementById("world-subregions");
    if (subregions) subregions.style.display = "none";

    area.innerHTML = `
        <div class="dialog-window" style="margin-top:20px;">
            <div class="dialog-title">${region.icon} ${region.label}</div>
            <div class="dialog-text" style="white-space:pre-line;">${desc}</div>
            <div id="location-buttons">
                ${region.locations.map(loc => `
                    <div class="dialog-button" onclick="openLocation('${regionKey}', '${loc.id}')">
                        ${loc.icon} ${loc.label}
                    </div>
                `).join('')}
                <div class="dialog-button" style="margin-top:15px; border-color:#778; color:#aab;" onclick="closeRegion()">← Wróć do mapy</div>
            </div>
        </div>
    `;
}

function openLocation(regionKey, locationId) {
    const region = worldData[regionKey];
    const loc = region.locations.find(l => l.id === locationId);
    if (!loc) return;

    // push to history
    worldHistory = [{ type: 'region', key: regionKey }, { type: 'location', regionKey, locationId }];

    const visitKey = `${regionKey}_${locationId}`;
    const wasVisited = visitedLocations[visitKey];
    if (!wasVisited) {
        visitedLocations[visitKey] = true;
        saveWorldState();
    }

    // Check level requirement
    if (loc.requiresLevel && !hasHighLevelDragon(loc.requiresLevel)) {
        const area = document.getElementById("world-content-area");
        area.innerHTML = `
            <div class="dialog-window" style="margin-top:20px;">
                <div class="dialog-title">${loc.icon} ${loc.label}</div>
                <div class="dialog-text" style="white-space:pre-line;">${loc.lockedDesc}</div>
                <div class="dialog-button" onclick="openRegion('${regionKey}')">← Zawróć</div>
            </div>
        `;
        return;
    }

    // Special handling for moon gate
    let extraContent = '';
    if (locationId === 'ksiezycowa_brama') {
        const moonStatus = getMoonGateStatus();
        if (!moonStatus.open) {
            extraContent = `<div style="margin: 10px 0; padding: 10px; background: rgba(40,30,60,0.6); border-left: 3px solid #9966cc; border-radius: 6px; color: #cc99ff; font-style: italic;">${moonStatus.msg}</div>`;
        } else {
            extraContent = `<div style="margin: 10px 0; padding: 10px; background: rgba(30,50,30,0.6); border-left: 3px solid #66cc99; border-radius: 6px; color: #99ffcc; font-style: italic;">Runy pulsują zimnym, srebrnym światłem. Brama drży jakby oddychała.</div>`;
        }
    }

    const area = document.getElementById("world-content-area");
    area.innerHTML = `
        <div class="dialog-window" style="margin-top:20px;">
            <div class="dialog-title">${loc.icon} ${loc.label}</div>
            <div class="dialog-text" style="white-space:pre-line;">${loc.desc}</div>
            ${extraContent}
            <div id="location-action-area">
                ${renderLocationActions(regionKey, locationId, loc.actions)}
            </div>
        </div>
    `;
}

function renderLocationActions(regionKey, locationId, actions) {
    return actions.map(action => {
        if (action.action === 'back') {
            return `<div class="dialog-button" style="margin-top:15px; border-color:#778; color:#aab;" onclick="openRegion('${regionKey}')">← Zawróć</div>`;
        }
        return `<div class="dialog-button" onclick="handleLocationAction('${regionKey}', '${locationId}', '${action.action}')">${action.label}</div>`;
    }).join('');
}

function closeRegion() {
    worldHistory = [];
    const area = document.getElementById("world-content-area");
    if (area) area.innerHTML = '';
    const subregions = document.getElementById("world-subregions");
    if (subregions) subregions.style.display = "block";
}

/* -----------------------------------------
   OBSŁUGA AKCJI W LOKACJACH
----------------------------------------- */
const locationResponses = {
    // TABLICE / PRACA
    openWorkTab: () => { openTab('work'); },
    openMerchantTab: () => { openMerchantFromCity(); return null; },

    readRumors: () => {
        const rumors = [
            "Ktoś napisał, że w Lesie Mgieł widziano smocze ślady wielkości stodoły.",
            "Podobno Księżycowa Brama w Górach Sarak otworzyła się ostatnim razem dokładnie w pełnię.",
            "Handlarz smoczych jaj kupił nowy transport z Wysp Ognistych. Podobno wyjątkowy.",
            "Mówią, że w Jeziorze Snu można zobaczyć przyszłość — jeśli masz odwagę patrzeć.",
            "Strażnicy szepczą, że coś dużego ruszyło się w kopalni na północy."
        ];
        return rumors[Math.floor(Math.random() * rumors.length)];
    },

    // HANDLARZ ŻYWNOŚCI
    buyMeat: () => {
        if (!canAfford(10)) return "Nie masz wystarczająco miedzi (10 miedzi).";
        spendCurrency(10);
        foodItems.mięso = (foodItems.mięso || 0) + 1;
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
        updateInventoryTab();
        return "Handlarka zawija kawałek mięsa w pergamin i podaje ci go z uśmiechem. +1 Mięso.";
    },
    buyBerries: () => {
        if (!canAfford(5)) return "Nie masz wystarczająco miedzi (5 miedzi).";
        spendCurrency(5);
        foodItems.jagody = (foodItems.jagody || 0) + 1;
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
        updateInventoryTab();
        return "Pachnące jagody lądują w twojej torbie. Podobno rosną w Lesie Mgieł. +1 Jagody.";
    },
    chatFoodMerchant: () => {
        const tales = [
            "— Smoki z żywiołem wody wolą jagody — mówi handlarka. — Ale ogniste? Te, to tylko mięso. Surowe, najlepiej.",
            "— Mój dziad mówił, że smoczy kowal w Astorveil podkuwa smoki od czterech pokoleń. Dobra robota, tylko droga.",
            "— Słyszałam, że na Polanie Urodzaju jagody rosną dwa razy większe niż te moje. Ale jak iść do lasu, to trzeba uważać.",
            "— Wie pan, że smoki na poziomie piętnastu już prawie same decydują, co jedzą? Mój klient mówił, że jego smok odrzucił mięso i zażądał ryby. Ryby!"
        ];
        return tales[Math.floor(Math.random() * tales.length)];
    },

    // KUŹNIA
    orderCollar: () => "— Obroża dla smoka? Dam radę — mówi Brag. — Wróć za trzy dni, będzie gotowa. I przynieś ze sobą łuskę smoka, żebym mógł dostroić metal.",
    sharpenWeapon: () => {
        if (!canAfford(5)) return "— Pięć miedzi za ostrzenie — mówi kowal. — I ani grosza mniej.";
        spendCurrency(5);
        return "Kowal bierze twoje narzędzie i w kilkanaście sekund naostrza je do ideału. Teraz świeci jak nowe.";
    },
    browseSmith_OLD: () => {
        const items = [
            "Widzisz zbroję z łusek smoczych — lekką, ale niesamowicie wytrzymałą. Cena: 50 złotych. Na razie tylko popatrzysz.",
            "Na wystawie leży hełm wykuty z rudy znalezionej w Górach Sarak. Kowal mówi, że odporna na ogień.",
            "Mały amulet w kształcie smoczego pazura — podobno przynosi szczęście hodowcom. Kowal żąda 3 srebrnych."
        ];
        return items[Math.floor(Math.random() * items.length)];
    },
    browseSmith: () => { renderSmithShop(); return null; },

    // ŚWIĄTYNIA
    pray: () => {
        const blessings = [
            "Kapłanka prowadzi cię do ołtarza i szepcze modlitwę. Czujesz ciepłe drżenie w powietrzu. Astor słyszy.",
            "Klęczysz przed posągiem Smoczej Matki. Kamienna twarz wydaje się przez chwilę łagodna.",
            "Modlitwa płynie z ust spokojnie. Świece migoczą bez powodu. Może to znak, może tylko przeciąg."
        ];
        return blessings[Math.floor(Math.random() * blessings.length)];
    },
    healDragon: () => "Kapłanka przysłuchuje się opisowi smoka i kiwa głową. — Przyprowadź go jutro o świcie. Rytuał oczyszczenia trwa godzinę, ale powinno pomóc.",
    listenSermon: () => {
        const sermons = [
            "— Astor dała nam troje — mówi kapłanka. — Troje, by uczyć nas równowagi. Czwarte to pycha. Pycha prowadzi do upadku.",
            "— Smok nie jest narzędziem — śpiewa kapłanka cicho. — Jest sprzymierzeńcem. Traktujcie go jak równego, a odwdzięczy się tym samym.",
            "— Ogień, woda, ziemia, powietrze — to cztery żywioły, ale jeden duch. Każdy smok jest częścią większej całości."
        ];
        return sermons[Math.floor(Math.random() * sermons.length)];
    },

    // SZKOŁA MAGII
    magicLesson: () => { renderMagicSchoolContent(); return null; },
    spellBook: () => {
        const spells = [
            "Zaklęcie Spokoju — uspokoić wzburzonego smoka. Wymaga szczypty piasku z Gór Sarak.",
            "Mała Iluminacja — świetlna kula, która nie gaśnie przez godzinę. Bezużyteczna, ale efektowna.",
            "Zaklęcie Rozmowy ze Zwierzęciem — podobno działa na smoki. Wymaga dwudziestu lat nauki."
        ];
        return spells[Math.floor(Math.random() * spells.length)];
    },
    talkMaster: () => {
        const wisdom = [
            "— Widzę, że masz smoka — mówi mistrz nie otwierając oczu. — Żywioł jest ważny, ale charakter ważniejszy. Karm go dobrze, a sam znajdzie drogę.",
            "— Księżycowa Brama? — mistrz otwiera oczy. — Tak, słyszałem. Runy są w języku przedpotopowym. Nikt żyjący go nie zna. Ale może... kiedyś.",
            "— Szkoła uczy zaklęć. Ale prawdziwa smocza magia przychodzi sama — gdy smok ci ufa."
        ];
        return wisdom[Math.floor(Math.random() * wisdom.length)];
    },

    // ARENA
    watchFight: () => { renderArenaContent('smocza'); return null; },
    joinTournament: () => { renderArenaContent('ludzka'); return null; },
    talkOrganizer: () => "— Widziałem już wszystko na tej arenie — mówi mężczyzna z blizną. — Ale smoczego wojownika? Nigdy. To by dopiero było widowisko.",

    // POSTERUNEK
    reportIssue: () => "Kapitan wysłuchuje cię ze spokojem i notuje kilka słów. — Weźmiemy to pod uwagę — mówi i wraca do raportów. Wychodzisz z poczuciem, że nic z tego nie będzie.",
    wantedList: () => {
        const wanted = [
            "Na liście widzisz portret kogoś, kto wygląda trochę jak karczmarz. Ale pewnie zbieżność imion.",
            "Poszukiwany: Handlarz Marak, oskarżony o sprzedaż podrabianych smoczych jaj. Nagroda: 5 srebrnych.",
            "Lista jest długa. Większość to zwykłe przestępstwa. Jedno imię jest przekreślone — sprawa zamknięta."
        ];
        return wanted[Math.floor(Math.random() * wanted.length)];
    },
    offerHelp: () => "Kapitan unosi głowę. — Mamy kilka otwartych spraw, które nie są na tablicy ogłoszeń. Wróć, jak będziesz miał czas i... odpowiednie możliwości.",

    // PORT
    talkFishermen: () => {
        const fisherTales = [
            "— Widział pan? — pyta rybak. — Wczoraj w nocy coś wielkiego przepłynęło pod moją łódką. Coś z łuskami.",
            "— Z morza przynosi się czasem rzeczy, których nikt nie rozumie — mówi stary rybak. — Kiedyś wyłowiłem jajo. Nie wiem, co z niego wyszło.",
            "— Statki z Wysp Ognistych przypływają rzadko — mówi rybak. — Ale jak przypłyną, Handlarz Jaj jest pierwszym, który na nabrzeżu czeka."
        ];
        return fisherTales[Math.floor(Math.random() * fisherTales.length)];
    },
    checkShips: () => "Przy pomoście cumują dwie łódki rybackie i jeden większy statek z flagą, której nie rozpoznajesz. Marynarze rozładowują skrzynie — ciężkie, ostrożnie traktowane.",
    buyFish: () => {
        if (!canAfford(3)) return "Rybak kręci głową. — Trzy miedzi za rybę. Tyle.";
        spendCurrency(3);
        inventory['Świeża ryba'] = (inventory['Świeża ryba'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTab();
        return "Rybak podaje ci świeżą rybę zawiniętą w liście. Pachnie morzem. +1 Świeża ryba.";
    },

    // PAŁAC
    requestAudience: () => "Strażnik wysłuchuje cię z kamienną twarzą. — Audiencje udzielane są w pierwszą środę miesiąca, po złożeniu pisemnej prośby. Formularz dostępny w Bibliotece.",
    watchGuards: () => "Zmiana warty odbywa się punktualnie co cztery godziny. Strażnicy są zdyscyplinowani i milczący. Jeden z nich mruga do ciebie — albo to słońce go oślepiło.",

    // BIBLIOTEKA
    searchDragonBooks: () => {
        const books = [
            "Znajdujesz 'Zwyczaje Smoków Ognistych' — rozdział o nawykach żywieniowych. Autor twierdzi, że ogniste smoki lepiej rosną na mięsie niż jagodach.",
            "Natrafiasz na 'Historia Gór Sarak' — wzmianka o Księżycowej Bramie: 'Tradycja mówi o bramie otwieranej przez księżyc. Zapiski są niespójne.'",
            "Stara księga opisuje rytuał nadawania imion smokom. Autor radzi, by imię nadawać po pierwszym locie smoka — nie wcześniej."
        ];
        return books[Math.floor(Math.random() * books.length)];
    },
    readMaps: () => "Stare mapy pokazują Astorveil znacznie mniejsze niż dziś. Las Mgieł był wtedy dwa razy większy. I jest na nich zaznaczone coś na północy — bez nazwy, przekreślone.",
    talkLibrarian: () => { renderLibrarianRuneOptions(); return null; },

    // PLAC
    listenPlaza: () => {
        const gossip = [
            "Dwóch kupców kłóci się o cenę smoczego jaja. — Pięćdziesiąt złotych to mało! — krzyczy jeden. — Na wyspach płacą sto!",
            "Stara kobieta sprzedająca kwiaty szepce do sąsiadki: — Mówię ci, w tamtej nocy w Górach coś świeciło. Niebieskie światło. Jak księżyc, tylko z ziemi.",
            "Dziecko biega między nogami dorosłych wołając: — Mój tata widział smoka nad portem! Prawdziwy, duży!"
        ];
        return gossip[Math.floor(Math.random() * gossip.length)];
    },
    watchPeople: () => "Mężczyzna w szarym płaszczu siedzi przy fontannie od godziny, obserwując każdego kto przechodzi. Gdy spotykasz jego wzrok, wstaje i odchodzi.",
    restPlaza: () => {
        return "Siadasz przy fontannie. Woda pluszcze spokojnie. Gwar miasta jest tu stłumiony, jakby fontanna tworzyła własną bańkę ciszy. Odpoczywasz chwilę.";
    },

    // KARCZMA
    buyDrink: () => {
        if (!canAfford(3)) return "— Trzy miedzi za kufel — mówi karczmarz. — Tyle.";
        spendCurrency(3);
        return "Karczmarz stawia przed tobą kufel piwa. Zimne, lekko gorzkie, dokładnie takie jak powinno być. Miły odpoczynek.";
    },
    listenTavern: () => {
        const tavernTalk = [
            "— Słyszałeś? — pyta jeden pijący. — Handlarz Jaj dostał zamówienie od samego Pałacu. Mówią, że Władca chce smoka.",
            "— Księżycowa Brama otworzyła się ostatnio trzy lata temu — wspomina stary przy kominku. — Ktoś wszedł. Nie wrócił. Ale to może legenda.",
            "— Las Mgieł ma nowego mieszkańca — szepcze ktoś. — Widzieli go pasterze. Duży, milczący, zostawia ślady jak tace."
        ];
        return tavernTalk[Math.floor(Math.random() * tavernTalk.length)];
    },
    talkTraveler: () => {
        const travelers = [
            "Wędrowiec przy stoliku pochodzi z dalekiego południa. — U nas smoki to rzadkość — mówi. — Ale słyszałem o hodowcach tu, w Astorveil. Mówią, że najlepsi na świecie.",
            "Kobieta z węzełkiem na plecach patrzy na ciebie podejrzliwie, ale w końcu mówi: — Szłam przez Góry Sarak. Widziałam bramę. Nie dotykałam.",
            "Stary rycerz popija piwo i bez pytania mówi: — Byłem na Szczycie Sarak raz w życiu. Widać stąd do końca świata. Prawie."
        ];
        return travelers[Math.floor(Math.random() * travelers.length)];
    },
    rentRoom: () => {
        if (!canAfford(5)) return "— Pięć miedzi za izbę na noc — mówi karczmarz. — Wróć jak będziesz miał.";
        spendCurrency(5);
        return "Karczmarz podaje ci klucz z drewnianą zawieszką. Izba jest mała, ale czysta. Śpisz spokojnie. Rano czujesz się lepiej.";
    },

    // LAS - LEŚNICZKA
    talkForester: () => {
        const foresterTales = [
            "Kobieta nie podnosi wzroku. — Las nie jest zły — mówi powoli. — Ale ukarze tych, którzy przychodzą bez szacunku. Pamiętaj o tym.",
            "— Jezioro Snu ma swoją naturę — mówi. — Nie pij z niego o wschodzie słońca. Nigdy. Dlaczego? Bo tak mówię.",
            "— Polana Urodzaju istnieje, bo kiedyś stała tu wielka świątynia — mówi leśniczka. — Kiedy ją zburzono, ziemia pamiętała."
        ];
        return foresterTales[Math.floor(Math.random() * foresterTales.length)];
    },
    askPaths: () => "Kobieta odkłada cerowanie i rysuje palcem w powietrzu. — Jezioro Snu jest na wschód. Polana na północ. Ruiny... nie polecam na razie. Wodospad jest bezpieczny. Gniazdo — zostaw w spokoju.",
    buyHerbs: () => {
        if (!canAfford(8)) return "— Osiem miedzi. Ani grosza mniej — mówi leśniczka.";
        spendCurrency(8);
        inventory['Zioła leśne'] = (inventory['Zioła leśne'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTab();
        return "Leśniczka podaje ci wiązankę suszonych ziół. Pachną mocno i dziwnie. — Na co to? — pytasz. — Na wszystko — odpowiada. +1 Zioła leśne.";
    },

    // LAS - JEZIORO
    drinkLake: () => {
        const outcomes = [
            "Woda jest chłodna i czysta. Pije się dobrze. Nic się nie dzieje. Ale przez resztę dnia masz wrażenie, że widzisz coś na obrzeżu wzroku.",
            "Woda smakuje jak deszcz. Zwykły deszcz. Ale zanim odejdziesz, przez chwilę w tafli widzisz twarz — nie swoją.",
            "Pijesz. Nic. Woda jak woda. Może jezioro cię oceniło i uznało, że nie czas na wizje."
        ];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    },
    throwStone: () => {
        const outcomes = [
            "Kamień uderza w wodę z głuchym pluskiem. Kręgi rozchodzą się powoli — wolniej niż powinny. Zanim znikną, widzisz w nich coś, co nie jest odbiciem nieba.",
            "Kamień tonie. Woda znowu staje nieruchomo w ciągu sekundy. Jakby nic nie wrzuciłeś.",
            "Kamień znika przed dotknięciem wody. Nie słyszysz plusku."
        ];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    },
    sitLake: () => "Siedzisz przy brzegu przez długi czas. Woda jest nieruchoma. Niebieski kwiat obok ciebie otwiera się, choć słońca prawie nie ma. Czujesz się spokojniejszy — i trochę nieswojo z tym spokojem.",
    pickFlowers: () => {
        inventory['Niebieski kwiat'] = (inventory['Niebieski kwiat'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTab();
        return "Zrywasz jeden kwiat. Jest zimny w dotyku. Nie więdnie przez cały dzień. +1 Niebieski kwiat.";
    },

    // POLANA
    gatherBerries: () => {
        const success = Math.random() > 0.2;
        if (success) {
            const amount = Math.floor(Math.random() * 2) + 1;
            foodItems.jagody = (foodItems.jagody || 0) + amount;
            localStorage.setItem('foodItems', JSON.stringify(foodItems));
            updateInventoryTab();
            return `Zbierasz jagody przez chwilę. Są duże, syte i pachną jak magia. +${amount} Jagody.`;
        }
        return "Szukasz jagód, ale ptaki były przed tobą. Polana jest tego dnia pusta.";
    },
    gatherHerbs: () => {
        const success = Math.random() > 0.3;
        if (success) {
            inventory['Zioła leśne'] = (inventory['Zioła leśne'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
            return "Między trawami znajdujesz pęczek rzadkich ziół — białe kwiaty, wąskie liście. +1 Zioła leśne.";
        }
        return "Szukasz ziół, ale dziś polana daje tylko trawę i kwiaty, których nie rozpoznajesz.";
    },
    sitTree: () => {
        const messages = [
            "Drzewo jest stare. Opierasz się o korę i czujesz wibrację — jakby w środku coś oddychało bardzo powoli. Za wolno jak dla drzewa.",
            "Siedzisz pod rozłożystą koroną. Liście poruszają się, choć wiatru nie ma. Gdzieś wysoko słyszysz coś, co brzmi jak westchnienie.",
            "Pod drzewem jest spokój głębszy niż gdziekolwiek indziej. Siedzisz długo. Kiedy wstajesz, masz wrażenie, że drzewo cię zapamiętało."
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    },
    digDirt: () => {
        const found = Math.random() > 0.5;
        if (found) {
            inventory['Stary kamień'] = (inventory['Stary kamień'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
            return "Grzebiesz w ziemi. Między korzeniami znajdujesz gładki, ciemny kamień — wygląda na obrobiony. +1 Stary kamień.";
        }
        return "Grzebiesz w ziemi. Robaki, korzenie i glina. Ziemia jest tu wyjątkowo bogata, ale skarbu nie ma.";
    },

    // WODOSPAD
    behindWaterfall: () => {
        const outcomes = [
            "Za zasłoną wody jest wnęka. Sucha, choć otoczona wodą. Na ścianie rysunki — smoki i ludzie razem, ciągnące jakiś ciężar. Albo tańczące. Trudno powiedzieć.",
            "Za wodą jest ciemność i skała. Ale na podłodze leży kamień inny od reszty — gładki, ciepły w dotyku, jakby ktoś go tu zostawił. Bierzesz go.",
            "Za wodą jest przestrzeń. Stoisz w niej przez chwilę otoczony szumem. Czujesz się jak w innym miejscu. Może w innym czasie."
        ];
        const r = outcomes[Math.floor(Math.random() * outcomes.length)];
        if (r.includes('Bierzesz')) {
            inventory['Ciepły kamień'] = (inventory['Ciepły kamień'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
        }
        return r;
    },
    fillFlask: () => "Napełniasz bukłak czystą wodą ze źródła wodospadu. Zimna, krystaliczna. Smakuje jak góry.",
    examineDrawings: () => "Rysunki są stare — tak stare, że ciężko powiedzieć kiedy je zrobiono. Pokazują smoka i człowieka w ceremonialnej pozie. Coś między ich rękoma — okrągłe, może jajo.",
    listenWaterfall: () => {
        const voices = [
            "Szum wody jest rytmiczny. Stoisz i słuchasz. Przez chwilę wydaje się, że w dźwięku jest coś więcej — nie słowa, ale coś na kształt sensu.",
            "Woda mówi. Nie słowami. Ale stojąc tu przez chwilę, czujesz spokój, który nie przychodzi znikąd.",
            "Szum jest jednostajny. Nic nie słyszysz. Albo za mało słuchasz."
        ];
        return voices[Math.floor(Math.random() * voices.length)];
    },

    // RUINY
    examineAltar: () => "Symbol na kamieniu to splot trzech linii tworzących kształt skrzydlatego stworzenia. Pod spodem mniejszy symbol — okrąg z krzyżem w środku. Znasz go skądś, ale nie możesz sobie przypomnieć.",
    leaveOffering: () => {
        if (Object.keys(inventory).length === 0 && (foodItems.mięso || 0) === 0 && (foodItems.jagody || 0) === 0) {
            return "Nie masz nic do zaoferowania. Ołtarz milczy.";
        }
        const outcomes = [
            "Zostawiasz jagody na ołtarzu. Świeca, której tu nie było, zapala się sama. Gaśnie po chwili. Zostaje wosk.",
            "Zostawiasz mięso na kamieniu. Nic się nie dzieje. Ale kiedy wychodzisz z ruin, czujesz, że ktoś na ciebie patrzy. Nie wrogo.",
            "Zostawiasz jeden ze swoich przedmiotów. Kamień drga pod palcami przez sekundę."
        ];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    },
    searchRuins: () => {
        const found = Math.random() > 0.4;
        if (found) {
            const items = ['Stara moneta', 'Fragment ceramiki', 'Zardzewiały klucz'];
            const item = items[Math.floor(Math.random() * items.length)];
            inventory[item] = (inventory[item] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
            return `Przeszukujesz ruiny. Pod wywróconym kamieniem znajdujesz ${item}. +1 ${item}.`;
        }
        return "Przeszukujesz ruiny dokładnie. Kamienie, ziemia, liście. Nic oprócz historii, która nie chce się ujawnić.";
    },

    // GNIAZDO
    climbTree: () => {
        const outcomes = [
            "Wspinasz się na kilka metrów, gdy gałąź pęka pod tobą. Lądowanie jest twarde, ale bezpieczne. Nie widziałeś gniazda z bliska.",
            "Docierasz do gniazda. Wewnątrz są pióra i kości — i jeden jasny przedmiot. Zanim zdążysz go wziąć, coś szarpie cię za ubranie i jesteś z powrotem na ziemi."
        ];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    },
    observeNest: () => {
        const outcomes = [
            "Czekasz. Po chwili z gniazda wysuwa się głowa — wielki ptak z żółtymi oczami. Patrzy na ciebie. Ani wrogo, ani przyjaźnie. Potem chowa głowę.",
            "Czekasz długo. Nic. Potem nagle z koron drzew opada wielkie pióro — złoto-brązowe, dłuższe niż twoje ramię. Ląduje u twoich stóp.",
            "Obserwujesz. Gniazdo milczy. Ale masz pewność, że coś tam jest — i że ono też ciebie obserwuje."
        ];
        const r = outcomes[Math.floor(Math.random() * outcomes.length)];
        if (r.includes('pióro')) {
            inventory['Złote pióro'] = (inventory['Złote pióro'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
        }
        return r;
    },
    sneakAway: () => "Wycofujesz się ostrożnie, krok po kroku, nie odrywając wzroku od gniazda. Kiedy jesteś dość daleko — odwracasz się i szybko odchodzisz. To była mądra decyzja.",

    // GÓRY - PODNÓŻE
    talkShepherd: () => {
        const tales = [
            "— Na szczyt? — pyta pasterz. — Dużo ludzi próbuje. Niewielu dociera. I nie chodzi o nogi. Góra sama decyduje, kogo przepuszcza.",
            "— Brama na wschodnim zboczu? — stary wzdycha. — Znam ją od dziecka. Dziadek mówił, że w księżycowe noce coś w niej się świeci. Nigdy nie sprawdzałem.",
            "— Kozy tu rosną zdrowe bo powietrze czyste — mówi pasterz. — A smoki? Jedno przelatuje co jakiś czas nad szczytem. Duże. Wolne."
        ];
        return tales[Math.floor(Math.random() * tales.length)];
    },
    examineFirstStep: () => "Pierwszy Próg to ogromny, płaski głaz pokryty inskrypcjami w języku, którego nikt z żyjących nie czyta. Pasterz mówi, że stoi tu od zawsze. Kamień jest ciepły w dotyku nawet w chłodne dni.",
    restFoot: () => "Siadasz przy chacie na drewnianej ławie. Pasterz przynosi ci kubek gorącego napoju z ziół. Siedzisz i patrzysz na górę. Wydaje się bliska i nieskończenie daleka jednocześnie.",
    buyCheese: () => {
        if (!canAfford(4)) return "— Cztery miedzi — mówi pasterz. — Na więcej nie mogę zejść.";
        spendCurrency(4);
        inventory['Górski ser'] = (inventory['Górski ser'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTab();
        return "Pasterz kroi gruby kawałek sera i zawija w liście. Ser jest twardy, ostry i wyjątkowo smaczny. +1 Górski ser.";
    },

    // SZCZYT
    meditateTop: () => "Siadasz na zimnych kamieniach i zamykasz oczy. Wiatr przestaje. Przez chwilę jest absolutna cisza — jakby góra zatrzymała oddech. Kiedy otwierasz oczy, niebo wydaje się bliższe.",
    watchHorizon: () => "Widać stąd wszystko. Las Mgieł jak zielona chmura na południu. Astorveil jak model z kamieni. Morze na zachodzie — błyszczące. I coś na dalekim północy — ciemna plama, której na mapach nie ma.",
    searchCracks: () => {
        const found = Math.random() > 0.5;
        if (found) {
            inventory['Kryształ górski'] = (inventory['Kryształ górski'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTab();
            return "W szczelinie między skałami coś błyszczy. Wyciągasz kryształ górski — przezroczysty, zimny, piękny. +1 Kryształ górski.";
        }
        return "Przeszukujesz szczeliny między skałami. Wiatr, kamień i suchy mech. Tym razem nic.";
    },
    callDragon: () => {
        return "Wydajesz dźwięk, który wydaje ci się właściwy — nie słowo, nie rozkaz, coś pośrodku. Góra odpowiada echem. Daleko, bardzo daleko, słyszysz odpowiedź. Może smok. Może wiatr.";
    },

    // KSIĘŻYCOWA BRAMA
    examineRunes: () => "Runy są głęboko wyrytle — każda precyzyjna jak chirurgiczny nacięcie. Wzory się powtarzają, co sugeruje alfabet. Ale powiązania są zupełnie obce. Bibliotekarz w Astorveil mógłby się zainteresować.",
    touchGate: () => {
        const moonStatus = getMoonGateStatus();
        if (moonStatus.open) {
            return "Dotykasz filaru. Kamień jest ciepły. Przez Twoją rękę przechodzi drżenie — nie nieprzyjemne, jak kontakt z czymś żywym. Runy na chwilę rozświetlają się srebrzyście, potem gasną.";
        }
        return "Dotykasz kamienia. Zimny, twardy, milczący. Nic. Jakbyś dotykał zwykłej skały.";
    },
    enterGate: () => {
        const moonStatus = getMoonGateStatus();
        if (!moonStatus.open) {
            return "Próbujesz przejść przez bramę. Stajesz między filarami. Nic. Brama jest jak każdy inny łuk skalny — tylko skała i powietrze.";
        }
        const entered = localStorage.getItem('moonGateEntered') === 'true';
        localStorage.setItem('moonGateEntered', 'true');
        if (!entered) {
            return "Przechodzisz przez bramę. Przez sekundę wszystko jest srebrzyste i ciche — absolutna cisza, jak przed snem. Potem z powrotem jesteś przy bramie, od drugiej strony. Ale coś jest inne. Nie wiesz co. Po powrocie do Astorveil, jeden ze smoków zachowuje się spokojniej.";
        }
        return "Przechodzisz przez bramę ponownie. Cisza. Srebro. I z powrotem. Tym razem bez zaskoczenia — ale nie bez poczucia, że brama coś wie o tobie.";
    }
};

function handleLocationAction(regionKey, locationId, actionName) {
    if (actionName === 'back') {
        openRegion(regionKey);
        return;
    }

    const handler = locationResponses[actionName];
    let result = null;

    if (typeof handler === 'function') {
        result = handler();
    }

    if (result === null || result === undefined) return;

    // If handler redirected (like openWorkTab), don't show result
    if (['openWorkTab', 'openMerchantTab', 'browseSmith', 'magicLesson', 'watchFight', 'joinTournament', 'talkLibrarian'].includes(actionName)) return;

    const actionArea = document.getElementById("location-action-area");
    if (!actionArea) return;

    // Find the location
    const region = worldData[regionKey];
    const loc = region.locations.find(l => l.id === locationId);

    actionArea.innerHTML = `
        <div style="padding: 12px; margin: 10px 0; background: rgba(15,30,55,0.8); border-left: 3px solid #cfd8ff; border-radius: 6px; color: #dfe8ff; font-style: italic; line-height: 1.6;">
            ${result}
        </div>
        ${renderLocationActions(regionKey, locationId, loc.actions)}
    `;
}


/* ======= ORYGINALNA LOGIKA GRY (script_orig.js) ======= */
/* -----------------------------------------
   ZMIENNE STARTOWE
----------------------------------------- */
let chosenDragon = localStorage.getItem("chosenDragon");
let dragonName = localStorage.getItem("dragonName") || "Twój Smok";

let eggHeats = Number(localStorage.getItem("eggHeats")) || 0;
let lastHeat = Number(localStorage.getItem("lastHeat")) || 0;

/* DRUGI SMOK */
let secondDragonUnlocked = localStorage.getItem("secondDragonUnlocked") === "true";
let secondDragonElement = localStorage.getItem("secondDragonElement") || null;
let secondEggHeats = Number(localStorage.getItem("secondEggHeats")) || 0;
let secondLastHeat = Number(localStorage.getItem("secondLastHeat")) || 0;
let secondDragonName = localStorage.getItem("secondDragonName") || "Drugi Smok";

// poziomy i karmienie
let dragonFeedings = Number(localStorage.getItem("dragonFeedings")) || 0;
let dragonLevel = Math.min(15, dragonFeedings * 5);

let secondDragonFeedings = Number(localStorage.getItem("secondDragonFeedings")) || 0;
let secondDragonLevel = Math.min(15, secondDragonFeedings * 5);

// odblokowanie trzeciego oraz stan handlarza
let thirdDragonUnlocked = localStorage.getItem("thirdDragonUnlocked") === "true";
let thirdDragonElement = localStorage.getItem("thirdDragonElement") || null;
let thirdEggHeats = Number(localStorage.getItem("thirdEggHeats")) || 0;
let thirdLastHeat = Number(localStorage.getItem("thirdLastHeat")) || 0;
let thirdDragonName = localStorage.getItem("thirdDragonName") || "Trzeci Smok";

let thirdDragonFeedings = Number(localStorage.getItem("thirdDragonFeedings")) || 0;
let thirdDragonLevel = Math.min(15, thirdDragonFeedings * 5);

let merchantAfterSecondVisit = localStorage.getItem("merchantAfterSecondVisit") === "true";
let merchantAfterThirdVisit = localStorage.getItem("merchantAfterThirdVisit") === "true";
let merchantGreetingShown = localStorage.getItem("merchantGreetingShown") === "true";

// praca i waluty
let workUnlocked = localStorage.getItem("workUnlocked") === "true";
let copper = Number(localStorage.getItem("copper")) || 0;
let silver = Number(localStorage.getItem("silver")) || 0;
let gold = Number(localStorage.getItem("gold")) || 0;

// short job limits (duration < 12 seconds scaled)
let shortJobsDoneDate = localStorage.getItem("shortJobsDoneDate") || null;
let shortJobsDoneCount = Number(localStorage.getItem("shortJobsDoneCount")) || 0;

let dailyJobs = JSON.parse(localStorage.getItem("dailyJobs")) || null;
let currentJob = JSON.parse(localStorage.getItem("currentJob")) || null;
let jobTimerInterval = null;

// inventory tracking
let inventory = JSON.parse(localStorage.getItem("inventory")) || {};
let foodItems = JSON.parse(localStorage.getItem("foodItems")) || { mięso: 0, jagody: 0 };


// helper to format milliseconds into hh:mm:ss
function formatTime(ms) {
    if (ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// currency adjustment with overflow conversion
function normalizeCurrency() {
    // convert copper to silver
    if (copper >= 100) {
        const extras = Math.floor(copper / 100);
        copper -= extras * 100;
        silver += extras;
    }
    // convert silver to gold
    if (silver >= 50) {
        const extras = Math.floor(silver / 50);
        silver -= extras * 50;
        gold += extras;
    }
    localStorage.setItem('copper', copper);
    localStorage.setItem('silver', silver);
    localStorage.setItem('gold', gold);
}

function adjustCurrency(type, amount) {
    if (type === 'copper') copper += amount;
    if (type === 'silver') silver += amount;
    if (type === 'gold') gold += amount;
    normalizeCurrency();
    updateCurrencyDisplay();
}

// convert in-game hours to milliseconds; scale makes 1h = 1s for testing
const TIME_SCALE = 3600; // 3600 real seconds = 1 in-game hour
function hoursToMs(h) {
    return h * 3600 * 1000 / TIME_SCALE;
}

// job definitions with descriptions, bonus chances, and items
const jobPool = [
    // 4-6h jobs (short)
    { name: "Pomoc w magazynie kupca Lireny", duration: hoursToMs(5), reward: { copper: 50 }, description: "Pomoc przy organizacji towaru w magazynie.", bonusChance: 0.15, bonusItems: ["Lina", "Worek płócienny"] },
    { name: "Dostarczanie listów", duration: hoursToMs(5), reward: { copper: 45 }, description: "Dostarczenie listów po całym mieście.", bonusChance: 0.15, bonusItems: ["Stary list", "Pieczęć"] },
    { name: "Pomoc w kuchni gospody", duration: hoursToMs(5), reward: { copper: 60 }, description: "Przygotowywanie posiłków dla gości gospody.", bonusChance: 0.50, bonusItems: ["Mięso surowe", "Jagody", "Chleb"] },
    // 8-12h jobs (medium)
    { name: "Straż przy bramie miasta", duration: hoursToMs(10), reward: { silver: 2 }, description: "Czuwanie nad bezpieczeństwem bram miasta.", bonusChance: 0.80, bonusItems: ["Zbroja skórzana", "Hełm żelazny"] },
    { name: "Zbieranie drewna w Lesie Mgieł", duration: hoursToMs(10), reward: { silver: 1, copper: 20 }, description: "Zbieranie drewna w mrocznym lesie.", bonusChance: 0.15, bonusItems: ["Topór", "Ogniste pochodnie"] },
    { name: "Pomoc w lecznicy", duration: hoursToMs(10), reward: { copper: 80, silver: 1 }, description: "Asystowanie przy uzdrawianiu pacjentów.", bonusChance: 0.15, bonusItems: ["Zioła uzdrawiające", "Mikstura"] },
    // 14-18h jobs (long)
    { name: "Eskorta małej karawany", duration: hoursToMs(16), reward: { silver: 3 }, description: "Ochrona handlarzy w podróży przez niebezpieczne tereny.", bonusChance: 0.15, bonusItems: ["Mapa terenu", "Płaszcz podróżnika"] },
    { name: "Prace w tartaku", duration: hoursToMs(16), reward: { silver: 2, copper: 30 }, description: "Praca przy piłowaniu drewna w tartaku.", bonusChance: 0.15, bonusItems: ["Piła", "Rękawice robocze"] },
    { name: "Pomoc w archiwum miejskim", duration: hoursToMs(16), reward: { silver: 2 }, description: "Katalogowanie starych dokumentów i zwojów.", bonusChance: 0.15, bonusItems: ["Stara księga", "Tusz do pisania"] },
    // 20-24h jobs (very long)
    { name: "Eskorta dużej karawany handlowej", duration: hoursToMs(22), reward: { silver: 5 }, description: "Ochrona bogatej karawany handlarzy na dalekim szlaku.", bonusChance: 0.15, bonusItems: ["Zardzewiana zbroja", "Magia ochronna"] },
    { name: "Praca w kopalni", duration: hoursToMs(22), reward: { silver: 4 }, description: "Wydobywanie rud z głębin kopalni.", bonusChance: 0.15, bonusItems: ["Rudna gałąź", "Hełm górnika"] },
    { name: "Nocna służba w garnizonie", duration: hoursToMs(22), reward: { silver: 4 }, description: "Pełnienie nocnej straży w garnizonie żołnierzy.", bonusChance: 0.15, bonusItems: ["Insygnia wojskowa", "Mapa fortyfikacji"] }
];

// determine whether a job is considered "short" for the daily limit
function isShortJob(job) {
    return job.duration < 12000; // less than 12 seconds scaled
}

function resetShortJobsIfNewDay() {
    const today = new Date().toISOString().slice(0,10);
    if (shortJobsDoneDate !== today) {
        shortJobsDoneDate = today;
        shortJobsDoneCount = 0;
        localStorage.setItem("shortJobsDoneDate", shortJobsDoneDate);
        localStorage.setItem("shortJobsDoneCount", shortJobsDoneCount);
    }
}

function pickJobs() {
    resetShortJobsIfNewDay();
    const categories = [
        jobPool.slice(0,3),
        jobPool.slice(3,6),
        jobPool.slice(6,9),
        jobPool.slice(9)
    ];
    // if short jobs limit reached, remove first category entirely
    if (shortJobsDoneCount >= 2) {
        categories[0] = [];
    }
    dailyJobs = categories.map(cat => {
        if (cat.length === 0) return null;
        return cat[Math.floor(Math.random() * cat.length)];
    });
    localStorage.setItem("dailyJobs", JSON.stringify(dailyJobs));
}

function startJob(job) {
    // determine bonus
    const bonusAward = Math.random() < job.bonusChance ? job.bonusItems : null;
    
    currentJob = {
        ...job,
        endTime: Date.now() + job.duration,
        bonusAward: bonusAward
    };
    localStorage.setItem("currentJob", JSON.stringify(currentJob));
    if (jobTimerInterval) clearInterval(jobTimerInterval);
    jobTimerInterval = setInterval(updateWorkTab,1000);
    updateWorkTab();
}

function completeJob() {
    if (!currentJob) return;
    
    // award currency
    Object.entries(currentJob.reward).forEach(([type,amt])=>{
        adjustCurrency(type, amt);
    });
    
    // check for bonus
    let bonusMsg = "";
    if (currentJob.bonusAward) {
        bonusMsg = "Jednak to nie wszystko...\n\nZnalazłeś dodatkowe przedmioty:\n" + currentJob.bonusAward.join(", ");
        currentJob.bonusAward.forEach(item => {
            if (item === "Mięso surowe") {
                foodItems.mięso = (foodItems.mięso || 0) + 1;
            } else if (item === "Jagody") {
                foodItems.jagody = (foodItems.jagody || 0) + 1;
            } else {
                inventory[item] = (inventory[item] || 0) + 1;
            }
        });
        localStorage.setItem("inventory", JSON.stringify(inventory));
        localStorage.setItem("foodItems", JSON.stringify(foodItems));
    }
    
    // if this was a short job, count it and possibly remove future offerings
    if (isShortJob(currentJob)) {
        resetShortJobsIfNewDay();
        shortJobsDoneCount++;
        localStorage.setItem("shortJobsDoneCount", shortJobsDoneCount);
    }
    
    currentJob = null;
    localStorage.removeItem("currentJob");
    
    if (bonusMsg) {
        alert("Praca zakończona! Otrzymałeś nagrody.\n\n" + bonusMsg);
    } else {
        alert("Praca zakończona! Otrzymałeś nagrody.");
    }
    updateWorkTab();
    updateInventoryTab();
}

function skipJob() {
    if (!currentJob) return;
    if (jobTimerInterval) clearInterval(jobTimerInterval);
    // immediately finish
    currentJob.endTime = Date.now();
    completeJob();
}


function updateWorkTab() {
    // reset short-job count and wipe daily jobs if it's a new day
    const today = new Date().toISOString().slice(0,10);
    if (shortJobsDoneDate !== today) {
        resetShortJobsIfNewDay();
        dailyJobs = null;
        localStorage.removeItem("dailyJobs");
    }

    const work = document.getElementById("work-content");
    let html = "";
    
    // show greeting only when work tab unlocked and no job currently running
    if (!workUnlocked) {
        html += `<div style="margin-bottom:20px; padding:15px; background:transparent; border-left:4px solid #5a6a7a; border-radius:4px; color:#e0e0e0;">
            <p style="font-style: italic; color:#bbb; margin:0;">
                Docierasz do tablicy ogłoszeń gdzie ludzie oferują zapłatę za wykonaną pracę.
            </p>
        </div>`;
        html += `<p>Zakładka będzie dostępna później w grze.</p>`;
        work.innerHTML = html;
        return;
    }

    if (!currentJob) {
        html += `<div style="margin-bottom:20px; padding:15px; background:transparent; border-left:4px solid #5a6a7a; border-radius:4px; color:#e0e0e0;">
            <p style="font-style: italic; color:#bbb; margin:0;">
                Docierasz do tablicy ogłoszeń gdzie ludzie oferują zapłatę za wykonaną pracę.
            </p>
        </div>`;
    }
    // if limit reached remove short jobs from current listings
    if (shortJobsDoneCount >= 2 && dailyJobs) {
        dailyJobs = dailyJobs.map(job => job && isShortJob(job) ? null : job);
        localStorage.setItem("dailyJobs", JSON.stringify(dailyJobs));
    }

    if (currentJob) {
        const remaining = currentJob.endTime - Date.now();
        if (remaining <= 0) {
            completeJob();
            return;
        }
        html += `<div class="dragon-slot" style="margin-bottom:25px; padding:15px; color:#e0e0e0;">
                    <p style="margin:0 0 12px 0; font-size:1.05em;"><b>📋 Wykonywana praca</b></p>
                    <p style="margin:8px 0; font-size:1.1em;"><b>${currentJob.name}</b></p>
                    <p style="margin:10px 0; color:#bbb;">Pozostały czas: <b style="color:#e0e0e0; font-size:1.05em;">${formatTime(remaining)}</b></p>
                    <div class="dialog-button" onclick="skipJob()" style="margin-top:12px;">⏭️ Pomiń czekanie</div>
                 </div>`;
    } else {
        if (!dailyJobs) pickJobs();
        html += ``;
        dailyJobs.forEach((job, idx) => {
            if (!job) return; // skip slots where we've removed short jobs
            const durationMs = job.duration;
            const totalSeconds = Math.floor(durationMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            let durationText = '';
            if (hours > 0) {
                durationText = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                durationText = `${minutes}m ${seconds}s`;
            } else {
                durationText = `${seconds}s`;
            }
            
            html += `<div class="dragon-slot" style="margin-bottom:25px; padding:15px; color:#e0e0e0;">
                        <p style="margin:0 0 8px 0; font-size:1.1em;"><b>${job.name}</b></p>
                        <p style="font-size:0.95em; color:#aaa; margin:5px 0 10px 0; font-style:italic;">${job.description}</p>
                        <p style="margin:8px 0;"><b>⏱️ Czas:</b> ${durationText}</p>
                        <p style="margin:8px 0;"><b>💰 Nagrody:</b></p>
                        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; background:rgba(255,255,255,0.05);">
                            <tr style="border-bottom:1px solid #cccccc; background:transparent; color:#e0e0e0;">
                                ${job.reward.copper ? `<td style="padding:10px; border:1px solid #cccccc; color:#e0e0e0;">Miedź: ${job.reward.copper}</td>` : ''}
                                ${job.reward.silver ? `<td style="padding:10px; border:1px solid #cccccc; color:#e0e0e0;">Srebro: ${job.reward.silver}</td>` : ''}
                                ${job.reward.gold ? `<td style="padding:10px; border:1px solid #cccccc; color:#e0e0e0;">Złoto: ${job.reward.gold}</td>` : ''}
                            </tr>
                        </table>
                        <div class="dialog-button" onclick="startJob(dailyJobs[${idx}])" style="margin-top:10px;">✓ Wykonaj</div>
                     </div>`;
        });
    }
    work.innerHTML = html;
}

function unlockWork() {
    workUnlocked = true;
    localStorage.setItem("workUnlocked","true");
    document.getElementById("tab-work").style.display = "block";
    updateWorkTab();
}

function updateInventoryTab() {
    const inv = document.getElementById("inventory-content");
    let html = `<h2>Ekwipunek</h2>`;
    
    // items from quests
    if (Object.keys(inventory).length > 0) {
        html += `<h3>Przedmioty</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <tr style="border-bottom:1px solid #ffffff; background:transparent; color:#e0e0e0;">
                        <th style="padding:10px; text-align:left;">Przedmiot</th>
                        <th style="padding:10px; text-align:right;">Ilość</th>
                    </tr>`;
        Object.entries(inventory).forEach(([item, count]) => {
            html += `<tr style="border-bottom:1px solid #ffffff; color:#e0e0e0;">
                        <td style="padding:10px;">${item}</td>
                        <td style="padding:10px; text-align:right;"><b>${count}</b></td>
                    </tr>`;
        });
        html += `</table>`;
    } else {
        html += `<p style="color:#999;">Brak przedmiotów.</p>`;
    }
    
    // food items
    html += `<h3>Jedzenie na smoki</h3>
            <table style="width:100%; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #ffffff; background:transparent; color:#e0e0e0;">
                    <th style="padding:10px; text-align:left;">Typ</th>
                    <th style="padding:10px; text-align:right;">Ilość</th>
                </tr>
                <tr style="border-bottom:1px solid #ffffff; color:#e0e0e0;">
                    <td style="padding:10px;">Mięso</td>
                    <td style="padding:10px; text-align:right;"><b>${foodItems.mięso || 0}</b></td>
                </tr>
                <tr style="border-bottom:1px solid #ffffff; color:#e0e0e0;">
                    <td style="padding:10px;">Jagody</td>
                    <td style="padding:10px; text-align:right;"><b>${foodItems.jagody || 0}</b></td>
                </tr>
            </table>`;
    
    inv.innerHTML = html;
}

/* -----------------------------------------
   PYTANIA STARTOWE
----------------------------------------- */
const questions = [
    {
        text: "Wędrując przez góry Sarak, napotykasz porzucone obozowisko. Co robisz?",
        answers: [
            { text: "Szukam śladów walki. Ogień mnie prowadzi.", element: "ogien" },
            { text: "Szukam mokrych śladów. Woda zna drogę.", element: "woda" },
            { text: "Wsłuchuję się w ziemię.", element: "ziemia" },
            { text: "Podążam za wiatrem.", element: "powietrze" }
        ]
    },
    {
        text: "W ruinach świątyni słyszysz dźwięk. Co robisz?",
        answers: [
            { text: "Wchodzę bez wahania.", element: "ogien" },
            { text: "Szukam wilgoci.", element: "woda" },
            { text: "Dotykam kamieni.", element: "ziemia" },
            { text: "Słucham echa.", element: "powietrze" }
        ]
    },
    {
        text: "Na rozdrożu spotykasz wędrowca. Co robisz?",
        answers: [
            { text: "Pytam o drogę.", element: "ogien" },
            { text: "Płynę z losem.", element: "woda" },
            { text: "Słucham historii.", element: "ziemia" },
            { text: "Idę za intuicją.", element: "powietrze" }
        ]
    }
];

let currentQuestion = 0;
let elementScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

/* -----------------------------------------
   EKRAN POWITALNY
----------------------------------------- */
function showQuestion() {
    if (chosenDragon) {
        startGame();
        return;
    }

    const intro = document.getElementById("intro");

    intro.innerHTML = `
        <div class="dialog-window" style="text-align:center; margin-top:150px;">
            <div class="dialog-title">Witaj w Smoczych Włościach</div>
            <div class="dialog-text">Twoja przygoda zaraz się rozpocznie...</div>
        </div>
    `;

    setTimeout(() => {
        currentQuestion = 0;
        elementScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };
        showNextStartQuestion();
    }, 5000);
}

/* -----------------------------------------
   PYTANIA STARTOWE
----------------------------------------- */
function showNextStartQuestion() {
    const intro = document.getElementById("intro");
    const q = questions[currentQuestion];

    intro.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Pytanie ${currentQuestion + 1}</div>
            <div class="dialog-text">${q.text}</div>
            ${q.answers.map(a => `
                <div class="dialog-button" onclick="chooseStartAnswer('${a.element}')">${a.text}</div>
            `).join("")}
        </div>
    `;
}

function chooseStartAnswer(element) {
    elementScores[element]++;
    currentQuestion++;

    if (currentQuestion < questions.length) {
        showNextStartQuestion();
    } else {
        finalizeDragon();
    }
}

/* -----------------------------------------
   OPIS JAJKA
----------------------------------------- */
function finalizeDragon() {
    const intro = document.getElementById("intro");

    const chosen = Object.entries(elementScores).sort((a,b)=>b[1]-a[1])[0][0];
    chosenDragon = chosen;
    localStorage.setItem("chosenDragon", chosen);

    const descriptions = {
        ogien: "ciepło, które prawie parzy Cię w dłonie.",
        woda: "chłód przypominający dotyk głębin oceanu.",
        ziemia: "stabilne, kojące ciepło skał.",
        powietrze: "delikatne pulsowanie przypominające powiew wiatru."
    };

    intro.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Twoje pierwsze jajo</div>
            <div class="dialog-text">
                Otrzymałeś swoje pierwsze jajo. Trzymasz je w dłoniach i czujesz ${descriptions[chosen]}
            </div>
            <div class="dialog-button" onclick="startGame()">Dalej</div>
        </div>
    `;
}

/* -----------------------------------------
   START GRY
----------------------------------------- */
function startGame() {
    document.getElementById("sidebar").style.display = "flex";
    document.getElementById("intro").style.display = "none";

    // odblokuj zakładkę praca od razu
    if (!workUnlocked) {
        unlockWork();
    }

    updateCurrencyDisplay();
    updateDragonsTab();
    updateHomeTab();
    updateMerchantTab();
    updateWorkTab();
    updateWorldTab();
}

function updateCurrencyDisplay() {
    // vertical order: gold, silver, copper
    const goldElem = document.getElementById("curr-gold");
    const silverElem = document.getElementById("curr-silver");
    const copperElem = document.getElementById("curr-copper");
    if (goldElem) goldElem.textContent = `Złoto: ${gold}`;
    if (silverElem) silverElem.textContent = `Srebro: ${silver}`;
    if (copperElem) copperElem.textContent = `Miedź: ${copper}`;
}

/* -----------------------------------------
   ZAKŁADKA SMOKI
----------------------------------------- */
/* updateDragonsTab replaced by new version */

/* -----------------------------------------
   ZAKŁADKA DOM
----------------------------------------- */
/* updateHomeTab replaced by new version */

function heatEgg1() {
    // timing limit temporarily disabled
    eggHeats++;
    lastHeat = Date.now();

    localStorage.setItem("eggHeats", eggHeats);
    localStorage.setItem("lastHeat", lastHeat);

    updateHomeTab();
    updateDragonsTab();
}

function feedDragon1() {
    if (dragonLevel >= 15) return;
    dragonFeedings++;
    dragonLevel = Math.min(15, dragonFeedings * 5);
    localStorage.setItem("dragonFeedings", dragonFeedings);
    localStorage.setItem("dragonLevel", dragonLevel);

    updateHomeTab();
    updateDragonsTab();
}

function feedDragon2() {
    if (secondDragonLevel >= 15) return;
    secondDragonFeedings++;
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);
    localStorage.setItem("secondDragonFeedings", secondDragonFeedings);
    localStorage.setItem("secondDragonLevel", secondDragonLevel);

    updateHomeTab();
    updateDragonsTab();
}

function heatEgg2() {
    // timing limit temporarily disabled
    secondEggHeats++;
    secondLastHeat = Date.now();

    localStorage.setItem("secondEggHeats", secondEggHeats);
    localStorage.setItem("secondLastHeat", secondLastHeat);

    updateHomeTab();
    updateDragonsTab();
}

function heatEgg3() {
    // timing limit temporarily disabled
    thirdEggHeats++;
    thirdLastHeat = Date.now();

    localStorage.setItem("thirdEggHeats", thirdEggHeats);
    localStorage.setItem("thirdLastHeat", thirdLastHeat);

    updateHomeTab();
    updateDragonsTab();
}

function feedDragon3() {
    if (thirdDragonLevel >= 15) return;
    thirdDragonFeedings++;
    thirdDragonLevel = Math.min(15, thirdDragonFeedings * 5);
    localStorage.setItem("thirdDragonFeedings", thirdDragonFeedings);
    localStorage.setItem("thirdDragonLevel", thirdDragonLevel);

    updateHomeTab();
    updateDragonsTab();
}

function renameDragon1() {
    const newName = document.getElementById("name1").value.trim();
    if (!newName) return;

    dragonName = newName;
    localStorage.setItem("dragonName", newName);

    updateHomeTab();
    updateDragonsTab();
}

function renameDragon2() {
    const newName = document.getElementById("name2").value.trim();
    if (!newName) return;

    secondDragonName = newName;
    localStorage.setItem("secondDragonName", newName);

    updateHomeTab();
    updateDragonsTab();
}

function renameDragon3() {
    const newName = document.getElementById("name3").value.trim();
    if (!newName) return;

    thirdDragonName = newName;
    localStorage.setItem("thirdDragonName", newName);

    updateHomeTab();
    updateDragonsTab();
}

/* -----------------------------------------
   HANDLARZ
----------------------------------------- */
const merchantQuestions = [
    {
        text: "Wchodzisz do jaskini pełnej starożytnych run. Co robisz?",
        answers: [
            { text: "Dotykam najjaśniejszej runy — ogień.", element: "ogien" },
            { text: "Szukam wilgoci — woda.", element: "woda" },
            { text: "Badam skały — ziemia.", element: "ziemia" },
            { text: "Nasłuchuję echa — powietrze.", element: "powietrze" }
        ]
    },
    {
        text: "Na pustkowiu widzisz wir energii. Co robisz?",
        answers: [
            { text: "Wchodzę w niego — ogień mnie nie zatrzyma.", element: "ogien" },
            { text: "Obserwuję jego ruch — jak woda.", element: "woda" },
            { text: "Dotykam ziemi, by poczuć drgania.", element: "ziemia" },
            { text: "Pozwalam wiatrowi mnie poprowadzić.", element: "powietrze" }
        ]
    },
    {
        text: "Spotykasz ducha starożytnego smoka. Co robisz?",
        answers: [
            { text: "Patrzę mu prosto w oczy — ogień.", element: "ogien" },
            { text: "Słucham jego szeptów — woda.", element: "woda" },
            { text: "Kłaniam się mu — ziemia.", element: "ziemia" },
            { text: "Pozwalam mu przejść przez siebie — powietrze.", element: "powietrze" }
        ]
    }
];

const merchantThirdQuestions = [
    {
        text: "W starym lesie odnajdujesz zrzucone łuski. Co robisz?",
        answers: [
            { text: "Zbieram ogniste resztki.", element: "ogien" },
            { text: "Sprawdzam, czy są mokre.", element: "woda" },
            { text: "Wącham ziemię.", element: "ziemia" },
            { text: "Nasłuchuję liści.", element: "powietrze" }
        ]
    },
    {
        text: "Na brzegu jeziora widzisz odbicie nieba. Co czujesz?",
        answers: [
            { text: "Gorąco słońca.", element: "ogien" },
            { text: "Chłód wody.", element: "woda" },
            { text: "Twardość kamieni.", element: "ziemia" },
            { text: "Lekkość wiatru.", element: "powietrze" }
        ]
    },
    {
        text: "Usłyszysz w oddali śpiew smoczych duchów. Jak reagujesz?",
        answers: [
            { text: "Odpowiadam ogniem.", element: "ogien" },
            { text: "Odpływam w wodzie.", element: "woda" },
            { text: "Przemawiam ziemią.", element: "ziemia" },
            { text: "Lotem odpowiadam.", element: "powietrze" }
        ]
    }
];

function startThirdMerchant() {
    merchantThirdStep = 0;
    merchantThirdScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };
    const box = document.getElementById("merchant-content");
    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Handlarz</div>
            <div class="dialog-text">
                „Widzę, że nieźle się zaopiekowałeś tymi maluchami, więc nie widzę problemu byś zajął się i trzecim. Proszę dokonaj wyboru...”
            </div>
            <div class="dialog-button" onclick="merchantThirdNext()">Zacznij</div>
        </div>
    `;
}

function merchantThirdNext() {
    const box = document.getElementById("merchant-content");
    if (merchantThirdStep < 3) {
        const q = merchantThirdQuestions[merchantThirdStep];
        box.innerHTML = `
            <div class="dialog-window">
                <div class="dialog-title">Pytanie ${merchantThirdStep + 1}</div>
                <div class="dialog-text">${q.text}</div>
                ${q.answers.map(a => `
                    <div class="dialog-button" onclick="merchantThirdChoose('${a.element}')">${a.text}</div>
                `).join("")}
            </div>
        `;
        return;
    }
    const chosen = Object.entries(merchantThirdScores).sort((a,b)=>b[1]-a[1])[0][0];
    const elementName = {
        ogien: "ognistego",
        woda: "wodnego",
        ziemia: "ziemnego",
        powietrze: "powietrznego"
    }[chosen];
    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Potwierdzenie</div>
            <div class="dialog-text">
                „Widzę, że twój duch jest bliski żywiołowi <b>${chosen.toUpperCase()}</b>.<br>
                Czy na pewno chcesz otrzymać <b>Jajo ${elementName} smoka</b>?”
            </div>
            <div class="dialog-button" onclick="merchantThirdConfirm('${chosen}')">TAK</div>
            <div class="dialog-button" onclick="updateMerchantTab()">NIE</div>
        </div>
    `;
}

function merchantThirdChoose(element) {
    merchantThirdScores[element]++;
    merchantThirdStep++;
    merchantThirdNext();
}

function merchantThirdConfirm(element) {
    unlockThird(element);
}

function merchantContinueGreeting() {
    merchantGreetingShown = true;
    localStorage.setItem("merchantGreetingShown", "true");
    updateMerchantTab();
}


let merchantStep = 0;
let merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

// trzecia seria pytań
let merchantThirdStep = 0;
let merchantThirdScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

function updateMerchantTab() {
    const box = document.getElementById("merchant-content");

    // synchronise state in case storage was modified elsewhere
    thirdDragonUnlocked = localStorage.getItem("thirdDragonUnlocked") === "true";
    merchantAfterThirdVisit = localStorage.getItem("merchantAfterThirdVisit") === "true";
    merchantGreetingShown = localStorage.getItem("merchantGreetingShown") === "true";

    // ensure levels up-to-date
    dragonLevel = Math.min(15, dragonFeedings * 5);
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);

    // Show atmospheric greeting on first visit
    if (secondDragonUnlocked === false && !merchantGreetingShown) {
        box.innerHTML = `
            <div class="dialog-window">
                <div class="dialog-title">Handlarz</div>
                <div class="dialog-text">
                    Docierasz do dzielnicy kupieckiej. Gwar targu powoli cichnie, gdy skręcasz w stronę wyżej położonego placu — tam, gdzie zwykli handlarze nie podnoszą głosu bez powodu.<br><br>
                    Pierwsze, co rzuca Ci się w oczy, to budynek ciemny, niemal grafitowy. Jego kamienne ściany nie są gładkie — żyłkowania przecinające fasadę przypominają smocze łuski, jakby sama góra została obciosana i ustawiona pośród miasta.<br><br>
                    Nad wejściem widnieje płaskorzeźba przedstawiająca Astor — Smoczą Matkę — z rozpostartymi skrzydłami, pod którymi spoczywają trzy jaja. Poniżej wyryto słowa:<br><br>
                    <b>„Troje — dar. Czwarte — przekleństwo."</b><br><br>
                    Gdy popychasz drzwi, wnętrze wita Cię ciepłem i ciszą. Powietrze pachnie żywicą i popiołem. Światło jest przytłumione, bursztynowe.<br><br>
                    Z głębi pomieszczenia wychodzi mężczyzna w długiej szacie. Na jego kołnierzu połyskują trzy złote łuski.<br><br>
                    — Smok nie jest przedmiotem — mówi spokojnie. — On wybiera. My tylko pośredniczymy.<br><br>
                    Czujesz pod stopami subtelne drżenie. Gdzieś pod budynkiem tli się ogień inkubatorów.<br><br>
                    Masz wrażenie, że to miejsce nie sprzedaje jaj. Ono sprzedaje przeznaczenie.
                </div>
                <div class="dialog-button" onclick="merchantContinueGreeting()">Dalej</div>
            </div>
        `;
        return;
    }

    if (thirdDragonUnlocked) {
        // specjalny tekst po zdobyciu trzeciego
        // jeśli chcesz wyświetlać go tylko raz, możesz użyć merchantAfterThirdVisit
        box.innerHTML = `
            <div class="dialog-window">
                <div class="dialog-title">Handlarz</div>
                <div class="dialog-text">
                    „Rozumiem twoją chęć zaopiekowania się wszystkimi smokami, jednak dekret obowiązuje."
                    Handlarz pokazuje Ci na kartę pergaminu, która została wbita pod jego biurkiem.
                    Widzisz na niej cztery smocze jaja a w nich człowieka. Pokrywający je czerwony X wszystko tłumaczy.
                    Prawo jest prawem, jeżeli ktoś by zobaczył Cię z większą ilością smoków czy jaj, to szybko witalibyśmy się ze śmiercią.
                </div>
            </div>
        `;
        merchantAfterThirdVisit = true;
        localStorage.setItem("merchantAfterThirdVisit","true");
        return;
    }

    if (secondDragonUnlocked) {
        // po kupnie drugiego jaja mówimy już inaczej przy kolejnych odwiedzinach
        if (!merchantAfterSecondVisit) {
            box.innerHTML = `
                <div class="dialog-window">
                    <div class="dialog-title">Handlarz</div>
                    <div class="dialog-text">Masz już drugiego smoka.</div>
                </div>
            `;
            merchantAfterSecondVisit = true;
            localStorage.setItem("merchantAfterSecondVisit", "true");
            return;
        }

        // nowa wiadomość, proponująca kolejne jajo
        let readyForThird = dragonLevel >= 15 && secondDragonLevel >= 15 && !thirdDragonUnlocked;
        
        if (readyForThird) {
            // Komunikat gdy gracz ma dwa smoki na poziomie 15
            box.innerHTML = `
                <div class="dialog-window">
                    <div class="dialog-title">Handlarz</div>
                    <div class="dialog-text">
                        „Widzę, że przyszedłeś ze swoimi smokami, a są już dorosłe. Mądra decyzja! Możesz teraz otrzymać trzeciego.”
                    </div>
                    <div class="dialog-button" onclick="startThirdMerchant()">Chcę trzecie jajo</div>
                </div>
            `;
        } else {
            // Komunikat gdy gracz ma drugiego smoka, ale nie na poziomie 15
            box.innerHTML = `
                <div class="dialog-window">
                    <div class="dialog-title">Handlarz</div>
                    <div class="dialog-text">
                        „Och witam, jak się sprawy mają? Przyszedłeś po kolejne jajo? Pokaż mi że jesteś odpowiedzialnym Hodowcą i przyjdź razem z dwoma swoimi smokami, które lekko podrosły. Wtedy pokażesz że jesteś gotów na trzeciego.”
                    </div>
                </div>
            `;
        }
        return;
    }

    // jezeli wracamy z NIE - resetuj zmienne
    merchantStep = 0;
    merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Handlarz</div>
            <div class="dialog-text">
                „Otocz dłonią tę kulę. Powiedz mi, co w niej widzisz?”
            </div>
            <div class="dialog-button" onclick="merchantNext()">Dalej</div>
        </div>
    `;
}

function merchantNext() {
    const box = document.getElementById("merchant-content");

    if (merchantStep < 3) {
        const q = merchantQuestions[merchantStep];

        box.innerHTML = `
            <div class="dialog-window">
                <div class="dialog-title">Pytanie ${merchantStep + 1}</div>
                <div class="dialog-text">${q.text}</div>
                ${q.answers.map(a => `
                    <div class="dialog-button" onclick="merchantChoose('${a.element}')">${a.text}</div>
                `).join("")}
            </div>
        `;
        return;
    }

    const chosen = Object.entries(merchantScores).sort((a,b)=>b[1]-a[1])[0][0];
    const elementName = {
        ogien: "ognistego",
        woda: "wodnego",
        ziemia: "ziemnego",
        powietrze: "powietrznego"
    }[chosen];

    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Potwierdzenie</div>
            <div class="dialog-text">
                „Widzę, że twój duch jest bliski żywiołowi <b>${chosen.toUpperCase()}</b>.<br>
                Czy na pewno chcesz otrzymać <b>Jajo ${elementName} smoka</b>?”
            </div>
            <div class="dialog-button" onclick="merchantConfirm('${chosen}')">TAK</div>
            <div class="dialog-button" onclick="updateMerchantTab()">NIE</div>
        </div>
    `;
}

function merchantChoose(element) {
    merchantScores[element]++;
    merchantStep++;
    merchantNext();
}

function merchantConfirm(element) {
    secondDragonUnlocked = true;
    secondDragonElement = element;
    secondEggHeats = 0;
    secondLastHeat = 0;

    localStorage.setItem("secondDragonUnlocked", "true");
    localStorage.setItem("secondDragonElement", element);
    localStorage.setItem("secondEggHeats", "0");
    localStorage.setItem("secondLastHeat", "0");

    // po pierwszym pożegnaniu ustawiamy flagę, by przy następnej wizycie pokazać nową wiadomość
    merchantAfterSecondVisit = true;
    localStorage.setItem("merchantAfterSecondVisit", "true");

    const box = document.getElementById("merchant-content");
    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Handlarz</div>
            <div class="dialog-text">
                „Dobrze. Oto twoje jajo. Dbaj o nie, a wykluje się potężny smok.”
            </div>
        </div>
    `;

    updateDragonsTab();
    updateHomeTab();
}

/* -----------------------------------------
   ODPOWIEDNICY POZIOMÓW I ODMIENNE WIADOMOŚCI HANDLARZA
----------------------------------------- */

function unlockThird(element) {
    thirdDragonUnlocked = true;
    thirdDragonElement = element;
    thirdEggHeats = 0;
    thirdLastHeat = 0;

    localStorage.setItem("thirdDragonUnlocked", "true");
    localStorage.setItem("thirdDragonElement", element);
    localStorage.setItem("thirdEggHeats", "0");
    localStorage.setItem("thirdLastHeat", "0");

    const box = document.getElementById("merchant-content");
    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Handlarz</div>
            <div class="dialog-text">
                „Widzę, że spełniłeś wymagania. Trzecie jajo jest teraz twoje – ale o tym później...<br>
                Gratulacje wyboru! Na pewno Astor jest przychylny Twojej decyzji. Bądźcie zdrowi!”
            </div>
        </div>
    `;
    updateDragonsTab();
    updateHomeTab();
}

/* -----------------------------------------
   ZMIANA ZAKŁADEK
----------------------------------------- */
function openTab(name) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.getElementById(name).style.display = "block";
    
    // zawsze odświeżamy widok właściwy dla zakładki
    if (name === "world") { 
        updateWorldTab();
    }
    if (name === "dragons") {
        updateDragonsTab();
    }
    if (name === "home") {
        updateHomeTab();
    }
    if (name === "work") {
        updateWorkTab();
    }
    if (name === "inventory") {
        updateInventoryTab();
    }
    if (name === "merchant") {
        updateMerchantTab();
    }
}

/* -----------------------------------------
   RESET GRY
----------------------------------------- */
function resetGame() {
    localStorage.clear();
    location.reload();
}

/* -----------------------------------------
   START
----------------------------------------- */
showQuestion();

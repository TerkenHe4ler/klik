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
        { id: 'ogniste_uderzenie', name: 'Ogniste Uderzenie', desc: 'Potężny atak ogniem, zadający obrażenia jednemu celowi.', manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'sciana_ognia',      name: 'Ściana Ognia',      desc: 'Smok tworzy barierę z płomieni, niszcząc wszystko wokół.',          manaCost: 8,  dmgMult: [2.0, 3.5] },
        { id: 'oddech_smoka',      name: 'Smocze Żar',        desc: 'Klasyczny oddech smoka — szeroki i niszczycielski.',                 manaCost: 10, dmgMult: [3.0, 5.0] }
    ],
    woda: [
        { id: 'wodne_uderzenie',     name: 'Wodne Uderzenie',     desc: 'Strumień wody o zabójczej sile trafia w cel.',      manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'lodowy_podmuch',      name: 'Lodowy Podmuch',      desc: 'Zamarza teren wokół wroga, spowalniając i raniąc.', manaCost: 8,  dmgMult: [2.0, 3.5] },
        { id: 'uzdrawiajacy_strumien', name: 'Uzdrawiający Strumień', desc: 'Smok leczy siebie strumieniem magicznej wody.', manaCost: 10, heal: [20, 40], isHeal: true }
    ],
    ziemia: [
        { id: 'kamienne_uderzenie', name: 'Kamienne Uderzenie', desc: 'Głaz wali z ogromną siłą w przeciwnika.',                     manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'trzesienie_ziemi',   name: 'Trzęsienie Ziemi',   desc: 'Smok uderza w ziemię, fala wstrząsów dosięga każdego.',       manaCost: 8,  dmgMult: [2.0, 3.5] },
        { id: 'kamienna_skora',     name: 'Kamienna Skóra',     desc: 'Ciało smoka pokrywa się skałą — leczenie i pancerz.',         manaCost: 10, heal: [15, 30], isHeal: true }
    ],
    powietrze: [
        { id: 'powietrzne_uderzenie', name: 'Powietrzne Uderzenie', desc: 'Ostra podmuch powietrza tnie jak ostrze.',              manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'cyklon',              name: 'Cyklon',               desc: 'Smok wznosi spiralę wichru, odrzucając i raniąc wrogów.', manaCost: 8,  dmgMult: [2.0, 4.0] },
        { id: 'taniec_wiatru',       name: 'Taniec Wiatru',        desc: 'Smok staje się nieuchwytny — unik i leczący podmuch.',    manaCost: 10, heal: [10, 25], dodge: true, isHeal: true }
    ],
    swiatlo: [
        { id: 'promien_swiatla',  name: 'Promień Światła',   desc: 'Oślepiający snop czystej energii trafia w cel, paląc ciemność.',          manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'blazk_sloneczny', name: 'Blask Słoneczny',    desc: 'Smok eksploduje falą jasności — razi wszystkich wokół.',                  manaCost: 8,  dmgMult: [2.0, 3.5] },
        { id: 'boskie_swiatlenie', name: 'Boskie Oświetlenie', desc: 'Smok otula się świętym blaskiem — leczy i odpiera kolejny cios.',         manaCost: 10, heal: [20, 40], shield: true, isHeal: true }
    ],
    cien: [
        { id: 'uderzenie_cienia', name: 'Uderzenie Cienia',   desc: 'Smok uderza z mroku — cios trudny do przewidzenia, celuje w słabe punkty.', manaCost: 5,  dmgMult: [1.8, 2.8] },
        { id: 'mroczna_pustka',   name: 'Mroczna Pustka',    desc: 'Cień pochłania wroga, drenaż energii i obrażenia z dystansu.',             manaCost: 8,  dmgMult: [2.0, 3.5], drain: true },
        { id: 'krok_nicosci',     name: 'Krok w Nicość',     desc: 'Smok znika na chwilę w cieniu — unika ataku i kontratakuje znienacka.',   manaCost: 10, dmgMult: [2.5, 4.5], dodge: true }
    ],
    lod: [
        { id: 'lodowe_uderzenie',  name: 'Lodowe Uderzenie',   desc: 'Kryształ lodu wystrzelony z siłą rozbija cel na kawałki.',                manaCost: 5,  dmgMult: [1.5, 2.5] },
        { id: 'zamroczenie',       name: 'Zamroczenie',         desc: 'Smok owija wroga lodową mgłą — spowalnia i zadaje obrażenia w czasie.',   manaCost: 8,  dmgMult: [1.8, 3.0], drain: true },
        { id: 'lodowy_pancerz',    name: 'Lodowy Pancerz',      desc: 'Ciało smoka pokrywa lód — leczy i odbija następny cios.',                 manaCost: 10, heal: [15, 30], shield: true, isHeal: true }
    ],
    magma: [
        { id: 'magmowy_wybuch',    name: 'Magmowy Wybuch',      desc: 'Strumień roztopionej skały uderza w cel z druzgocącą siłą.',             manaCost: 5,  dmgMult: [1.8, 2.8] },
        { id: 'erupcja',           name: 'Erupcja',              desc: 'Smok uderza w ziemię — fontanna lawy razi wszystkich wokół.',            manaCost: 8,  dmgMult: [2.5, 4.0] },
        { id: 'ognista_skora',     name: 'Ognista Skóra',        desc: 'Skóra smoka twardnieje jak lawa — leczy i parzy każdego kto go uderzy.', manaCost: 10, heal: [20, 35], isHeal: true }
    ],
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


// Moon Gate expedition loot table
const MOON_GATE_LOOT = [
    { key: 'Księżycowy Kamień',              weight: 40, desc: 'Kamień nasycony energią księżycowej pełni.' },
    { key: 'Srebrny Pył Zza Bramy',          weight: 25, desc: 'Świecący pył zebrany po drugiej stronie.' },
    { key: 'Strzęp Zasłony Między Światami', weight: 20, desc: 'Materiał istniejący tylko przy bramie.' },
    { key: 'Eter Księżycowy',                weight: 12, desc: 'Skupiona magia miejsca — niezwykle rzadka.' },
    { key: 'Fragment Ostrza Śmierci',        weight: 3,  desc: '⚠️ Przerażający fragment zakazanego artefaktu. Drga w twojej dłoni.' },
];

function rollMoonGateLoot() {
    if (Math.random() > 0.75) return null; // 25% no loot
    const totalWeight = MOON_GATE_LOOT.reduce((s, i) => s + i.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of MOON_GATE_LOOT) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }
    return MOON_GATE_LOOT[0];
}

const DRAGON_MISSIONS = [
    { id: 'patrol', name: 'Patrol okolic wioski', duration: 5000, fatigue: 15, reward: { copper: 30 }, desc: 'Krótki lot patrolowy. Smok sprawdza czy okolice są bezpieczne.' },
    { id: 'eskort_karawany', name: 'Eskorta karawany z powietrza', duration: 10000, fatigue: 25, reward: { silver: 1 }, desc: 'Smok leci nad karawaną kupców, odpędzając zagrożenia.' },
    { id: 'polow_ryb', name: 'Połów ryb na jeziorze', duration: 7000, fatigue: 10, reward: { copper: 50 }, desc: 'Smok nurkuje w Jeziorze Snu w poszukiwaniu ryb.' },
    { id: 'wyprawa_las', name: 'Zwiad nad Lasem Mgieł', duration: 12000, fatigue: 30, reward: { silver: 1, copper: 50 }, desc: 'Smok penetruje Las Mgieł z powietrza, szukając informacji.' },
    { id: 'wyprawa_gory', name: 'Lot przez Góry Sarak', duration: 18000, fatigue: 45, reward: { silver: 3 }, desc: 'Długa wyprawa przez niebezpieczne górskie szczyty.' },
    { id: 'misja_tajna', name: 'Tajna misja dla Posterunku', duration: 22000, fatigue: 60, reward: { silver: 5 }, desc: 'Kapitan Posterunku prosi o dyskretną pomoc. Szczegóły niedostępne.' },
    { id: 'wyprawa_ksiezycowa', name: 'Wyprawa do Księżycowej Bramy', duration: 25000, fatigue: 55, reward: { silver: 3 }, desc: '🌕 Tajemnicza wyprawa za próg Księżycowej Bramy. Tylko w pełni księżyca. Możliwe unikalne znaleziska.' }
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

    const speedBonus = getSpeedBonus(dragonNum);
    const adjustedDuration = Math.max(1000, Math.round(mission.duration * (1 - speedBonus)));
    const missionData = {
        ...mission,
        endTime: Date.now() + adjustedDuration,
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
    { name: 'Dziki Szczur Podziemi', sila: 4, wytrzymalosc: 3, zrecznosc: 6,  reward: { silver: 1 },  rewardDesc: '1 srebro',  difficulty: '🟢 Łatwy',  desc: 'Wielki gryzień o ostrych kłach. Szybki, ale kruchy.' },
    { name: 'Leśny Padalec',         sila: 5, wytrzymalosc: 5, zrecznosc: 5,  reward: { silver: 1 },  rewardDesc: '1 srebro',  difficulty: '🟢 Łatwy',  desc: 'Jadowity wąż z lasu. Przeciętne statystyki, groźny jad.' },
    { name: 'Smoczek z Gór',         sila: 7, wytrzymalosc: 6, zrecznosc: 4,  reward: { silver: 2 },  rewardDesc: '2 srebro',  difficulty: '🟡 Średni', desc: 'Młody smok górski. Powolny, ale bardzo wytrzymały.' },
    { name: 'Starszy Gryf',          sila: 8, wytrzymalosc: 7, zrecznosc: 7,  reward: { silver: 3 },  rewardDesc: '3 srebro',  difficulty: '🟡 Średni', desc: 'Skrzydlate stworzenie z pazurami jak szable. Zwinne i silne.' },
    { name: 'Chimera Miejska',       sila: 10, wytrzymalosc: 9, zrecznosc: 8, reward: { silver: 5 },  rewardDesc: '5 srebra', difficulty: '🔴 Trudny',  desc: 'Potwór trzech głów. Mistrz areny. Walczy na wielu frontach.' },
    { name: 'Smok Ognia Zapomnianego', sila: 13, wytrzymalosc: 12, zrecznosc: 10, reward: { gold: 1 }, rewardDesc: '1 złota', difficulty: '🔴 Legenda', desc: 'Pradawny smok ognisty — pół legenda, pół koszmар. Mało kto wraca.' },
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

/* ==========================================================
   DOM — OPISY ROTOWANE CO 10 MINUT
========================================================== */
const HOME_DESCS_0 = []; // 0 smoków
const HOME_DESCS_1 = { ogien: [], woda: [], ziemia: [], powietrze: [] };
const HOME_DESCS_2 = {};
const HOME_DESCS_3 = [];

function getRotatingDesc(arr) {
    if (!arr || arr.length === 0) return '';
    const idx = Math.floor(Date.now() / (10 * 60 * 1000)) % arr.length;
    return arr[idx];
}

function getDragonHomeDesc() {
    const dragons = [];
    if (eggHeats >= 3) dragons.push({ name: dragonName, element: chosenDragon, num: 1 });
    if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ name: secondDragonName, element: secondDragonElement, num: 2 });
    if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ name: thirdDragonName, element: thirdDragonElement, num: 3 });

    // ── 0 smoków ─────────────────────────────────────────
    if (dragons.length === 0) {
        const opts = [
            'Dom jest cichy. Na stoliku leży jajko — ciepłe, pulsujące życiem. Czekasz.',
            'W izbie słychać tylko trzask ognia w kominku. Jajko leży w wyściełanym koszu, ledwo widoczne pod kocykiem z owczej wełny.',
            'Stawiasz jajko bliżej ciepła. Zdaje się, że drgnęło — albo to tylko gra światła.',
            'Dom pachnie dymem i starym drewnem. Jajko jest jedynym towarzyszem tej ciszy.',
            'Siedzisz przy kominku, jajko w dłoniach. Coś w nim tętni rytmicznie — jakby serce.',
        ];
        return opts[Math.floor(Date.now() / (10*60*1000)) % opts.length];
    }

    // ── 1 smok ───────────────────────────────────────────
    if (dragons.length === 1) {
        const d = dragons[0];
        const descs = {
            ogien: [
                `${d.name} leży zwinięty przy kominku i śpi. Od czasu do czasu z nozdrzy wydobywa się mały język ognia — pewnie śni o walce.`,
                `${d.name} siedzi pośrodku pokoju i wpatruje się w płomienie jak zahipnotyzowany. Ogień w kominku płonie jaśniej niż zwykle.`,
                `Wchodząc zastajesz ${d.name} śpiącego na dywanie. Dywan ma nowy osmolony ślad. Smok chrapie cicho.`,
                `${d.name} próbuje podpalić świeczkę oddechem. Z piątej próby wychodzi za duże — połowa stołu teraz dymi. Patrzy na ciebie bez śladu winy.`,
                `${d.name} przyniósł sobie kawałek drewna i żuje go z zadowoleniem przy kominku. Drewno się tli.`,
            ],
            woda: [
                `${d.name} siedzi przy misce z wodą i wpatruje się w nią jak zahipnotyzowany. Woda w misce kręci się sama, powoli.`,
                `${d.name} śpi zwinięty obok wiadra z wodą — łapę zanurzoną do środka. Woda jest lodowata.`,
                `Zastajesz ${d.name} siedzącego przy oknie i patrzącego na deszcz. Wydaje się spokojniejszy niż zwykle.`,
                `${d.name} wylał miskę z wodą i leży w kałuży z wyraźnym zadowoleniem. Podłoga mokra. Smok szczęśliwy.`,
                `${d.name} robi coś co wygląda jak "pływanie" po podłodze. Nie pyta, po prostu daje mu przestrzeń.`,
            ],
            ziemia: [
                `${d.name} leży dokładnie tam, gdzie go zostawiłeś. Nie ruszył się ani o centymetr. Jak posąg — tylko ciepły.`,
                `${d.name} kopie mały dołek w kącie pokoju. Ziemia z doniczki rozsypana po podłodze. Smok wygląda na zadowolonego.`,
                `Zastajesz ${d.name} śpiącego na stosie własnych łusek — część zrzucił pod ścianą. Chrapie rytmicznie jak głaz toczący się ze wzgórza.`,
                `${d.name} siedzi przy oknie i patrzy na ulicę. Kiedy wchodzisz, odwraca głowę i ziewa — pokazując zęby. Jego sposób na "cześć".`,
                `${d.name} ułożył starannie kilka kamieni w rząd przy ścianie. Po co? Nie wiadomo. Nie ruszaj.`,
            ],
            powietrze: [
                `${d.name} siedzi na najwyższej półce i stamtąd patrzy na pokój. Jak tam wlazł — nie masz pojęcia.`,
                `${d.name} krąży pod sufitem w kółko. Na twój widok nurkuje i ląduje centymetry od twoich stóp. Uśmiecha się.`,
                `Gdy wchodzisz, ${d.name} znika za szafą. Po chwili wraca z kawałkiem pergaminu w pysku — pewnie chciał coś powiedzieć.`,
                `${d.name} stoi przy drzwiach jakby czekał. Kiedy je otwierasz, wybiega na zewnątrz i po chwili wraca. Spacer.`,
                `Powietrze w pokoju jest chłodniejsze niż zwykle. ${d.name} śpi w rogu, skrzydła lekko rozłożone — kto wie, co mu się śni.`,
            ],
            swiatlo: [
                `${d.name} siedzi w najjaśniejszym miejscu pokoju, twarz skierowana ku oknu. Kiedy promień słońca pada na jego łuski, cały pokój na chwilę rozbłyskuje złotem.`,
                `Wchodząc zastajesz ${d.name} śpiącego w kałuży światła na podłodze. Mruczy cicho — przypomina to bardziej brzęczenie pszczoły niż chrapanie.`,
                `${d.name} siedzi przy świecy i obserwuje płomień. Kiedy go dotyka łapą, świeca nie gaśnie — płonie jaśniej.`,
                `Pokój pachnie latem i żywicą. ${d.name} przynosi kawałek połyskującego kamienia i kładzie ci go pod stopami. Prezent.`,
                `${d.name} nie śpi — siedzi nieruchomo pośrodku pokoju i wygląda jakby słuchał czegoś czego ty nie słyszysz. Wokół niego powietrze lekko drży.`,
            ],
            cien: [
                `Wchodząc do domu nie widzisz ${d.name}. Po chwili coś poruszyło się za szafą — tam siedzi. Obserwuje cię od wejścia.`,
                `${d.name} śpi zwinięty w najciemniejszym kącie pokoju. Prawie niewidoczny. Otwiera jedno oko gdy wchodzisz — potem zamyka.`,
                `Świeca na stole zgasła. ${d.name} siedzi obok i patrzy na ciebie z czymś co wygląda jak zadowolenie.`,
                `${d.name} krąży cicho po pokoju — nie słyszysz jego kroków. Dopiero gdy staje tuż za tobą, zdajesz sobie sprawę, że tu jest.`,
                `Zastajesz ${d.name} siedzącego w oknie, odwróconego do ciemnej ulicy. Kiedy wchodzisz, obraca się powoli. W jego oczach odbija się coś czego nie ma w pokoju.`,
            ],
            lod: [
                `${d.name} siedzi nieruchomo przy oknie, wpatrując się w zewnętrzny krajobraz. Na szybie od jego oddechu osiadł szron w piękne wzory.`,
                `Dom jest wyraźnie chłodniejszy niż na zewnątrz. ${d.name} śpi pod oknem, a wokół niego podłoga lśni cienką warstwą szronu.`,
                `Zastajesz ${d.name} oblizującego sopel lodu, który sam stworzył z pary wodnej w powietrzu. Patrzy na ciebie z czymś w rodzaju dumy.`,
                `${d.name} leży rozciągnięty na środku pokoju — chłodny w dotyku jak kamień. Kiedy go głaszczesz, mruczy, a z nozdrzy wydobywa się lekka mgielka.`,
                `Miska z wodą zamarzła na kamień. ${d.name} siedzi obok i wpatruje się w nią jak w dzieło sztuki. Może tak właśnie to traktuje.`,
            ],
            magma: [
                `Dom jest gorący jak piekarnia. ${d.name} leży przy kominku i wyraźnie dogrzewa go oddechem. Kamień pod jego łapami jest ciemnoczerwony.`,
                `Zastajesz ${d.name} śpiącego na żelaznej blasze przy palenisku — jedyne miejsce w domu, które wytrzymuje jego temperaturę.`,
                `${d.name} siedzi na środku pokoju z oczami żarzącymi się jak węgle. Kiedy wchodzisz, wybucha krótkimi iskrami — to jego powitanie.`,
                `Dywan przy kominku ma kilka nowych przypalonych śladów. ${d.name} siedzi obok z miną kogoś, kto absolutnie nic nie wie o żadnych dywanikach.`,
                `${d.name} przynosi kawałek skały i liże ją metodycznie. Skała topi się w jego pysku jak lód w słońcu. Smok wygląda na usatysfakcjonowanego.`,
            ],
        };
        const arr = descs[d.element] || [`${d.name} czeka spokojnie.`];
        return arr[Math.floor(Date.now() / (10*60*1000)) % arr.length];
    }

    // ── 2 smoki ──────────────────────────────────────────
    if (dragons.length === 2) {
        const [d1, d2] = dragons;
        const pair = [d1.element, d2.element].sort().join('_');
        const pairDescs = {
            ogien_woda: [
                `${d1.name} i ${d2.name} patrzą na siebie z bezpiecznej odległości. Na dywanie mokra plama i spalony skraj. Walka o terytorium.`,
                `Wchodzisz w chwili gdy ${d1.name} i ${d2.name} mierzą się wzrokiem. Krzesło między nimi jest przesunięte. Nikt się nie ruszył.`,
                `Para smoków po przeciwnych stronach pokoju. Para z nozdrzy jednego. Mokre ślady po podłodze od drugiego. Neutralna strefa naruszana co jakiś czas.`,
                `${d1.name} i ${d2.name} śpią osobno — każdy w swoim kącie. Na środku pokoju stoi przewrócona miska. Żadne nie chce jej podnieść.`,
            ],
            ogien_ziemia: [
                `${d1.name} siedzi przy kominku, ${d2.name} w kącie — każdy w swoim miejscu. Atmosfera spokojna. Może zbyt spokojna.`,
                `${d2.name} śpi przy ścianie. ${d1.name} tli się przy kominku. Żadne nie zwraca uwagi na drugie.`,
                `${d1.name} próbuje zmusić ${d2.name} do zabawy. ${d2.name} ignoruje go całkowicie. ${d1.name} wraca do kominka pokonany.`,
                `Obydwa smoki siedzą przy kominku — jeden grzeje się w ogniu, drugi w cieple. Rzadka chwila zgody.`,
            ],
            ogien_powietrze: [
                `${d1.name} śledzi każdy ruch ${d2.name}, który kręci się po całym pokoju jak wicher. Wyraźnie go to drażni.`,
                `${d2.name} kręci się po suficie. ${d1.name} śledzi go wzrokiem aż zaczyna kręcić mu się głowa. Kiwa głową z rezygnacją.`,
                `${d1.name} śpi. ${d2.name} lata cicho wokół — sprawdza czy przypadkiem to nie chwila na złośliwość. Decyduje że tak.`,
                `Kilka rzeczy strąconych z półki. ${d2.name} siedzi niewinnie przy oknie. ${d1.name} dymi z niezadowolenia.`,
            ],
            woda_ziemia: [
                `${d1.name} i ${d2.name} leżą w milczeniu. Raz na jakiś czas jedno zerknie na drugie. Cisza namacalna.`,
                `${d1.name} siedzi przy misce. ${d2.name} drzemie przy ścianie. Spokój jak w starym klasztorze.`,
                `Obydwa smoki śpią — jeden obok drugiego, ramię w ramię. Rzadki widok.`,
                `${d2.name} wcisnął się między ${d1.name} a ścianę. Wyglądają jak dwa kamienie w rzece.`,
            ],
            cien_swiatlo: [
                `${d1.name} i ${d2.name} siedzą po przeciwnych stronach pokoju. Jedno w blasku okna, drugie w najciemniejszym kącie. Obserwują się nawzajem z uwagą, której nie widać na pierwszy rzut oka.`,
                `${d1.name} krąży w cieniu. ${d2.name} siedzi w świetle. Między nimi granica — żadne jej nie przekracza. Ale oboje wiedzą, że ona jest.`,
                `Pokój podzielony na dwie strefy — jaśniejszą i ciemniejszą. Każdy smok trzyma swoją. Napięcie jest spokojne, niemal filozoficzne.`,
            ],
        };
        const arr = pairDescs[pair];
        if (arr) return arr[Math.floor(Date.now() / (10*60*1000)) % arr.length];
        const generic = [
            `${d1.name} i ${d2.name} są w domu. Wygląda na to że dzień minął spokojnie.`,
            `${d1.name} drzemie, ${d2.name} siedzi przy oknie. Cisza.`,
            `Obydwa smoki wyglądają na zmęczone. Może to czas na odpoczynek.`,
        ];
        return generic[Math.floor(Date.now() / (10*60*1000)) % generic.length];
    }

    // ── 3 smoki ──────────────────────────────────────────
    const elements = dragons.map(d => d.element);

    if (elements.includes('ogien') && elements.includes('woda')) {
        const fireD = dragons.find(d => d.element === 'ogien');
        const waterD = dragons.find(d => d.element === 'woda');
        const thirdD = dragons.find(d => d.element !== 'ogien' && d.element !== 'woda');

        let thirdDesc = '';
        if (thirdD) {
            const map = {
                ziemia: `${thirdD.name} czeka dokładnie w tym miejscu co był gdy wychodziłeś — ignoruje całe zamieszanie jak kamień.`,
                powietrze: `${thirdD.name} gdzieś zniknął. Po chwili widzisz go na belce pod sufitem, skąd spokojnie obserwuje konflikt.`
            };
            thirdDesc = map[thirdD.element] || `${thirdD.name} ignoruje całą sytuację z filozoficznym spokojem.`;
        } else {
            thirdDesc = `Trzeci smok również miesza się do konfliktu — napięcie w powietrzu jest wyczuwalne.`;
        }

        const conflictDescs = [
            `Wchodząc widzisz jak ${fireD.name} i ${waterD.name} patrzą groźnie na siebie. Przypalone krzesło i mokre ślady — walka o terytorium. ${thirdDesc}`,
            `${fireD.name} i ${waterD.name} okrążają się nawzajem po pokoju. Dywan ma ślady wilgoci i opalenia. ${thirdDesc}`,
            `Skraj zasłony spalony — nowy. Przy oknie mokra plama. ${fireD.name} i ${waterD.name} siedzą tyłem do siebie. ${thirdDesc}`,
        ];
        return conflictDescs[Math.floor(Date.now() / (10*60*1000)) % conflictDescs.length];
    }

    const peaceful3 = [
        `Wszystkie trzy smoki są w domu. Panuje względny spokój — jak na trójkę smoków przystało.`,
        `Trzy smoki śpią w swoich miejscach. Dom pachnie dymem, wilgocią i czymś co można nazwać "smoczym pokojem".`,
        `${dragons[0].name}, ${dragons[1].name} i ${dragons[2].name} siedzą razem przy oknie i patrzą na miasto. Nikt się nie kłóci — na razie.`,
        `Coś przewrócone, coś przesunięte — ale wszystkie trzy smoki żyją i wyglądają zadowolenie. Tyle wystarczy.`,
    ];
    return peaceful3[Math.floor(Date.now() / (10*60*1000)) % peaceful3.length];
}


/* ======= sec2_modified_functions.js ======= */
/* =========================================
   ZAKŁADKA DOM (NOWA WERSJA)
========================================= */


const _detailsState = {};
function saveDetailsState(type, num, isOpen) {
    _detailsState[type + num] = isOpen ? 'open' : 'closed';
}
function getDetailsState(type, num) {
    return _detailsState[type + num] || (type === 'feed' ? 'open' : 'closed');
}

function updateHomeTab() {
    const home = document.getElementById('home-content');
    if (!home) return;

    // Sync egg heat globals from localStorage before rendering
    eggHeats        = Number(localStorage.getItem('eggHeats'))        || 0;
    secondEggHeats  = Number(localStorage.getItem('secondEggHeats'))  || 0;
    thirdEggHeats   = Number(localStorage.getItem('thirdEggHeats'))   || 0;
    secondDragonUnlocked = localStorage.getItem('secondDragonUnlocked') === 'true';
    thirdDragonUnlocked  = localStorage.getItem('thirdDragonUnlocked')  === 'true';
    thirdDragonElement   = localStorage.getItem('thirdDragonElement') || thirdDragonElement;
    secondDragonElement  = localStorage.getItem('secondDragonElement') || secondDragonElement;

    dragonLevel = dragonFeedings * 5;
    secondDragonLevel = secondDragonFeedings * 5;
    thirdDragonLevel = thirdDragonFeedings * 5;

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
    // Always read fresh heats from localStorage — prevents stale global variable bugs
    const freshHeats = num === 1
        ? (Number(localStorage.getItem('eggHeats')) || 0)
        : num === 2
            ? (Number(localStorage.getItem('secondEggHeats')) || 0)
            : (Number(localStorage.getItem('thirdEggHeats')) || 0);

    // EARLY RETURN: unhatched egg — no expensive calls, no side effects
    if (freshHeats < 3) {
        const elementLabel = element ? element.toUpperCase() : '?';
        const heatMsg = freshHeats === 0
            ? 'Jajo jest zimne. Potrzebuje troski.'
            : freshHeats === 1
                ? 'Jajo jest ciepłe. Czujesz w nim życie.'
                : 'Jajo drga. Coś się porusza w środku!';
        return `
            <div class="dragon-slot">
                <div style="font-weight:bold; color:#c0cce0; margin-bottom:4px;">${name} — ${elementLabel}</div>
                <div style="color:#8090aa; font-size:13px; margin-bottom:8px;">
                    🥚 Ogrzania: <b style="color:#ffcc44;">${freshHeats}/3</b> — ${heatMsg}
                </div>
                <div class="dialog-button" onclick="heatEgg${num}()">🔥 Zadbaj o jajo</div>
            </div>
        `;
    }

    const stats = loadDragonStats(num);
    const vitals = initDragonVitalsIfNeeded(num, stats);
    const maxHP = getDragonMaxHP(stats);
    const maxMana = getDragonMaxMana(stats);
    const mission = loadDragonMission(num);
    const fightsDone = loadArenaFights(num);

    // Check if mission completed
    if (mission && Date.now() >= mission.endTime) {
        completeDragonMission(num);
        return renderDragonHomeSlot(num, name, element, freshHeats, level, feedings);
    }

    const isOnMission = !!mission;
    let missionHtml = '';
    if (isOnMission) {
        const remaining = Math.max(0, mission.endTime - Date.now());
        missionHtml = `
            <div style="margin:8px 0; padding:8px; background:rgba(40,30,10,0.6); border-left:3px solid #cc9900; border-radius:4px;">
                🦅 Na misji: <b>${mission.name}</b><br>
                <span style="color:#aaa; font-size:13px;">Pozostały czas: <b style="color:#ffcc44;">${formatTime(remaining)}</b></span>
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <div class="dialog-button" style="flex:1;" onclick="checkMissionStatus(${num})">🔍 Status</div>
                    <div class="dialog-button" style="flex:1; background:linear-gradient(#2a1800,#1a0f00); border-color:#cc6600; color:#ffaa44;" onclick="skipDragonMission(${num})">⏭️ Pomiń</div>
                </div>
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
                ${renderVitalsLine(vitals, maxHP, maxMana)}
            </div>
            <div style="margin:4px 0 10px 0; font-size:12px;">
                ${Object.entries(stats).map(([k,v]) => renderStatWithBonus(k, v, getEquipmentStatBonus(num))).join(' <span style="color:#445;">|</span> ')}
            </div>

            ${missionHtml}

            ${!isOnMission ? `
                <details style="margin:6px 0;" ${getDetailsState('feed', num) !== 'closed' ? 'open' : ''} id="feed-details-${num}" ontoggle="saveDetailsState('feed', ${num}, this.open)"><summary style="cursor:pointer; color:#9ab; padding:6px 0;">🍖 Nakarm smoka</summary>
                <div style="margin-top:6px;">
                    ${(foodItems.mięso||0) > 0 ? `<div class="dialog-button" style="font-size:13px;" onclick="feedDragonFood(${num},'mięso')">🥩 Mięso (${foodItems.mięso}) — +Siła, +5 poz.</div>` : ''}
                    ${(foodItems.jagody||0) > 0 ? `<div class="dialog-button" style="font-size:13px;" onclick="feedDragonFood(${num},'jagody')">🫐 Jagody (${foodItems.jagody}) — +Inteligencja, +5 poz.</div>` : ''}
                    ${(inventory['Świeża ryba']||0) > 0 ? `<div class="dialog-button" style="font-size:13px;" onclick="feedDragonFood(${num},'ryba')">🐟 Ryba (${inventory['Świeża ryba']}) — +Zręczność, +5 poz.</div>` : ''}
                    ${(inventory['Chleb']||0) > 0 ? `<div class="dialog-button" style="font-size:13px;" onclick="feedDragonFood(${num},'chleb')">🍞 Chleb (${inventory['Chleb']}) — +Wytrzymałość, +5 poz.</div>` : ''}
                    ${(inventory['Górski ser']||0) > 0 ? `<div class="dialog-button" style="font-size:13px;" onclick="feedDragonFood(${num},'ser')">🧀 Ser (${inventory['Górski ser']}) — +Siła Woli, +5 poz.</div>` : ''}
                    ${((foodItems.mięso||0)+(foodItems.jagody||0)+(inventory['Świeża ryba']||0)+(inventory['Chleb']||0)+(inventory['Górski ser']||0)) === 0 ? '<p style="color:#6070a0; font-size:12px; margin:4px 0;">Brak jedzenia. Kup u Handlarza Żywności lub znajdź na wyprawie.</p>' : ''}
                </div></details>
                ${vitals.fatigue > 0 ? `<div class="dialog-button" onclick="handleRestDragon(${num})">💤 Pozwól odpocząć</div>` : ''}
            ` : ''}

            <!-- Misje smoka — przeniesione do zakładki Smoki -->

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

            <!-- Ekwipunek smoka -->
            ${renderDragonGearPanel(num, level)}

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


function skipDragonMission(dragonNum) {
    const mission = loadDragonMission(dragonNum);
    if (!mission) return;
    // Force endTime to now so completeDragonMission triggers
    mission.endTime = Date.now() - 1;
    saveDragonMission(dragonNum, mission);
    completeDragonMission(dragonNum);
}


/* =========================================
   KARMIENIE SMOKA JEDZENIEM
========================================= */
const FOOD_STAT_MAP = {
    'mięso':   { stat: 'sila',         label: 'Siła',       source: 'foodItems' },
    'jagody':  { stat: 'inteligencja', label: 'Inteligencja', source: 'foodItems' },
    'ryba':    { stat: 'zrecznosc',    label: 'Zręczność',   source: 'inventory', key: 'Świeża ryba' },
    'chleb':   { stat: 'wytrzymalosc', label: 'Wytrzymałość', source: 'inventory', key: 'Chleb' },
    'ser':     { stat: 'sila_woli',    label: 'Siła Woli',   source: 'inventory', key: 'Górski ser' },
};

function feedDragonFood(dragonNum, foodType) {
    const foodDef = FOOD_STAT_MAP[foodType];
    if (!foodDef) return;

    // Check if food available
    let hasFood = false;
    if (foodDef.source === 'foodItems') {
        hasFood = (foodItems[foodType] || 0) > 0;
    } else {
        hasFood = (inventory[foodDef.key] || 0) > 0;
    }
    if (!hasFood) { alert('Brak tego jedzenia!'); return; }

    // Consume food
    if (foodDef.source === 'foodItems') {
        foodItems[foodType]--;
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
    } else {
        inventory[foodDef.key]--;
        if (inventory[foodDef.key] <= 0) delete inventory[foodDef.key];
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }

    // Increase feeding count (level +5)
    if (dragonNum === 1) {
        dragonFeedings++;
        dragonLevel = dragonFeedings * 5;
        localStorage.setItem('dragonFeedings', dragonFeedings);
        localStorage.setItem('dragonLevel', dragonLevel);
    } else if (dragonNum === 2) {
        secondDragonFeedings++;
        secondDragonLevel = secondDragonFeedings * 5;
        localStorage.setItem('secondDragonFeedings', secondDragonFeedings);
        localStorage.setItem('secondDragonLevel', secondDragonLevel);
    } else if (dragonNum === 3) {
        thirdDragonFeedings++;
        thirdDragonLevel = thirdDragonFeedings * 5;
        localStorage.setItem('thirdDragonFeedings', thirdDragonFeedings);
        localStorage.setItem('thirdDragonLevel', thirdDragonLevel);
    }

    // Increase stat
    const stats = loadDragonStats(dragonNum);
    stats[foodDef.stat] = (stats[foodDef.stat] || 1) + 1;
    saveDragonStats(dragonNum, stats);

    const name = dragonNum === 1 ? dragonName : dragonNum === 2 ? secondDragonName : thirdDragonName;
    alert(`${name} zjadł ${foodType}!\n+5 poziomów | +1 ${foodDef.label}`);

    updateHomeTab();
    updateDragonsTab();
    updateInventoryTabFull();
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

function renderMissionPanel(num, isOnMission, mission) {
    if (isOnMission) {
        const remaining = Math.max(0, mission.endTime - Date.now());
        return `
            <div style="margin:8px 0; padding:10px; background:rgba(40,30,10,0.5); border-left:3px solid #cc9900; border-radius:6px;">
                <div style="color:#ffcc44; font-weight:bold; margin-bottom:4px;">🦅 Na misji: ${mission.name}</div>
                <div style="color:#aaa; font-size:13px;">Powrót za: <b style="color:#ffcc44;" id="dtab-timer-${num}">${formatTime(remaining)}</b></div>
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <div class="dialog-button" style="flex:1; font-size:12px;" onclick="checkMissionStatus(${num})">🔍 Status</div>
                    <div class="dialog-button" style="flex:1; font-size:12px; border-color:#cc6600; color:#ffaa44;" onclick="skipDragonMission(${num}); updateDragonsTab();">⏭️ Pomiń</div>
                </div>
            </div>
        `;
    }
    const moonOpen = getMoonGateStatus().open;
    const missions = DRAGON_MISSIONS.filter(m => m.id !== 'wyprawa_ksiezycowa' || moonOpen);
    const selectId = `mission-select-${num}`;
    const infoId   = `mission-info-${num}`;
    const optionsHtml = missions.map((m, i) =>
        `<option value="${m.id}">${m.name}${m.id==='wyprawa_ksiezycowa'?' 🌕':''}</option>`
    ).join('');
    // build info for first mission by default
    const first = missions[0];
    const firstInfo = first
        ? `⏱ ${formatTime(first.duration)} &nbsp;|&nbsp; 😴 +${first.fatigue} &nbsp;|&nbsp; 💰 ${Object.entries(first.reward).map(([t,a])=>`${a} ${t}`).join(', ')}`
        : '';
    return `
        <div style="margin:10px 0;">
            <div style="font-size:12px; color:#8090aa; margin-bottom:5px;">🗺️ Wyprawa</div>
            <div style="display:flex; gap:8px; align-items:stretch;">
                <select id="${selectId}"
                    onchange="updateMissionInfo(${num})"
                    style="flex:1; background:#0d1525; color:#e0e8ff; border:1px solid #4a5a8a;
                           border-radius:6px; padding:6px 10px; font-size:13px; cursor:pointer;
                           appearance:auto; outline:none;">
                    ${optionsHtml}
                </select>
                <div class="dialog-button"
                     style="margin:0; padding:6px 14px; font-size:13px; white-space:nowrap; align-self:stretch; display:flex; align-items:center;"
                     onclick="handleStartMissionDragons(${num})">
                    Wyślij ▶
                </div>
            </div>
            <div id="${infoId}" style="margin-top:5px; font-size:11px; color:#7080aa; font-style:italic;">
                ${firstInfo}
            </div>
        </div>
    `;
}

function updateMissionInfo(num) {
    const sel = document.getElementById(`mission-select-${num}`);
    const info = document.getElementById(`mission-info-${num}`);
    if (!sel || !info) return;
    const m = DRAGON_MISSIONS.find(m => m.id === sel.value);
    if (!m) { info.textContent = ''; return; }
    info.innerHTML = `⏱ ${formatTime(m.duration)} &nbsp;|&nbsp; 😴 +${m.fatigue} &nbsp;|&nbsp; 💰 ${Object.entries(m.reward).map(([t,a])=>`${a} ${t}`).join(', ')}<br><span style="color:#6070a0;">${m.desc}</span>`;
}

function handleStartMissionDragons(num) {
    const sel = document.getElementById(`mission-select-${num}`);
    const missionId = sel ? sel.value : DRAGON_MISSIONS[0].id;
    const result = startDragonMission(num, missionId);
    alert(result.msg);
    if (result.ok) updateDragonsTab();
}

function updateDragonsTab() {
    const list = document.getElementById("dragons-list");
    if (!list) return;
    dragonLevel = dragonFeedings * 5;
    secondDragonLevel = secondDragonFeedings * 5;
    thirdDragonLevel = thirdDragonFeedings * 5;
    eggHeats        = Number(localStorage.getItem('eggHeats')) || 0;
    secondEggHeats  = Number(localStorage.getItem('secondEggHeats')) || 0;
    thirdEggHeats   = Number(localStorage.getItem('thirdEggHeats')) || 0;

    const dragonData = [
        { num: 1, name: dragonName, element: chosenDragon, heats: eggHeats, level: dragonLevel, unlocked: true },
        { num: 2, name: secondDragonName, element: secondDragonElement, heats: secondEggHeats, level: secondDragonLevel, unlocked: secondDragonUnlocked },
        { num: 3, name: thirdDragonName, element: thirdDragonElement, heats: thirdEggHeats, level: thirdDragonLevel, unlocked: thirdDragonUnlocked },
    ];

    let html = '';

    dragonData.forEach(d => {
        if (!d.unlocked) {
            html += `<div class="dragon-slot" style="opacity:0.5; color:#6070a0;">🔒 Smok ${d.num} — Zablokowany${d.num === 2 ? ' (odwiedź Handlarza)' : ''}</div>`;
            return;
        }

        if (d.heats < 3) {
            const heatMsg = d.heats === 0 ? 'Zimne — potrzebuje troski.' : d.heats === 1 ? 'Ciepłe — czujesz w nim życie.' : 'Drga — coś się porusza!';
            html += `
                <div class="dragon-slot">
                    <div style="font-weight:bold; color:#c0cce0; margin-bottom:6px;">${d.name} — ${d.element ? d.element.toUpperCase() : '?'}</div>
                    <div style="color:#8090aa; font-size:13px; margin-bottom:8px;">🥚 Ogrzania: <b style="color:#ffcc44;">${d.heats}/3</b> — ${heatMsg}</div>
                    <div class="dialog-button" onclick="heatEgg${d.num}()">🔥 Zadbaj o jajo</div>
                    <div style="color:#6070a0; font-size:12px; font-style:italic; margin-top:8px;">Gdy jajo się wykluje, tutaj pojawią się opcje wypraw.</div>
                </div>
            `;
            return;
        }

        const stats = loadDragonStats(d.num);
        const vitals = initDragonVitalsIfNeeded(d.num, stats);
        const maxHP = getDragonMaxHP(stats);
        const maxMana = getDragonMaxMana(stats);
        const mission = loadDragonMission(d.num);
        if (mission && Date.now() >= mission.endTime) {
            completeDragonMission(d.num);
        }
        const activeMission = loadDragonMission(d.num);
        const equipBonus = getEquipmentStatBonus(d.num);
        const elColors = { ogien:'#ff8866', woda:'#66bbff', ziemia:'#88cc66', powietrze:'#ccddff', swiatlo:'#ffe566', cien:'#aa77ff', lod:'#aaeeff', magma:'#ff6633' };
        const elColor = elColors[d.element] || '#aab';

        html += `
            <div class="dragon-slot">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div>
                        <span style="font-weight:bold; color:#e0e8ff; font-size:15px;">${d.name}</span>
                        <span style="color:${elColor}; font-size:12px; margin-left:8px;">${d.element ? d.element.toUpperCase() : ''}</span>
                        <span style="color:#7080aa; font-size:12px; margin-left:8px;">Poz. ${d.level}</span>
                    </div>
                </div>
                <div style="font-size:12px; color:#aab; margin-bottom:6px;">
                    ❤️ ${vitals.hp}/${maxHP} | 💧 ${vitals.mana}/${maxMana} | 😴 ${vitals.fatigue}/100
                </div>
                <div style="font-size:12px; color:#7080aa; margin-bottom:8px;">
                    ${Object.entries(stats).map(([k,v]) => `${STAT_LABELS[k]}: ${v}${equipBonus[k]?` <span style="color:#88ff88;">+${equipBonus[k]}</span>`:''}`).join(' · ')}
                </div>
                ${renderMissionPanel(d.num, !!activeMission, activeMission)}
            </div>
        `;
    });

    list.innerHTML = html;

    // Live timers for active missions
    dragonData.forEach(d => {
        if (!d.unlocked || d.heats < 3) return;
        const mission = loadDragonMission(d.num);
        if (mission) {
            const tick = () => {
                const el = document.getElementById(`dtab-timer-${d.num}`);
                if (!el) return;
                const rem = Math.max(0, mission.endTime - Date.now());
                el.textContent = formatTime(rem);
                if (rem > 0) setTimeout(tick, 1000);
            };
            tick();
        }
    });
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


function getTempleHeals() {
    const today = new Date().toISOString().slice(0,10);
    const stored = JSON.parse(localStorage.getItem('templeHeals') || '{"date":"","count":0}');
    if (stored.date !== today) return 0;
    return stored.count;
}
function useTempleHeal() {
    const today = new Date().toISOString().slice(0,10);
    const current = getTempleHeals();
    localStorage.setItem('templeHeals', JSON.stringify({ date: today, count: current + 1 }));
}

function renderTempleHeal() {
    const box = document.getElementById('location-action-area');
    if (!box) return;
    const healsUsed = getTempleHeals();
    const healsLeft = 3 - healsUsed;

    const dragons = [];
    if (eggHeats >= 3) dragons.push({ num: 1, name: dragonName });
    if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ num: 2, name: secondDragonName });
    if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ num: 3, name: thirdDragonName });

    let html = `
        <div style="padding:12px; background:rgba(40,20,10,0.6); border-left:3px solid #cc9900; border-radius:6px; margin-bottom:12px; font-style:italic; color:#e0c080; line-height:1.7;">
            Kapłanka pochyla się nad ołtarzem i wzbudza święty ogień.<br>
            — Astor może odnowić siły twojego smoka. Jedno uzdrowienie kosztuje <b style="color:#ffcc44;">1 srebro</b>.<br>
            Leczeń pozostało dziś: <b style="color:${healsLeft>0?'#66ff88':'#ff6666'};">${healsLeft}/3</b>
        </div>
    `;

    if (healsLeft <= 0) {
        html += `<div style="color:#7080aa; font-style:italic; margin-bottom:10px;">Astor potrzebuje odpoczynku. Wróć jutro.</div>`;
    } else if (!canAfford(100)) {
        html += `<div style="color:#ff6666; font-style:italic; margin-bottom:10px;">Brakuje ci srebra (1 srebrna moneta).</div>`;
    } else if (dragons.length === 0) {
        html += `<div style="color:#7080aa; font-style:italic; margin-bottom:10px;">Nie masz wyklutego smoka.</div>`;
    } else {
        dragons.forEach(d => {
            const stats = loadDragonStats(d.num);
            const vitals = loadDragonVitals(d.num);
            const maxHP = getDragonMaxHP(stats);
            const maxMana = getDragonMaxMana(stats);
            const alreadyFull = vitals.hp >= maxHP && vitals.mana >= maxMana && vitals.fatigue === 0;
            html += `
                <div style="margin:6px 0; padding:8px; background:rgba(20,30,20,0.5); border-radius:6px;">
                    <b>${d.name}</b> — ❤️ ${vitals.hp}/${maxHP} | 💧 ${vitals.mana}/${maxMana} | 😴 ${vitals.fatigue}/100
                    ${alreadyFull
                        ? '<div style="color:#66cc88; font-size:12px; margin-top:4px;">✅ Pełne zdrowie</div>'
                        : `<div class="dialog-button" style="margin-top:6px; font-size:13px;" onclick="doTempleHeal(${d.num})">🙏 Uzdrów (1 srebro)</div>`
                    }
                </div>
            `;
        });
    }

    html += `<div class="dialog-button" style="margin-top:10px; border-color:#778; color:#aab;" onclick="openLocation('miasto','swiatynia')">← Wróć do Świątyni</div>`;
    box.innerHTML = html;
}

function doTempleHeal(dragonNum) {
    if (getTempleHeals() >= 3) { alert('Wyczerpano dzienne leczeń.'); return; }
    if (!canAfford(100)) { alert('Brakuje 1 srebrnej monety.'); return; }
    spendCurrency(100);
    useTempleHeal();

    const stats = loadDragonStats(dragonNum);
    const vitals = loadDragonVitals(dragonNum);
    vitals.hp = getDragonMaxHP(stats);
    vitals.mana = getDragonMaxMana(stats);
    vitals.fatigue = 0;
    saveDragonVitals(dragonNum, vitals);
    updateCurrencyDisplay();
    updateHomeTab();
    renderTempleHeal();
    const name = dragonNum === 1 ? dragonName : dragonNum === 2 ? secondDragonName : thirdDragonName;
    // Show brief flash
    const box = document.getElementById('location-action-area');
    if (box) {
        const notice = document.createElement('div');
        notice.style.cssText = 'padding:8px 12px; background:rgba(20,50,20,0.8); border-left:3px solid #44cc88; border-radius:4px; color:#99ffcc; font-size:13px; margin-bottom:8px; font-style:italic;';
        notice.textContent = `Astor błogosławi ${name}. HP, Mana i Zmęczenie przywrócone do pełni!`;
        box.insertBefore(notice, box.firstChild);
        setTimeout(() => notice.remove(), 3000);
    }
}

function renderArenaContent(arenaType) {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    if (arenaType === 'smocza') {
        // Smocza arena
        const dragons = [];
        if (eggHeats >= 3) dragons.push({ num: 1, name: dragonName, element: chosenDragon });
        if (secondDragonUnlocked && secondEggHeats >= 3) dragons.push({ num: 2, name: secondDragonName, element: secondDragonElement });
        if (thirdDragonUnlocked && thirdEggHeats >= 3) dragons.push({ num: 3, name: thirdDragonName, element: thirdDragonElement });

        let html = `<p style="color:#aab; font-size:13px; font-style:italic; margin-bottom:10px;">Smoki mogą walczyć do 3 razy dziennie. Wybierz smoka i przeciwnika — trudniejszy = większa nagroda.</p>`;

        if (dragons.length === 0) {
            html += `<p style="color:#7080aa;">Nie masz wyklutego smoka do walki.</p>`;
        } else {
            dragons.forEach(d => {
                const fights = loadArenaFights(d.num);
                const mission = loadDragonMission(d.num);
                const vitals = loadDragonVitals(d.num);
                html += `<div style="margin:8px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px;">
                    <b>${d.name}</b> | Walki dziś: ${fights}/3 | 😴 ${vitals.fatigue}/100`;
                if (mission) {
                    html += `<div style="color:#cc9900; font-size:12px; margin-top:4px;">Na misji — walka niedostępna.</div>`;
                } else if (fights >= 3) {
                    html += `<div style="color:#7080aa; font-size:12px; margin-top:4px;">Wyczerpany. Wróć jutro.</div>`;
                } else {
                    // Show 3 opponent choices
                    const stats = loadDragonStats(d.num);
                    const power = (stats.sila||5)*1.5 + (stats.wytrzymalosc||5) + (stats.zrecznosc||5)*0.8;
                    // Pick 3 opponents spread across difficulty
                    const picks = [
                        ARENA_OPPONENTS[0],
                        ARENA_OPPONENTS[Math.floor(ARENA_OPPONENTS.length / 2)],
                        ARENA_OPPONENTS[ARENA_OPPONENTS.length - 1]
                    ];
                    html += `<div style="font-size:12px; color:#8090aa; margin:8px 0 4px;">Wybierz przeciwnika:</div>`;
                    picks.forEach((opp, idx) => {
                        const oppPower = opp.sila * 1.5 + opp.wytrzymalosc + opp.zrecznosc * 0.8;
                        const winChance = Math.round(Math.min(95, Math.max(5, (power / (power + oppPower)) * 100)));
                        html += `<div style="margin:4px 0; padding:8px; background:rgba(10,15,30,0.6); border-radius:5px; border-left:3px solid ${idx===0?'#44cc66':idx===1?'#cccc44':'#cc4444'};">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-weight:bold; font-size:13px;">${opp.difficulty} ${opp.name}</span>
                                <span style="color:#ffcc44; font-size:12px;">💰 ${opp.rewardDesc}</span>
                            </div>
                            <div style="color:#8090aa; font-size:12px; margin:3px 0;">${opp.desc}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                                <span style="font-size:11px; color:#9ab;">Szansa: ~${winChance}%</span>
                                <div class="dialog-button" style="margin:0; padding:4px 12px; font-size:12px;" onclick="startInteractiveFightVs(${d.num}, ${ARENA_OPPONENTS.indexOf(opp)})">⚔️ Walcz</div>
                            </div>
                        </div>`;
                    });
                }
                html += `</div>`;
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
    startInteractiveFight(num);
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
    updateInventoryTabFull();
    alert(`Kupiłeś: ${item.name}!`);
    renderSmithShop();
}

/* =========================================
   BIBLIOTEKA — OPCJE PO RUNACH
========================================= */


function sketchMoonGateRunes() {
    inventory['Kartka z runami'] = 1;
    delete inventory['Szkicownik'];
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTabFull();
    // Refresh location to update UI
    openLocation('gory', 'ksiezycowa_brama');
    // Show notification
    const area = document.getElementById("world-content-area");
    if (area) {
        // prepend notification
        const note = document.createElement('div');
        note.style.cssText = 'padding:10px; margin:10px 0 0 0; background:rgba(20,50,30,0.8); border-left:3px solid #44cc88; border-radius:6px; color:#99ffcc; font-style:italic;';
        note.textContent = 'Starannie odrysowujesz każdy symbol. Kartka z runami Księżycowej Bramy trafia do twojego ekwipunku. Szkicownik rozpadł się przy ostatnim symbolu — był już mocno zniszczony.';
        const win = area.querySelector('.dialog-window');
        if (win) win.insertBefore(note, win.firstChild);
    }
}

/* ==========================================================
   QUEST BIBLIOTEKARZA — ROZSZERZONY
========================================================== */

function libTextBox(text, color = '#c0c0e0', border = '#9966cc') {
    return `<div style="margin:10px 0; padding:12px; background:rgba(10,20,40,0.6); border-left:3px solid ${border}; border-radius:6px; color:${color}; font-style:italic; line-height:1.8;">${text}</div>`;
}

function renderLibrarianRuneOptions() {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    // ── Zamknięta biblioteka ──────────────────────────────
    const libClosedUntil = Number(localStorage.getItem('libClosedUntil') || '0');
    if (libClosedUntil > Date.now()) {
        box.innerHTML = `
            ${libTextBox('Drzwi biblioteki są zamknięte. Na drzwiach wisi karteczka:<br><br><em>„Zamknięte z powodu ważnych badań. Proszę wracać za:"</em><br><br><span style="font-size:1.2em; color:#9ab; font-style:normal;" id="lib-timer">...</span>', '#7080a0', '#556')}
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć do miasta</div>
        `;
        const tick = () => {
            const el = document.getElementById('lib-timer');
            if (!el) return;
            const rem = Number(localStorage.getItem('libClosedUntil') || '0') - Date.now();
            if (rem <= 0) { renderLibrarianRuneOptions(); return; }
            el.textContent = formatTime(rem);
        };
        tick();
        const iv = setInterval(() => { if (!document.getElementById('lib-timer')) { clearInterval(iv); return; } tick(); }, 1000);
        return;
    }

    const stage    = localStorage.getItem('runeQuestProgress') || 'none';
    const hasKartka = (inventory['Kartka z runami'] || 0) > 0;
    const enteredGate = localStorage.getItem('moonGateEntered') === 'true';
    const ingredientQuest = localStorage.getItem('libIngredientQuest') || 'none'; // none | active | secret | done

    const intro = libTextBox('Bibliotekarz unosi głowę znad notatek. Jego oczy błyszczą pod grubymi szkłami lunetki.');

    // ── Gracz ma kartkę z runami ──────────────────────────
    if (hasKartka) {
        box.innerHTML = intro + `
            ${libTextBox('Bibliotekarz dostrzega kartkę w twojej dłoni. Przez chwilę milczy, po czym jego oczy rozszerzają się.<br><br>— Niech... niech to będzie... — szepcze, biorąc kartkę ostrożnie jak relikwię. — To jest autentyczne. Precyzja rytów, proporcje symboli... to nie jest ludzka robota.<br><br>Przez chwilę chodzi między regałami, rozmawiając sam ze sobą.<br><br>— Muszę to porównać z archiwami sprzed Epoki Odbudowy. To może potrwać chwilę. Przepraszam, ale muszę prosić...<br><br>Wskazuje ci uprzejmie drzwi.', '#99ffcc', '#44cc88')}
            <div class="dialog-button" onclick="handleDeliverRunes()">Oddaj kartkę i pozwól mu pracować</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć później</div>
        `;
        return;
    }

    // ── Bibliotekarz wrócił z wynikami (stage = delivered, biblioteka właśnie się otworzyła) ──
    if (stage === 'delivered') {
        box.innerHTML = intro + `
            ${libTextBox('Bibliotekarz otwiera ci drzwi z wyraźnym podnieceniem w oczach.<br><br>— Pracowałem całą noc — zaczyna szybko. — Jest dużo wzmianek. Bardzo dużo. Pismo na twojej kartce pojawia się w co najmniej piętnastu źródłach, które mam — ale za każdym razem są to strzępki, urwane zdania.<br><br>Kładzie na biurku kilka notatek.<br><br>— Jedno jest pewne: jest mowa o <b style="color:#cc99ff;">magii</b>. Starej, bardzo starej — sprzed wszystkich znanych nam szkół. I wielokrotnie pojawia się wzmianka o <b style="color:#cc99ff;">fazach księżyca</b>. Dokładnie w kontekście "otwarcia" i "przejścia".<br><br>Zawiesza głos.<br><br>— Niestety nie jestem w stanie powiedzieć więcej. To jakby czytać mapę bez legendy. Ale... — podnosi wzrok — ...jeśli kiedyś dowiesz się czegoś od strony tej bramy, wróć do mnie.', '#e0d0ff', '#9966cc')}
            <div class="dialog-button" onclick="libResearchDone()">„Dziękuję. To już coś."</div>
        `;
        return;
    }

    // ── Główny ongoing dialog po zakończeniu badań ────────
    if (stage === 'researchDone' || stage === 'researchAcknowledged') {
        // Has player entered the gate?
        if (enteredGate && ingredientQuest === 'none') {
            // Unlock option 2
            box.innerHTML = intro + `
                ${libTextBox('— Co nowego? — pyta bibliotekarz z nadzieją w głosie. — Rozgryzłeś już o co chodzi z tą bramą?', '#c0d0ff', '#6677cc')}
                <div class="dialog-button" onclick="libAnswerNotYet()">„Jeszcze nie, ale się nie poddaję."</div>
                <div class="dialog-button" style="border-color:#66ff99; color:#99ffcc;" onclick="libAnswerYesGate()">„Tak! Ona otwiera się w pełnie! Tam jest jak w innym świecie!"</div>
            `;
        } else if (ingredientQuest === 'none') {
            // Gate not entered yet
            box.innerHTML = intro + `
                ${libTextBox('— Co nowego? — pyta bibliotekarz z nadzieją w głosie. — Rozgryzłeś już o co chodzi z tą bramą?', '#c0d0ff', '#6677cc')}
                <div class="dialog-button" onclick="libAnswerNotYet()">„Jeszcze nie, ale się nie poddaję."</div>
            `;
        } else if (ingredientQuest === 'active') {
            renderLibrarianIngredientShop(box, intro);
            return;
        } else if (ingredientQuest === 'secret') {
            box.innerHTML = intro + `
                ${libTextBox('— Cóż... nie wiem dlaczego, ale mam nadzieję, że z czasem mi to wytłumaczysz — mówi bibliotekarz z mieszaniną rozczarowania i spokoju. Sięga po książkę.<br><br>Wydaje się, że szanuje twoją decyzję.', '#c0a0a0', '#9944aa')}
                <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć do miasta</div>
            `;
        } else if (ingredientQuest === 'done') {
            box.innerHTML = intro + `
                ${libTextBox('— Dziękuję ci za wszystko co przyniosłeś — mówi bibliotekarz spokojnie. — Moje badania posuwają się naprzód. Może kiedyś odkryjemy prawdę o tej bramie.', '#99cc99', '#44aa66')}
                <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć do miasta</div>
            `;
        }
        return;
    }

    // ── Stany wstępne quests ──────────────────────────────
    if (stage === 'none') {
        box.innerHTML = intro + `
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Dobrze, postaram się je naszkicować gdy następnym razem tam będę."</div>
            <div class="dialog-button" onclick="handleRuneChoice('readFirst')">„Najpierw przeczytam księgi tutaj, może coś znajdę."</div>
            <div class="dialog-button" onclick="handleRuneChoice('notInterested')">„W sumie to tylko ciekawość — specjalnie po to nie chcę tam iść."</div>
            <div class="dialog-button" onclick="handleRuneChoice('knowAlready')">„Byłem już przy bramie. Runy są bardzo precyzyjne."</div>
        `;
    } else if (stage === 'sketch') {
        box.innerHTML = intro + `
            ${libTextBox('— Czekam na ten szkic — mówi bibliotekarz z nutą niecierpliwości. — Odwiedź Księżycową Bramę, naszkicuj runy i wróć do mnie.')}
            <div class="dialog-button" onclick="openTab('world'); setTimeout(()=>openRegion('gory'),80)">🏔️ Idź do Gór Sarak</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
    } else if (stage === 'readFirst') {
        box.innerHTML = intro + `
            ${libTextBox('Bibliotekarz prowadzi cię do regału w głębi sali. Wyciąga trzy cienkie tomy.<br><br>— Tu są wzmianki. Żadna pełna. Autorzy pisali jakby sami nie rozumieli, co widzieli.')}
            <div class="dialog-button" onclick="handleRuneChoice('readBooks')">Zacznij czytać</div>
        `;
    } else if (stage === 'readBooks') {
        box.innerHTML = intro + `
            ${libTextBox('Czytasz przez godzinę. Wzmianka pierwsza: <em>„brama, gdy księżyc jest pełen, oddycha."</em><br>Wzmianka druga: <em>„nie można jej otworzyć — ona sama decyduje."</em><br>Wzmianka trzecia: urwana w połowie zdania.<br><br>Bibliotekarz patrzy pytająco.', '#c0cce0')}
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Pójdę naszkicować runy. Może razem coś odkryjemy."</div>
            <div class="dialog-button" onclick="handleRuneChoice('done')">„Dziękuję. To dużo do przemyślenia."</div>
        `;
    } else if (stage === 'notInterested' || stage === 'done') {
        box.innerHTML = intro + `
            ${libTextBox('— Rozumiem — mówi bibliotekarz, wracając do pracy. — Jeśli kiedyś zmienisz zdanie, będę tutaj.', '#8090aa')}
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Właściwie... pójdę naszkicować te runy."</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
    } else if (stage === 'knowAlready') {
        box.innerHTML = intro + `
            ${libTextBox('— Precyzyjne, mówisz? — bibliotekarz podnosi głowę. — Jeśli masz możliwość wrócenia tam z czymś do rysowania... Szkic tych symboli byłby bezcenny dla moich badań.')}
            <div class="dialog-button" onclick="handleRuneChoice('sketch')">„Postaram się je naszkicować."</div>
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
    } else {
        // Fallback for any unknown stage
        box.innerHTML = intro + `
            <div class="dialog-button" style="border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć do miasta</div>
        `;
    }
}

function libResearchDone() {
    localStorage.setItem('runeQuestProgress', 'researchDone');
    // Unlock gate hint flag
    localStorage.setItem('gateHintMoonPhases', 'true');
    // Small reward
    adjustCurrency('silver', 2);
    updateCurrencyDisplay();
    const box = document.getElementById('location-action-area');
    if (box) {
        box.innerHTML = libTextBox('Bibliotekarz ściska ci dłoń.<br><br>— To dla mnie bardzo dużo znaczy. Weź to — wyciąga dwie srebrne monety — za trud i poświęcony czas.<br><br>Wychodzisz z poczuciem że ta historia jeszcze się nie skończyła.', '#99ffcc', '#44cc88') +
            `<div class="dialog-button" onclick="openRegion('miasto')">← Wróć do Astorveil</div>`;
    }
}

function libAnswerNotYet() {
    const box = document.getElementById('location-action-area');
    if (box) {
        box.innerHTML = libTextBox('— Doceniam wytrwałość — mówi bibliotekarz z uśmiechem. — To nie jest tajemnica, którą można rozwiązać przez tydzień. Moje badania też są dalekie od końca.<br><br>Kiwa głową z uznaniem.', '#c0d0ff', '#6677cc') +
            `<div class="dialog-button" onclick="openRegion('miasto')">← Wróć do Astorveil</div>`;
    }
}

function libAnswerYesGate() {
    const box = document.getElementById('location-action-area');
    if (!box) return;
    box.innerHTML = libTextBox('Bibliotekarz zamiera.<br><br>— <b>Zaskakujące!</b> — szepcze, po czym zaczyna chodzić po sali z narastającym podnieceniem. — Pełnia księżyca, wejście, inny świat... To się zgadza z wzmiank...<br><br>Zatrzymuje się i patrzy na ciebie intensywnie.<br><br>— Czy mógłbyś przynieść mi jakieś składniki, które dostępne są <em>tylko tam</em>? Oczywiście zapłacę uczciwie za każdy!', '#e0f0ff', '#44aaff') +
        `<div class="dialog-button" onclick="libAcceptIngredients('yes')">„Tak, nie ma problemu."</div>
         <div class="dialog-button" onclick="libAcceptIngredients('maybe')">„Zobaczymy co się uda zrobić."</div>
         <div class="dialog-button" style="border-color:#9944aa; color:#cc88ff;" onclick="libAcceptIngredients('secret')">„Myślę że powinniśmy zostawić to w tajemnicy przed światem."</div>`;
}

function libAcceptIngredients(choice) {
    const box = document.getElementById('location-action-area');
    if (!box) return;
    if (choice === 'yes' || choice === 'maybe') {
        localStorage.setItem('libIngredientQuest', 'active');
        box.innerHTML = libTextBox('— <b>Wspaniale!</b> — Bibliotekarz klaszcze w dłonie z entuzjazmem godnym dziecka. — Będę czekał z niecierpliwością! Każdy przedmiot z tamtej strony to bezcenny materiał badawczy!<br><br>Wręcza ci małą listę z nazwami składników.', '#99ffcc', '#44cc88') +
            `<div class="dialog-button" onclick="openRegion('miasto')">← Wróć do Astorveil</div>`;
    } else {
        // secret path → end quest, give 10 of each food
        localStorage.setItem('libIngredientQuest', 'secret');
        foodItems.mięso   = (foodItems.mięso   || 0) + 10;
        foodItems.jagody  = (foodItems.jagody  || 0) + 10;
        inventory['Świeża ryba']  = (inventory['Świeża ryba']  || 0) + 10;
        inventory['Chleb']        = (inventory['Chleb']        || 0) + 10;
        inventory['Górski ser']   = (inventory['Górski ser']   || 0) + 10;
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTabFull();
        box.innerHTML = libTextBox('Bibliotekarz przez chwilę milczy, patrząc na ciebie z mieszaniną niezrozumienia i szacunku.<br><br>— Cóż... nie wiem dlaczego, ale mam nadzieję, że z czasem mi to wytłumaczysz — mówi cicho.<br><br>Kłania się lekko. Quest zakończony po swojemu.', '#c0a0c0', '#9944aa') +
            `<div style="padding:10px; background:rgba(20,40,20,0.5); border-radius:6px; color:#99ff99; font-size:13px; margin:8px 0;">🎁 Nagroda: +10 każdego jedzenia dla smoków</div>` +
            `<div class="dialog-button" onclick="openRegion('miasto')">← Wróć do Astorveil</div>`;
    }
}

function renderLibrarianIngredientShop(box, intro) {
    // Items the librarian buys from the Moon Gate
    const GATE_ITEMS_BUYLIST = [
        { key: 'Księżycowy Kamień',                 price: 3,  unit: 'silver', desc: 'Kamień nasycony energią księżycowej pełni.' },
        { key: 'Srebrny Pył Zza Bramy',             price: 5,  unit: 'silver', desc: 'Świecący pył zebrany po drugiej stronie.' },
        { key: 'Strzęp Zasłony Między Światami',    price: 8,  unit: 'silver', desc: 'Materiał istniejący tylko przy bramie.' },
        { key: 'Eter Księżycowy',                   price: 10, unit: 'silver', desc: 'Skupiona magia miejsca — niezwykle rzadka.' },
        { key: 'Fragment Ostrza Śmierci',           price: 15, unit: 'silver', desc: '⚠️ Przerażający fragment zakazanego artefaktu. Bibliotekarz bierze go z wahaniem.' },
    ];

    let hasAny = GATE_ITEMS_BUYLIST.some(item => (inventory[item.key] || 0) > 0);

    let shopHtml = intro + libTextBox('— Witaj z powrotem! — mówi z ożywieniem. — Masz coś dla mnie z tamtej strony?', '#c0d0ff', '#6677cc');

    if (!hasAny) {
        shopHtml += libTextBox('Przeglądasz ekwipunek. Nie masz przy sobie żadnych składników z Księżycowej Bramy.<br><br>Wyślij smoka na wyprawę do bramy — być może coś znajdzie.', '#8090aa', '#556');
    } else {
        shopHtml += `<div style="font-size:13px; color:#aab; margin:8px 0;">Bibliotekarz skupuje:</div>`;
        GATE_ITEMS_BUYLIST.forEach(item => {
            const qty = inventory[item.key] || 0;
            if (qty > 0) {
                shopHtml += `
                    <div style="margin:4px 0; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#e0d0ff;">${item.key} <span style="color:#8090aa;">(masz: ${qty})</span></span>
                            <span style="color:#ffcc44;">${item.price} srebrnych/szt.</span>
                        </div>
                        <div style="font-size:11px; color:#7080a0; margin:2px 0 6px;">${item.desc}</div>
                        <div style="display:flex; gap:6px;">
                            <div class="dialog-button" style="flex:1; padding:4px; font-size:12px;" onclick="sellGateItem('${item.key}', 1, ${item.price})">Sprzedaj 1</div>
                            ${qty > 1 ? `<div class="dialog-button" style="flex:1; padding:4px; font-size:12px;" onclick="sellGateItem('${item.key}', ${qty}, ${item.price})">Sprzedaj wszystkie (${qty})</div>` : ''}
                        </div>
                    </div>
                `;
            }
        });
    }

    shopHtml += `<div class="dialog-button" style="margin-top:10px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Wróć do Astorveil</div>`;
    box.innerHTML = shopHtml;
}

function sellGateItem(key, qty, pricePerUnit) {
    const have = inventory[key] || 0;
    const selling = Math.min(qty, have);
    if (selling <= 0) return;
    inventory[key] -= selling;
    if (inventory[key] <= 0) delete inventory[key];
    localStorage.setItem('inventory', JSON.stringify(inventory));
    adjustCurrency('silver', selling * pricePerUnit);
    updateCurrencyDisplay();
    updateInventoryTabFull();
    renderLibrarianRuneOptions();
}

function handleDeliverRunes() {
    delete inventory['Kartka z runami'];
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('runeQuestProgress', 'delivered');
    const closeUntil = Date.now() + 1 * 60 * 1000;
    localStorage.setItem('libClosedUntil', String(closeUntil));
    updateInventoryTabFull();
    renderLibrarianRuneOptions();
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


/* ======= sec3_gear_combat_districts.js ======= */
/* =========================================
   SYSTEM EKWIPUNKU SMOKÓW
========================================= */

const DRAGON_EQUIPMENT_SLOTS = [
    { id: 'helm', label: 'Hełm', icon: '⛑️', desc: 'Chroni głowę smoka.', statBonus: { wytrzymalosc: 2 } },
    { id: 'chest', label: 'Pancerz na Tors', icon: '🛡️', desc: 'Główna ochrona tułowia.', statBonus: { wytrzymalosc: 4 } },
    { id: 'wings', label: 'Pancerz na Skrzydła', icon: '🦋', desc: 'Wzmacnia i chroni skrzydła.', statBonus: { zrecznosc: 2, wytrzymalosc: 2 } },
    { id: 'tail', label: 'Pancerz na Ogon', icon: '🐉', desc: 'Ogon boli mocniej. I jest bezpieczniejszy.', statBonus: { sila: 3, wytrzymalosc: 1 } },
    { id: 'harness', label: 'Uprząż', icon: '⚙️', desc: 'Ułatwia kontrolę smoka. Wymaga poz. 50.', statBonus: { sila_woli: 3 }, minLevel: 50 },
    { id: 'saddle', label: 'Siodło', icon: '🏇', desc: 'Zwiększa szybkość podróży o 20%. Wymaga poz. 50.', statBonus: { zrecznosc: 3 }, speedBonus: 0.2, minLevel: 50 },
];

// Przedmioty do kupienia u kowala
const SMITH_DRAGON_GEAR = [
    { id: 'zelazny_helm', slot: 'helm', name: 'Żelazny Hełm', desc: 'Podstawowa ochrona głowy.', cost: { silver: 5 }, stats: { wytrzymalosc: 2 } },
    { id: 'rudy_hem', slot: 'helm', name: 'Hełm z Górskiej Rudy', desc: 'Odporny na ogień i mróz.', cost: { silver: 12 }, stats: { wytrzymalosc: 4 } },
    { id: 'skorzany_pancerz', slot: 'chest', name: 'Skórzany Pancerz', desc: 'Lekki, podstawowy.', cost: { silver: 6 }, stats: { wytrzymalosc: 3 } },
    { id: 'zelazny_pancerz', slot: 'chest', name: 'Żelazny Pancerz', desc: 'Solidna ochrona tułowia.', cost: { silver: 15 }, stats: { wytrzymalosc: 6 } },
    { id: 'skrzydla_skorzane', slot: 'wings', name: 'Skórzana Osłona Skrzydeł', desc: 'Chroni membranę skrzydeł.', cost: { silver: 8 }, stats: { wytrzymalosc: 2, zrecznosc: 1 } },
    { id: 'ogon_zelazny', slot: 'tail', name: 'Żelazna Osłona Ogona', desc: 'Wzmacnia cios ogonem.', cost: { silver: 7 }, stats: { sila: 2, wytrzymalosc: 1 } },
    { id: 'uprzaz_prosta', slot: 'harness', name: 'Prosta Uprząż', desc: 'Pozwala na wygodną jazdę.', cost: { silver: 20 }, stats: { sila_woli: 2 }, minLevel: 50 },
    { id: 'siodlo_podroznicz', slot: 'saddle', name: 'Siodło Podróżnicze', desc: '+20% szybkości podróży.', cost: { silver: 25 }, stats: { zrecznosc: 2 }, speedBonus: 0.2, minLevel: 50 },
];

// Sprzęt do zdobycia na wyprawach (drop)
const EXPEDITION_GEAR_DROPS = [
    { id: 'luskowy_helm', slot: 'helm', name: 'Hełm z Łusek', desc: 'Znaleziony w ruinach. Wyjątkowo lekki.', stats: { wytrzymalosc: 5, zrecznosc: 1 }, rarity: 'rare' },
    { id: 'skrzydla_magiczne', slot: 'wings', name: 'Magiczne Osłony Skrzydeł', desc: 'Zdobiły smoka dawno zapomnianego rodu.', stats: { wytrzymalosc: 4, zrecznosc: 3 }, rarity: 'rare' },
    { id: 'ogon_smocz', slot: 'tail', name: 'Smoczy Pancerz Ogona', desc: 'Wykuta przez starego kowala z Gór Sarak.', stats: { sila: 5, wytrzymalosc: 3 }, rarity: 'rare' },
    { id: 'siodlo_magiczne', slot: 'saddle', name: 'Magiczne Siodło', desc: '+35% szybkości. Podwójny efekt siodła.', stats: { zrecznosc: 5 }, speedBonus: 0.35, rarity: 'epic', minLevel: 50 },
    { id: 'uprzaz_zlota', slot: 'harness', name: 'Złota Uprząż', desc: 'Wykonana przez rzemieślnika z dalekiego południa.', stats: { sila_woli: 5, inteligencja: 2 }, rarity: 'epic', minLevel: 50 },
];

function loadDragonEquipment(dragonNum) {
    const stored = localStorage.getItem(`dragon${dragonNum}Equipment`);
    return stored ? JSON.parse(stored) : {};
}

function saveDragonEquipment(dragonNum, equipment) {
    localStorage.setItem(`dragon${dragonNum}Equipment`, JSON.stringify(equipment));
}

function loadGearInventory() {
    const stored = localStorage.getItem('gearInventory');
    return stored ? JSON.parse(stored) : [];
}

function saveGearInventory(gearList) {
    localStorage.setItem('gearInventory', JSON.stringify(gearList));
}

function addGearToInventory(gearId, source) {
    const gearList = loadGearInventory();
    const allGear = [...SMITH_DRAGON_GEAR, ...EXPEDITION_GEAR_DROPS];
    const gearDef = allGear.find(g => g.id === gearId);
    if (!gearDef) return;
    gearList.push({ ...gearDef, instanceId: Date.now() + Math.random(), source });
    saveGearInventory(gearList);
}

function equipGear(dragonNum, instanceId) {
    const gearList = loadGearInventory();
    const item = gearList.find(g => g.instanceId === instanceId);
    if (!item) return false;
    const equipment = loadDragonEquipment(dragonNum);
    // Check level requirement
    const dragonLvl = getDragonCurrentLevel(dragonNum);
    if (item.minLevel && dragonLvl < item.minLevel) {
        alert(`Ten ekwipunek wymaga smoka na poziomie ${item.minLevel}. Twój smok jest na poziomie ${dragonLvl}.`);
        return false;
    }
    // Unequip old item in same slot
    if (equipment[item.slot]) {
        gearList.push(equipment[item.slot]);
    }
    equipment[item.slot] = item;
    // Remove from inventory
    const idx = gearList.findIndex(g => g.instanceId === instanceId);
    if (idx > -1) gearList.splice(idx, 1);
    saveDragonEquipment(dragonNum, equipment);
    saveGearInventory(gearList);
    return true;
}

function unequipGear(dragonNum, slot) {
    const equipment = loadDragonEquipment(dragonNum);
    if (!equipment[slot]) return;
    const item = equipment[slot];
    const gearList = loadGearInventory();
    gearList.push(item);
    delete equipment[slot];
    saveDragonEquipment(dragonNum, equipment);
    saveGearInventory(gearList);
}

function getDragonCurrentLevel(dragonNum) {
    if (dragonNum === 1) return dragonFeedings * 5;
    if (dragonNum === 2) return Math.min(100, secondDragonFeedings * 5);
    if (dragonNum === 3) return Math.min(100, thirdDragonFeedings * 5);
    return 0;
}

function getEquipmentStatBonus(dragonNum) {
    const equipment = loadDragonEquipment(dragonNum);
    const bonus = {};
    Object.values(equipment).forEach(item => {
        if (!item || !item.stats) return;
        Object.entries(item.stats).forEach(([stat, val]) => {
            bonus[stat] = (bonus[stat] || 0) + val;
        });
    });
    return bonus;
}

function getSpeedBonus(dragonNum) {
    const equipment = loadDragonEquipment(dragonNum);
    let bonus = 0;
    Object.values(equipment).forEach(item => {
        if (item && item.speedBonus) bonus += item.speedBonus;
    });
    return bonus;
}

/* =========================================
   SYSTEM WALKI NA MISJACH
========================================= */

const MISSION_ENEMIES = [
    { name: 'Bandyci', sila: 4, wytrzymalosc: 3, reward: ['Stary miecz', 'Torba złota'], copper: 20 },
    { name: 'Leśny Troll', sila: 7, wytrzymalosc: 8, reward: ['Trollia kość', 'Ziemiste zioła'], copper: 40 },
    { name: 'Wampir Górski', sila: 9, wytrzymalosc: 6, reward: ['Kryształ krwi', 'Nocny płaszcz'], copper: 0, silver: 1 },
    { name: 'Skalne Golemy', sila: 12, wytrzymalosc: 15, reward: ['Fragment golemowego kamienia', 'Ruda żelaza'], silver: 2 },
    { name: 'Piracka Załoga', sila: 6, wytrzymalosc: 5, reward: ['Piracka mapa', 'Złota moneta'], gold: 0, silver: 1, copper: 50 },
];

function missionCombat(dragonNum, missionId) {
    // 40% chance of encounter
    if (Math.random() > 0.4) return null;
    
    const stats = loadDragonStats(dragonNum);
    const equipBonus = getEquipmentStatBonus(dragonNum);
    const effectiveSila = stats.sila + (equipBonus.sila || 0);
    const effectiveWytr = stats.wytrzymalosc + (equipBonus.wytrzymalosc || 0);
    const effectiveZrec = stats.zrecznosc + (equipBonus.zrecznosc || 0);

    const enemy = MISSION_ENEMIES[Math.floor(Math.random() * MISSION_ENEMIES.length)];
    const dragonPower = effectiveSila * 1.5 + effectiveWytr + effectiveZrec * 0.5 + (Math.random() * 4 - 2);
    const enemyPower = enemy.sila * 1.5 + enemy.wytrzymalosc + (Math.random() * 3 - 1.5);
    const win = dragonPower > enemyPower;

    let combatResult = { enemy: enemy.name, win };

    if (win) {
        // Award combat rewards
        if (enemy.copper) adjustCurrency('copper', enemy.copper);
        if (enemy.silver) adjustCurrency('silver', enemy.silver);
        if (enemy.gold) adjustCurrency('gold', enemy.gold);
        
        // Chance for gear drop
        if (Math.random() < 0.2 && EXPEDITION_GEAR_DROPS.length > 0) {
            const dragonLvl = getDragonCurrentLevel(dragonNum);
            const eligible = EXPEDITION_GEAR_DROPS.filter(g => !g.minLevel || dragonLvl >= g.minLevel);
            if (eligible.length > 0) {
                const drop = eligible[Math.floor(Math.random() * eligible.length)];
                addGearToInventory(drop.id, 'wyprawa');
                combatResult.gearDrop = drop.name;
            }
        }

        // Bonus item from enemy loot
        if (enemy.reward && Math.random() < 0.5) {
            const loot = enemy.reward[Math.floor(Math.random() * enemy.reward.length)];
            inventory[loot] = (inventory[loot] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            combatResult.loot = loot;
        }
    } else {
        // Defeat: small extra fatigue penalty
        const vitals = loadDragonVitals(dragonNum);
        vitals.fatigue = Math.min(100, vitals.fatigue + 10);
        saveDragonVitals(dragonNum, vitals);
        combatResult.penalty = 10;
    }

    return combatResult;
}

// Override completeDragonMission to include combat
const _originalCompleteMission = window.completeDragonMission;

function completeDragonMission(dragonNum) {
    const mission = loadDragonMission(dragonNum);
    if (!mission) return;
    
    // Check for combat encounter during mission
    const combat = missionCombat(dragonNum, mission.id);
    
    Object.entries(mission.reward).forEach(([type, amt]) => adjustCurrency(type, amt));
    const vitals = loadDragonVitals(dragonNum);
    const speedBonus = getSpeedBonus(dragonNum);
    // speed bonus already applied to duration when starting mission
    vitals.fatigue = Math.min(100, vitals.fatigue + mission.fatigue);
    saveDragonVitals(dragonNum, vitals);
    saveDragonMission(dragonNum, null);
    
    let rewardText = Object.entries(mission.reward).map(([t,a]) => `${a} ${t}`).join(', ');
    let msg = `✅ Misja zakończona!\n${mission.name}\n\nNagroda: ${rewardText}\nZmęczenie: +${mission.fatigue}`;

    // Moon Gate special loot
    if (mission.id === 'wyprawa_ksiezycowa') {
        const moonLoot = rollMoonGateLoot();
        if (moonLoot) {
            inventory[moonLoot.key] = (inventory[moonLoot.key] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            msg += `\n\n🌕 Znalezisko z Księżycowej Bramy:\n${moonLoot.key}`;
        }
    }

    if (combat) {
        msg += `\n\n⚔️ Podczas misji natrafiono na: ${combat.enemy}`;
        if (combat.win) {
            msg += `\n🏆 Smok wygrał walkę!`;
            if (combat.loot) msg += `\n🎁 Łup: ${combat.loot}`;
            if (combat.gearDrop) msg += `\n✨ Znaleziono ekwipunek: ${combat.gearDrop}!`;
        } else {
            msg += `\n💀 Smok przegrał walkę. Dodatkowe zmęczenie: +${combat.penalty}`;
        }
    }
    
    alert(msg);
    updateHomeTab();
    updateInventoryTabFull();
}

/* =========================================
   EKRAN EKWIPUNKU SMOKA W DOMU
========================================= */

function renderDragonGearPanel(dragonNum, dragonLvl) {
    const equipment = loadDragonEquipment(dragonNum);
    const gearInventory = loadGearInventory();
    
    const gearOpen = getDetailsState('gear', dragonNum) !== 'closed';
    let html = `<details style="margin:8px 0;" ${gearOpen ? 'open' : ''} ontoggle="saveDetailsState('gear', ${dragonNum}, this.open)"><summary style="cursor:pointer; color:#9ab; padding:6px 0;">🛡️ Ekwipunek smoka</summary><div style="margin-top:8px;">`;
    
    DRAGON_EQUIPMENT_SLOTS.forEach(slot => {
        const equipped = equipment[slot.id];
        const locked = slot.minLevel && dragonLvl < slot.minLevel;
        const availableGear = gearInventory.filter(g => g.slot === slot.id);

        html += `<div style="margin:6px 0; padding:8px; background:rgba(10,20,40,0.5); border-radius:6px; font-size:13px;">
            <b>${slot.icon} ${slot.label}</b>${locked ? ` <span style="color:#996; font-size:11px;">(wymaga poz. ${slot.minLevel})</span>` : ''}`;
        
        if (equipped) {
            const statStr = Object.entries(equipped.stats || {}).map(([k,v]) => `+${v} ${STAT_LABELS[k]}`).join(', ');
            html += `<div style="color:#66cc88; margin:3px 0;">${equipped.name} ${statStr ? `(${statStr})` : ''} ${equipped.speedBonus ? `+${Math.round(equipped.speedBonus*100)}% szybkości` : ''}</div>`;
            html += `<div class="dialog-button" style="margin-top:3px; font-size:12px;" onclick="handleUnequip(${dragonNum}, '${slot.id}')">Zdejmij</div>`;
        } else if (!locked) {
            html += `<div style="color:#6070a0; margin:3px 0;">— puste —</div>`;
        }

        if (!locked && availableGear.length > 0) {
            html += `<div style="margin-top:4px;">`;
            availableGear.forEach(g => {
                const statStr = Object.entries(g.stats || {}).map(([k,v]) => `+${v} ${STAT_LABELS[k]}`).join(', ');
                html += `<div style="margin:3px 0; padding:4px 8px; background:rgba(20,35,55,0.6); border-radius:4px; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span>${g.name} ${statStr ? `(${statStr})` : ''}${g.rarity === 'rare' ? ' ✨' : g.rarity === 'epic' ? ' 💎' : ''}</span>
                    <div class="dialog-button" style="margin:0; padding:4px 10px; font-size:11px; white-space:nowrap;" onclick="handleEquip(${dragonNum}, ${g.instanceId})">Załóż</div>
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    html += `</div></details>`;
    return html;
}

function handleEquip(dragonNum, instanceId) {
    saveDetailsState('gear', dragonNum, true);
    const success = equipGear(dragonNum, instanceId);
    if (success) updateHomeTab();
}

function handleUnequip(dragonNum, slot) {
    saveDetailsState('gear', dragonNum, true);
    unequipGear(dragonNum, slot);
    updateHomeTab();
}

/* =========================================
   ZAKUP EKWIPUNKU U KOWALA
========================================= */


/* ==========================================================
   PANEL SPRZEDAŻY U HANDLARZY
========================================================== */
function renderSellPanel(merchantType) {
    const box = document.getElementById('location-action-area');
    if (!box) return;

    // Define what each merchant buys
    const accepts = {
        food:  ['Świeża ryba','Chleb','Górski ser','Mięso','Jagody','Zioła lecznicze'],
        smith: ['Stary miecz','Kryształ krwi','Fragment golemowego kamienia','Obroża smocza',
                'Zbroja z łusek','Hełm ognisty','Amulet smoczego pazura','Ruda żelaza',
                'Torba złota','Nocny płaszcz','Piracka mapa'],
    };
    const merchantNames = { food: 'Handlarka Żywności', smith: 'Kowal Brag' };
    const borderColors  = { food: '#aa6622', smith: '#446688' };

    const buyList = accepts[merchantType] || [];
    const available = buyList.filter(name => (inventory[name] || 0) > 0);

    let html = `
        <div style="padding:10px; background:rgba(10,20,35,0.7); border-left:3px solid ${borderColors[merchantType]}; border-radius:6px; margin-bottom:10px; color:#c0cce0; font-style:italic;">
            ${merchantNames[merchantType]} przegląda twój ekwipunek.
        </div>
    `;

    if (available.length === 0) {
        html += `<div style="color:#7080a0; font-style:italic; margin:10px 0;">Nie masz przy sobie niczego co mogę skupić.</div>`;
    } else {
        html += `<div style="font-size:12px; color:#8090aa; margin-bottom:8px;">Skupuję następujące przedmioty:</div>`;
        available.forEach(name => {
            const qty   = inventory[name] || 0;
            const val   = getItemValue(name) || 0;
            const safeN = name.replace(/'/g, "\'");
            html += `
                <div style="margin:5px 0; padding:8px 12px; background:rgba(15,25,40,0.6); border-radius:6px; border-left:2px solid #3a5a3a;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <span style="color:#d0e8d0; font-weight:bold; flex:1;">${name}</span>
                        <span style="color:#aabb66; font-size:11px;">💰 ${formatValue(val)}/szt.</span>
                        <span style="color:#ffcc44;">×${qty}</span>
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                             onclick="sellInventoryItem('${safeN}', 1); renderSellPanel('${merchantType}')">Sprzedaj 1</div>
                        ${qty > 1 ? `<div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                             onclick="sellInventoryItem('${safeN}', ${qty}); renderSellPanel('${merchantType}')">Wszystkie (${qty})</div>` : ''}
                    </div>
                </div>
            `;
        });
    }

    const backRegion = merchantType === 'smith' ? 'miasto' : 'miasto';
    html += `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('${backRegion}')">← Wróć</div>`;
    box.innerHTML = html;
}

function renderSmithShopFull() {
    const box = document.getElementById("location-action-area");
    if (!box) return;

    const dragonLvl1 = getDragonCurrentLevel(1);
    const dragonLvl2 = getDragonCurrentLevel(2);
    const dragonLvl3 = getDragonCurrentLevel(3);
    const maxLvl = Math.max(dragonLvl1, dragonLvl2, getDragonCurrentLevel(3));

    let html = `<p style="color:#aab; font-size:13px; font-style:italic; margin-bottom:12px;">Wystawa kowala Braga Żelaznorękiego. Ekwipunek smoczego wojownika i jeźdźca:</p>`;

    // Regular shop items
    const regularItems = [...SMITH_ITEMS, ...SMITH_DRAGON_GEAR.map(g => ({
        ...g,
        id: g.id,
        name: g.name,
        desc: g.desc + (g.stats ? ` (${Object.entries(g.stats).map(([k,v]) => `+${v} ${STAT_LABELS[k]}`).join(', ')})` : ''),
        inventoryKey: null, // gear goes to gearInventory
        isGear: true
    }))];

    regularItems.forEach(item => {
        const totalCopper = item.cost ? costToCopper(item.cost.copper, item.cost.silver, item.cost.gold) : 0;
        const affordable = canAfford(totalCopper);
        const locked = item.minLevel && maxLvl < item.minLevel;
        
        html += `<div style="margin:8px 0; padding:10px; background:rgba(20,30,50,0.5); border-radius:7px; ${locked ? 'opacity:0.5;' : ''}">
            <b>${item.name}</b>${locked ? ` <span style="color:#996; font-size:11px;">(wymaga smoka poz. ${item.minLevel})</span>` : ''}
            <br><span style="color:#8090aa; font-size:12px;">${item.desc}</span>
            <br>💰 ${formatCostLabel(item.cost ? item.cost.copper : 0, item.cost ? item.cost.silver : 0, item.cost ? item.cost.gold : 0)}
            ${!locked && affordable ? `<div class="dialog-button" style="margin-top:6px;" onclick="handleBuyShopItem('${item.id}', ${item.isGear ? 'true' : 'false'})">Kup</div>` : ''}
            ${!locked && !affordable ? `<div style="color:#7080aa; font-size:12px; margin-top:4px;">Brakuje środków.</div>` : ''}
        </div>`;
    });
    
    box.innerHTML = html + `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>`;
}

function handleBuyShopItem(itemId, isGear) {
    if (isGear) {
        const item = SMITH_DRAGON_GEAR.find(i => i.id === itemId);
        if (!item) return;
        const total = costToCopper(item.cost.copper, item.cost.silver, item.cost.gold);
        if (!spendCurrency(total)) { alert('Brakuje środków.'); return; }
        addGearToInventory(item.id, 'kowal');
        alert(`Kupiono: ${item.name}! Znajdziesz go w ekwipunku smoka w zakładce Dom.`);
        updateInventoryTabFull();
        renderSmithShopFull();
    } else {
        handleBuySmithItem(itemId);
    }
}

/* =========================================
   ZAKTUALIZOWANY EKWIPUNEK — WYŚWIETL GEAR
========================================= */


/* =========================================
   KATALOG PRZEDMIOTÓW — OPISY I GRUPY
========================================= */

// Kategorie przedmiotów
// "łupy" = zdobywa się, sprzedaje lub oddaje (quest items / valuables)
const ITEM_GROUPS = {
    jedzenie: {
        label: '🍖 Jedzenie dla Smoków',
        color: '#cc8844',
        border: '#aa6622',
        items: ['Świeża ryba', 'Chleb', 'Górski ser', 'Mięso', 'Jagody'],
        desc: 'Pożywienie podawane smokom w ramach codziennej pielęgnacji.'
    },
    fabularne: {
        label: '📜 Przedmioty Fabularne',
        color: '#9966cc',
        border: '#6633aa',
        items: ['Kartka z runami', 'Kopia inskrypcji', 'Szkicownik', 'Tajemnicza notatka',
                'Fragment runicznego kamienia I', 'Fragment runicznego kamienia II', 'Fragment runicznego kamienia III',
                'Fragment Ostrza Śmierci'],
        desc: 'Przedmioty powiązane z konkretnymi questami i wydarzeniami.'
    },
    ksiezycowe: {
        label: '🌕 Łupy z Księżycowej Bramy',
        color: '#aabbff',
        border: '#6677dd',
        items: ['Księżycowy Kamień', 'Srebrny Pył Zza Bramy', 'Strzęp Zasłony Między Światami', 'Eter Księżycowy'],
        desc: 'Łupy — unikatowe znaleziska z drugiej strony Bramy. Bibliotekarz zapłaci za nie dobrze.'
    },
    uzyteczne: {
        label: '🧰 Przedmioty Użytkowe',
        color: '#44aa88',
        border: '#227755',
        items: ['Zioła lecznicze', 'Torba złota', 'Ruda żelaza', 'Piracka mapa', 'Nocny płaszcz'],
        desc: 'Przedmioty przydatne w handlu, rzemiośle lub jako wkład do misji.'
    },
    lupy: {
        label: '💰 Łupy i Trofea',
        color: '#ccaa44',
        border: '#aa8822',
        items: ['Stary miecz', 'Kryształ krwi', 'Fragment golemowego kamienia', 'Obroża smocza',
                'Zbroja z łusek', 'Hełm ognisty', 'Amulet smoczego pazura'],
        desc: 'Łupy — przedmioty zdobyte na wyprawach lub w walce. Nadają się do sprzedania lub wymiany.'
    }
};

const ITEM_DESCRIPTIONS = {
    // Jedzenie
    'Świeża ryba':          'Złowiona w pobliskich rzekach. Smoki wodne szczególnie ją lubią — podawana surowa, z łuskami.',
    'Chleb':                'Zwykły bochenek z miejskiej piekarni. Zaskakująco dobrze smakuje smokom ziemi.',
    'Górski ser':           'Twardy ser dojrzewający w grotach Gór Sarak. Intensywny zapach, ale smoki go uwielbiają.',
    'Mięso':                'Surowe mięso — podstawa diety każdego smoka. Im większy kawałek, tym smok bardziej zadowolony.',
    'Jagody':               'Dzikie jagody z Lasu Mgieł. Lekkie i słodkie — idealne dla młodszych smoków.',
    // Fabularne
    'Kartka z runami':      'Starannie naszkicowane runy z Księżycowej Bramy. Bibliotekarz bardzo chce to zobaczyć.',
    'Kopia inskrypcji':     'Wierna kopia tajemniczej inskrypcji. Każdy symbol odwzorowany z najwyższą precyzją.',
    'Szkicownik':           'Gruby notes z grubymi kartkami. Bibliotekarz dał ci go specjalnie do szkicowania run.',
    'Tajemnicza notatka':   'Złożona kartka znaleziona w zakamarku biblioteki. Pismo jest nieczytelne — albo w kodzie, albo w obcym języku.',
    'Fragment runicznego kamienia I':   'Kawałek kamienia z wyrytymi runami. Drga lekko w dłoni — jakby żył.',
    'Fragment runicznego kamienia II':  'Drugi fragment. Przy zetknięciu z pierwszym przez chwilę świeci.',
    'Fragment runicznego kamienia III': 'Trzeci fragment. Razem tworzą coś, co wygląda jak klucz — ale do czego?',
    'Fragment Ostrza Śmierci': '⚠️ Przerażający fragment mrocznego artefaktu. Chłodny w dotyku nawet w środku lata. Jeden z wielu fragmentów legendarnego Ostrza Śmierci — mówi się, że ten kto złoży je w całość, może przemienić swego smoka w Dracolicha.',
    // Księżycowe
    'Księżycowy Kamień':              'Kamień nasycony energią pełni. Ciepły w dotyku, lśni srebrzystym blaskiem nawet w ciemności.',
    'Srebrny Pył Zza Bramy':          'Świecący pył zebrany po drugiej stronie Księżycowej Bramy. Unosi się lekko, jakby grawitacja go nie dotyczyła.',
    'Strzęp Zasłony Między Światami': 'Materiał z granicy dwóch rzeczywistości. Przeźroczysty z jednej strony, nieprzenikniony z drugiej.',
    'Eter Księżycowy':                'Skupiona esencja magii miejsca — niezwykle rzadka. Lekko świeci i zmienia kolor przy zmianie nastroju właściciela.',
    // Użytkowe
    'Zioła lecznicze':      'Mieszanka ziół z Lasu Mgieł. Kapłanka z Astorveil i kilku lekarzy bardzo je ceni.',
    'Torba złota':          'Ciężka sakwa z kilkoma złotymi monetami — czyjaś zguba, albo zarobek z lepszych czasów.',
    'Ruda żelaza':          'Surowy kruszec z Gór Sarak. Kowal Brag zapłaci za nią uczciwie.',
    'Piracka mapa':         'Podarta mapa z tajemniczymi oznaczeniami. Wygląda autentycznie. Może coś na niej jest?',
    'Nocny płaszcz':        'Ciemny płaszcz z materiału pochłaniającego światło. Idealny dla kogoś kto nie chce być widziany.',
    // Łupy
    'Stary miecz':          'Wyszczerbiony, ale wciąż solidny miecz. Kowal mógłby coś z niego zrobić — albo kupić na przetopienie.',
    'Kryształ krwi':        'Czerwony kryształ pulsujący własnym słabym światłem. Alchemicy przepłacą za dobry okaz.',
    'Fragment golemowego kamienia': 'Kawałek ożywionego kamienia — pozostałość po jakimś starym golemie. Wciąż czuć w nim resztkę magii.',
    'Obroża smocza':        'Elegancka obroża ze wzmocnionego metalu. Nosi ją smok który chce pokazać swój status.',
    'Zbroja z łusek':       'Lekka zbroja zrobiona ze zrzuconych smoczych łusek. Wytrzymała i lekka jak nic innego.',
    'Hełm ognisty':         'Wykuty z rudy Gór Sarak, odporny na ogień. Żaden płomień go nie nadtopi.',
    'Amulet smoczego pazura': 'Zawieszka z prawdziwym pazurem smoka. Podobno przynosi szczęście — i odpędza złe duchy.',
};

// Wartości skupu (w miedziaczkach, 100 = 1 srebro)
const ITEM_VALUES = {
    // Jedzenie
    'Świeża ryba':          10,
    'Chleb':                 8,
    'Górski ser':           15,
    'Mięso':                20,
    'Jagody':                5,
    // Księżycowe
    'Księżycowy Kamień':           300,
    'Srebrny Pył Zza Bramy':       500,
    'Strzęp Zasłony Między Światami': 800,
    'Eter Księżycowy':            1000,
    // Użytkowe
    'Zioła lecznicze':      25,
    'Torba złota':         200,
    'Ruda żelaza':          40,
    'Piracka mapa':        150,
    'Nocny płaszcz':       180,
    // Łupy
    'Stary miecz':          60,
    'Kryształ krwi':       120,
    'Fragment golemowego kamienia': 90,
    'Obroża smocza':        75,
    'Zbroja z łusek':      200,
    'Hełm ognisty':        160,
    'Amulet smoczego pazura': 110,
};

// Grupy których NIE można sprzedać (fabularne)
const UNSELLABLE_GROUPS = new Set(['fabularne']);

function getItemValue(name) {
    return ITEM_VALUES[name] || null;
}

function canSellItem(name) {
    const group = getItemGroup(name);
    if (group && UNSELLABLE_GROUPS.has(group.key)) return false;
    return getItemValue(name) !== null;
}

function formatValue(copper) {
    if (copper >= 100) {
        const s = Math.floor(copper / 100);
        const c = copper % 100;
        return c > 0 ? `${s} srebrnych ${c} miedzi` : `${s} srebrnych`;
    }
    return `${copper} miedzi`;
}

function sellInventoryItem(name, qty) {
    const val = getItemValue(name);
    if (!val) return;
    const have = inventory[name] || 0;
    const selling = Math.min(qty, have);
    if (selling <= 0) return;
    inventory[name] -= selling;
    if (inventory[name] <= 0) delete inventory[name];
    localStorage.setItem('inventory', JSON.stringify(inventory));
    adjustCurrency('copper', selling * val);
    updateCurrencyDisplay();
    updateInventoryTabFull();
}

function getItemGroup(itemName) {
    for (const [groupKey, group] of Object.entries(ITEM_GROUPS)) {
        if (group.items.includes(itemName)) return { key: groupKey, ...group };
    }
    return null;
}

function getItemDesc(itemName) {
    return ITEM_DESCRIPTIONS[itemName] || null;
}

function renderItemCard(name, qty, extra) {
    const desc  = getItemDesc(name);
    const val   = getItemValue(name);
    const sell  = canSellItem(name);
    const safeN = name.replace(/'/g, "\\'");
    return `
        <div style="margin:5px 0; padding:9px 12px; background:rgba(15,20,35,0.6); border-radius:6px; border-left:2px solid #3a4a6a;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span style="color:#d0d8f0; font-weight:bold; flex:1;">${name}</span>
                ${val ? `<span style="color:#aabb66; font-size:11px; white-space:nowrap;">💰 ${formatValue(val)}/szt.</span>` : ''}
                <span style="color:#ffcc44; font-weight:bold; font-size:14px;">×${qty}</span>
            </div>
            ${desc ? `<div style="color:#7080a0; font-size:12px; margin-top:3px; font-style:italic; line-height:1.5;">${desc}</div>` : ''}
            ${sell ? `
                <div style="display:flex; gap:6px; margin-top:6px;">
                    <div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                         onclick="sellInventoryItem('${safeN}', 1)">Sprzedaj 1</div>
                    ${qty > 1 ? `<div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                         onclick="sellInventoryItem('${safeN}', ${qty})">Sprzedaj wszystkie (${qty})</div>` : ''}
                </div>
            ` : ''}
            ${extra || ''}
        </div>
    `;
}

function updateInventoryTabFull() {
    const inv = document.getElementById("inventory-content");
    let html = `<h2 style="margin-bottom:16px;">📦 Ekwipunek</h2>`;

    // ── Smocze rynsztunki (z kowala/dropów) ────────────────
    const gearInventory = loadGearInventory();
    if (gearInventory.length > 0) {
        html += `
            <div style="margin-bottom:18px;">
                <div style="font-size:15px; font-weight:bold; color:#aabbee; border-bottom:1px solid #3a4a6a; padding-bottom:6px; margin-bottom:10px;">⚔️ Rynsztunki Smoka</div>
                <div style="color:#7080a0; font-size:12px; font-style:italic; margin-bottom:8px;">Ekwipunek zakładasz smokom w zakładce <b>Dom</b>.</div>
        `;
        gearInventory.forEach(g => {
            const slotDef = DRAGON_EQUIPMENT_SLOTS.find(s => s.id === g.slot);
            const rarityBadge = g.rarity === 'epic' ? ' <span style="color:#cc88ff;">💎 Epicki</span>' : g.rarity === 'rare' ? ' <span style="color:#88ccff;">✨ Rzadki</span>' : '';
            html += `
                <div style="margin:5px 0; padding:9px 12px; background:rgba(15,20,35,0.6); border-radius:6px; border-left:2px solid #4a3a7a;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#d0c0ff; font-weight:bold;">${g.name}${rarityBadge}</span>
                        <span style="color:#7080aa; font-size:12px;">${slotDef ? slotDef.icon + ' ' + slotDef.label : g.slot}</span>
                    </div>
                    ${g.stats ? `<div style="color:#6070a0; font-size:12px; margin-top:2px;">${Object.entries(g.stats).map(([k,v])=>`${STAT_LABELS[k]||k}: +${v}`).join(' · ')}</div>` : ''}
                </div>
            `;
        });
        html += `</div>`;
    }

    // ── Jedzenie dla smoków ──────────────────────────────
    const foodEntries = [
        ['Mięso',       foodItems.mięso  || 0, 'Surowe mięso — podstawa diety każdego smoka. Im większy kawałek, tym smok bardziej zadowolony.'],
        ['Jagody',      foodItems.jagody || 0, 'Dzikie jagody z Lasu Mgieł. Lekkie i słodkie — idealne dla młodszych smoków.'],
        ['Świeża ryba', inventory['Świeża ryba'] || 0, 'Złowiona w pobliskich rzekach. Smoki wodne szczególnie ją lubią — podawana surowa, z łuskami.'],
        ['Chleb',       inventory['Chleb'] || 0, 'Zwykły bochenek z miejskiej piekarni. Zaskakująco dobrze smakuje smokom ziemi.'],
        ['Górski ser',  inventory['Górski ser'] || 0, 'Twardy ser dojrzewający w grotach Gór Sarak. Intensywny zapach, ale smoki go uwielbiają.'],
    ];
    const hasFood = foodEntries.some(([,q]) => q > 0);
    if (hasFood) {
        html += `<div style="margin-bottom:18px;">
            <div style="font-size:15px; font-weight:bold; color:#cc9944; border-bottom:1px solid #aa6622; padding-bottom:6px; margin-bottom:10px;">🍖 Jedzenie dla Smoków</div>
            <div style="color:#7080a0; font-size:12px; font-style:italic; margin-bottom:8px;">Podawane smokom w zakładce Dom.</div>
        `;
        foodEntries.forEach(([name, qty, desc]) => {
            if (qty > 0) {
                html += `<div style="margin:5px 0; padding:9px 12px; background:rgba(30,20,10,0.6); border-radius:6px; border-left:2px solid #aa6622;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#e0c080; font-weight:bold;">${name}</span>
                        <span style="color:#ffcc44; font-weight:bold;">×${qty}</span>
                    </div>
                    <div style="color:#7060a0; font-size:12px; margin-top:3px; font-style:italic;">${desc}</div>
                </div>`;
            }
        });
        html += `</div>`;
    }

    // ── Pozostałe grupy przedmiotów ──────────────────────
    const foodKeysToSkip = new Set(['Świeża ryba','Chleb','Górski ser']);
    const groupOrder = ['fabularne','ksiezycowe','uzyteczne','lupy'];
    const usedItems = new Set([...foodEntries.map(([n])=>n)]);

    groupOrder.forEach(groupKey => {
        const group = ITEM_GROUPS[groupKey];
        const entries = group.items.filter(name => {
            const qty = inventory[name] || 0;
            return qty > 0;
        });
        if (entries.length === 0) return;
        usedItems.add(...entries);

        html += `<div style="margin-bottom:18px;">
            <div style="font-size:15px; font-weight:bold; color:${group.color}; border-bottom:1px solid ${group.border}; padding-bottom:6px; margin-bottom:4px;">${group.label}</div>
            <div style="color:#7080a0; font-size:12px; font-style:italic; margin-bottom:8px;">${group.desc}</div>
        `;
        entries.forEach(name => {
            const qty = inventory[name] || 0;
            html += renderItemCard(name, qty);
        });
        html += `</div>`;
    });

    // ── Inne (niesklasyfikowane) ─────────────────────────
    const otherItems = Object.entries(inventory).filter(([name, qty]) => {
        if (qty <= 0) return false;
        if (foodKeysToSkip.has(name)) return false;
        const allGroupItems = Object.values(ITEM_GROUPS).flatMap(g => g.items);
        return !allGroupItems.includes(name);
    });
    if (otherItems.length > 0) {
        html += `<div style="margin-bottom:18px;">
            <div style="font-size:15px; font-weight:bold; color:#8090aa; border-bottom:1px solid #445; padding-bottom:6px; margin-bottom:8px;">📦 Różne</div>
        `;
        otherItems.forEach(([name, qty]) => {
            html += renderItemCard(name, qty);
        });
        html += `</div>`;
    }

    if (gearInventory.length === 0 && !hasFood && Object.values(inventory).every(v => !v || v <= 0)) {
        html += `<p style="color:#999; font-style:italic;">Ekwipunek jest pusty.</p>`;
    }

    inv.innerHTML = html;
}

/* =========================================
   MIASTO — 3 DZIELNICE
========================================= */

const CITY_DISTRICTS = [
    {
        name: 'Dzielnica Targowa',
        desc: 'Tu bije serce handlu Astorveil. Kramy, głośne targi i zapachy wszystkich zakątków świata.',
        color: '#6a4a1a',
        borderColor: '#cc9944',
        locations: ['tablica', 'handlarz_jaj', 'handlarz_zywnosci', 'karczma', 'plac']
    },
    {
        name: 'Dzielnica Rzemieślnicza',
        desc: 'Kuźnie, warsztaty i port. Tu wytwarza się i sprowadza wszystko czego miasto potrzebuje.',
        color: '#1a3a2a',
        borderColor: '#44aa66',
        locations: ['kowal', 'szkola_magii', 'port', 'posterunek']
    },
    {
        name: 'Dzielnica Honorowa',
        desc: 'Świątynia, arena, biblioteka i pałac — miejsca ducha, wiedzy i władzy Astorveil.',
        color: '#1a2a4a',
        borderColor: '#4466aa',
        locations: ['swiatynia', 'arena', 'biblioteka', 'palac']
    }
];

// Patch openRegion for 'miasto' to show districts
const _originalOpenRegion = window.openRegion;

function openRegionMiasto(regionKey) {
    if (regionKey !== 'miasto') {
        // fallback to original for non-city
        openRegionOriginal(regionKey);
        return;
    }
    
    const region = worldData[regionKey];
    const wasVisited = visitedLocations[regionKey];
    if (!wasVisited) {
        visitedLocations[regionKey] = true;
        saveWorldState();
    }
    const desc = wasVisited ? region.desc : region.firstVisitDesc;
    worldHistory = [{ type: 'region', key: regionKey }];

    const area = document.getElementById("world-content-area");
    const subregions = document.getElementById("world-subregions");
    if (subregions) subregions.style.display = "none";

    let districtsHtml = CITY_DISTRICTS.map(district => {
        const districtLocs = district.locations.map(locId => {
            const loc = region.locations.find(l => l.id === locId);
            if (!loc) return '';
            return `<div class="dialog-button" style="margin:4px 0; font-size:13px;" onclick="openLocation('${regionKey}', '${loc.id}')">${loc.icon} ${loc.label}</div>`;
        }).join('');
        
        return `<div style="flex:1; min-width:180px; background:rgba(${hexToRgb(district.color)},0.3); border:1px solid ${district.borderColor}; border-radius:10px; padding:14px;">
            <div style="font-weight:bold; color:${district.borderColor}; margin-bottom:6px; font-size:14px; border-bottom:1px solid ${district.borderColor}33; padding-bottom:6px;">${district.name}</div>
            <div style="color:#8090aa; font-size:12px; font-style:italic; margin-bottom:10px; line-height:1.5;">${district.desc}</div>
            ${districtLocs}
        </div>`;
    }).join('');

    area.innerHTML = `
        <div class="dialog-window" style="margin-top:20px; max-width:900px;">
            <div class="dialog-title">${region.icon} ${region.label}</div>
            <div class="dialog-text" style="white-space:pre-line;">${desc}</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;">
                ${districtsHtml}
            </div>
            <div class="dialog-button" style="margin-top:15px; border-color:#778; color:#aab;" onclick="closeRegion()">← Wróć do mapy</div>
        </div>
    `;
}

function hexToRgb(hex) {
    // Simple hex color to rgb string for rgba() use
    const map = {
        '#6a4a1a': '106,74,26',
        '#1a3a2a': '26,58,42',
        '#1a2a4a': '26,42,74',
    };
    return map[hex] || '30,40,60';
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
    const l1 = dragonFeedings * 5;
    const l2 = secondDragonUnlocked ? secondDragonFeedings * 5 : 0;
    const l3 = thirdDragonUnlocked ? thirdDragonFeedings * 5 : 0;
    return Math.max(l1, l2, l3) >= minLevel;
}

/* -----------------------------------------
   DANE LOKACJI
----------------------------------------- */
/* =========================================
   ROZBUDOWANY QUEST — KSIĘŻYCOWA BRAMA
========================================= */

const RUNE_QUEST_STAGES = {
    none: 'Brak postępów',
    sketch: 'Czeka na szkic run',
    readFirst: 'Czyta księgi',
    readBooks: 'Po lekturze',
    knowAlready: 'Odwiedził bramę',
    notInterested: 'Niezainteresowany',
    done: 'Zakończył wstępne badania',
    delivered: 'Kartka dostarczona — bibliotekarz bada',
    researchDone: 'Bibliotekarz zakończył badania',
    fragment_hunt: 'Szuka fragmentów inskrypcji',
    translated: 'Runy przetłumaczone',
};

function getRuneQuestStage() {
    return localStorage.getItem('runeQuestProgress') || 'none';
}

function setRuneQuestStage(stage) {
    localStorage.setItem('runeQuestProgress', stage);
}

// Returns extra content + extra actions for ksiezycowa_brama based on quest progress
function getMoonGateQuestContent(moonOpen) {
    const stage = getRuneQuestStage();
    const hasSzkicownik = (inventory['Szkicownik'] || 0) > 0;
    const hasKartka = (inventory['Kartka z runami'] || 0) > 0;
    const hasKopia = (inventory['Kopia inskrypcji'] || 0) > 0;
    const hasFrag1 = (inventory['Fragment runicznego kamienia I'] || 0) > 0;
    const hasFrag2 = (inventory['Fragment runicznego kamienia II'] || 0) > 0;
    const hasFrag3 = (inventory['Fragment runicznego kamienia III'] || 0) > 0;

    let extra = '';
    let questActions = [];

    // Stage: has szkicownik, no kartka yet
    if (hasSzkicownik && !hasKartka) {
        extra += `<div style="margin:8px 0; padding:10px; background:rgba(20,40,30,0.6); border-left:3px solid #44cc88; border-radius:6px; color:#99ffcc;">
            Masz przy sobie szkicownik. Runy są przed tobą — precyzyjne, tajemnicze.
        </div>`;
        questActions.push({ label: '📝 Przeszkicuj runy', onclick: 'sketchMoonGateRunes()' });
    }

    // Stage: has kartka — remind to go to library
    if (hasKartka) {
        extra += `<div style="margin:8px 0; padding:8px; background:rgba(10,40,20,0.4); border-left:3px solid #44cc88; border-radius:6px; color:#88cc88; font-size:13px; font-style:italic;">
            Masz szkic run w ekwipunku. Bibliotekarz z pewnością będzie chciał go zobaczyć.
        </div>`;
    }

    // Hint after delivering runes — shown permanently at gate
    if (localStorage.getItem('gateHintMoonPhases') === 'true') {
        extra += `<div style="margin:8px 0; padding:10px; background:rgba(30,10,60,0.5); border-left:3px solid #9966cc; border-radius:6px; color:#cc99ff; font-size:13px; font-style:italic; line-height:1.7;">
            📖 Po oddaniu szkicu bibliotekarzowi, mówił on o <b>fazach księżyca</b> i o <b>magii za bramą</b>...<br>
            Może brama otwiera się tylko wtedy, gdy księżyc jest w pełni?
        </div>`;
    }

    // Stage: bibliotekarz skończył badania — czas wrócić
    if (stage === 'delivered') {
        extra += `<div style="margin:8px 0; padding:10px; background:rgba(30,10,60,0.6); border-left:3px solid #cc66ff; border-radius:6px; color:#cc99ff;">
            ✨ Masz poczucie, że bibliotekarz skończył badania. Czas wrócić!
        </div>`;
    }

    // Stage: fragment_hunt — szukaj fragmentów przy bramie
    if (stage === 'fragment_hunt') {
        const collected = [hasFrag1, hasFrag2, hasFrag3].filter(Boolean).length;
        extra += `<div style="margin:8px 0; padding:10px; background:rgba(30,10,60,0.6); border-left:3px solid #9966cc; border-radius:6px; color:#cc99ff; font-size:13px;">
            Bibliotekarz twierdzi, że fragmenty kamienia mogą być ukryte w pobliżu bramy lub zdobyte na wyprawach.<br>
            Zebrano: ${collected}/3 fragmentów.
        </div>`;
        if (!hasFrag1) questActions.push({ label: '🔍 Szukaj wśród skał (I)', onclick: 'searchForFragment(1)' });
        if (hasFrag1 && !hasFrag2) questActions.push({ label: '🔍 Szukaj głębiej (II)', onclick: 'searchForFragment(2)' });
    }

    // Stage: translated — brama reaguje inaczej
    if (stage === 'translated' && moonOpen) {
        extra += `<div style="margin:8px 0; padding:12px; background:rgba(30,50,10,0.6); border-left:3px solid #88ff44; border-radius:6px; color:#ccff88; font-style:italic; line-height:1.7;">
            Znasz już znaczenie run. Jedna z nich — ta po lewej — oznacza "wejście". Inna "powrót". I jedna, pośrodku, której bibliotekarz nie przetłumaczył do końca — tylko napisał: "warunek".
        </div>`;
    }

    return { extra, questActions };
}

function searchForFragment(num) {
    // Random chance — the fragment may be there
    const chance = num === 1 ? 0.7 : num === 2 ? 0.5 : 0.3;
    if (Math.random() < chance) {
        const key = `Fragment runicznego kamienia ${['I','II','III'][num-1]}`;
        inventory[key] = 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTabFull();
        alert(`Znalazłeś: ${key}!\nKamień jest ciepły w dotyku. Coś w nim drga — jakby część bramy żyła w tym fragmencie.`);
    } else {
        const msgs = [
            'Szukasz między skałami przez dłuższą chwilę. Nic. Może trzeba tu wrócić innym razem — albo inną drogą.',
            'Palce ślizgają się po zimnym kamieniu. Ziemia wydaje się obiecywać, ale dziś nie daje.',
            'Coś błyszczało między głazami — ale gdy podchodzisz bliżej, to tylko rosa na skale.'
        ];
        alert(msgs[Math.floor(Math.random() * msgs.length)]);
    }
    openLocation('gory', 'ksiezycowa_brama');
}

/* =========================================
   MISJA POSTERUNKU STRAŻY — 3 ZAKOŃCZENIA
========================================= */
/* Old guard mission functions replaced by new system */



/* ==============================================
   MISJA KURIERA — PRZEPISANA OD NOWA
   Etapy: accept → searching (2min timers) → found → endings
   Szczęście smoków wpływa na szansę znalezienia
================================================ */

// All locations where courier button can appear
const COURIER_SEARCH_LOCATIONS = [
    { region: 'miasto', loc: 'karczma',          label: 'Karczma Pod Smokiem' },
    { region: 'miasto', loc: 'plac',              label: 'Miejski Plac' },
    { region: 'miasto', loc: 'port',              label: 'Port Astorveil' },
    { region: 'miasto', loc: 'tablica',           label: 'Tablica Ogłoszeń' },
    { region: 'miasto', loc: 'handlarz_zywnosci', label: 'Stragan Handlarki Żywności' },
    { region: 'miasto', loc: 'kowal',             label: 'Kuźnia Braga' },
    { region: 'miasto', loc: 'biblioteka',        label: 'Biblioteka' },
];

function getGuardState() {
    const raw = localStorage.getItem('guardMission2');
    return raw ? JSON.parse(raw) : { stage: 'none' };
}

function setGuardState(obj) {
    localStorage.setItem('guardMission2', JSON.stringify(obj));
}

function getBestLuck() {
    const nums = [1];
    if (typeof secondDragonUnlocked !== 'undefined' && secondDragonUnlocked) nums.push(2);
    if (typeof thirdDragonUnlocked !== 'undefined' && thirdDragonUnlocked) nums.push(3);
    let best = 0;
    nums.forEach(n => {
        const stats = loadDragonStats(n);
        if ((stats.szczescie || 0) > best) best = stats.szczescie;
    });
    return best;
}

function courierSuccessChance(attempt) {
    const base = [0.40, 0.60, 0.80, 1.00][Math.min(attempt, 3)];
    const luck = getBestLuck();
    const bonus = Math.min(0.20, luck * 0.02); // up to +20% from luck
    return Math.min(1.0, base + bonus);
}

function pickNextCourierLocation(usedIndices) {
    const available = COURIER_SEARCH_LOCATIONS
        .map((l, i) => ({ ...l, i }))
        .filter(l => !usedIndices.includes(l.i));
    if (available.length === 0) return { ...COURIER_SEARCH_LOCATIONS[0], i: 0 };
    return available[Math.floor(Math.random() * available.length)];
}

// Called from offerHelp action in posterunek

function renderGuardMissionOrHostile() {
    const ending = localStorage.getItem('guardMission2') ? 
        JSON.parse(localStorage.getItem('guardMission2')).ending : null;
    
    if (ending === 'C') {
        const box = document.getElementById('location-action-area');
        if (!box) { renderGuardMission(); return; }
        box.innerHTML = `
            <div style="padding:14px; background:rgba(40,10,10,0.8); border-left:3px solid #cc2200; border-radius:6px; color:#ffaaaa; line-height:1.8; font-style:italic; margin-bottom:12px;">
                Kapitan Mira unosi wzrok i mierzy cię lodowatym spojrzeniem.<br><br>
                — <em>Żebyś znowu pokazał, że umiesz coś spierdolić?</em> Powinnam cię zamknąć w lochu.
                <span style="color:#cc8888;"> — kręci głową z dezaprobatą i patrzy na ciebie wymownie —</span>
                Nie mam na ciebie teraz czasu. <em>Precz mi z oczu!</em>
            </div>
            <div class="dialog-button" onclick="openRegion('miasto')">← Wróć do Astorveil</div>
        `;
        return;
    }
    renderGuardMission();
}

function renderGuardMission() {
    const box = document.getElementById('location-action-area');
    if (!box) return;
    const gs = getGuardState();

    // Already done?
    if (gs.stage && gs.stage.startsWith('done_')) {
        const ending = gs.stage.replace('done_', '');
        renderGuardEnding(ending);
        return;
    }

    if (gs.stage === 'none' || !gs.stage) {
        box.innerHTML = `
            <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #cc9900; border-radius:6px; color:#e0d0a0; line-height:1.7; margin-bottom:12px; font-style:italic;">
                Kapitan Mira odkłada raporty i mierzy cię wzrokiem.<br><br>
                — Mamy problem. Kurier z dokumentami zaginął trzy dni temu. Dokumenty są ważne — nie dla mnie, dla kogoś wyżej. Chcę żebyś się tym zajął. Dyskretnie.<br><br>
                Podaje ci opisany kawałek pergaminu — wizerunek kuriera i ostatnia znana trasa.<br><br>
                — Jak go znajdziesz, wróć tu zanim cokolwiek zrobisz. Zrozumiałeś?
            </div>
            <div class="dialog-button" onclick="acceptGuardMission('loyal')">„Jasne. Najpierw wracam do ciebie."</div>
            <div class="dialog-button" onclick="acceptGuardMission('independent')">„Działam jak uznam za stosowne."</div>
            <div class="dialog-button" onclick="guardAskAboutDocs()">„Co zawierają te dokumenty?"</div>
            <div class="dialog-button" style="border-color:#778;color:#aab;" onclick="declineGuardMission()">Odmów zlecenia</div>
        `;
        return;
    }

    if (gs.stage === 'asking_docs') {
        box.innerHTML = `
            <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #cc9900; border-radius:6px; color:#e0d0a0; line-height:1.7; margin-bottom:12px; font-style:italic;">
                Kapitan Mira unosi brew.<br><br>
                — <em>Nie twoja sprawa</em> — mówi spokojnie, ale coś w jej głosie mówi że to nie jest do dyskusji.<br><br>
                Milczysz przez chwilę. Ona też.<br><br>
                — Korespondencja urzędowa — dodaje w końcu, ważąc słowa. — Między pewnymi osobami. Wrażliwa. Jeśli trafi w złe ręce, sprawi kłopoty ludziom których nie chcę mieć za wrogów.<br><br>
                Odchyla się i krzyżuje ramiona.<br><br>
                — Dość gadania. Podejmujesz się czy nie?
            </div>
            <div class="dialog-button" onclick="acceptGuardMission('loyal')">„Dobrze. Wracam do ciebie z kurierem."</div>
            <div class="dialog-button" onclick="acceptGuardMission('independent')">„Znajdę go — ale działam po swojemu."</div>
            <div class="dialog-button" style="border-color:#778;color:#aab;" onclick="declineGuardMission()">„Nie, to nie dla mnie."</div>
        `;
        return;
    }

    if (gs.stage === 'searching') {
        const now = Date.now();
        const unlockTime = gs.nextSearchUnlock || 0;
        const loc = COURIER_SEARCH_LOCATIONS[gs.currentLocIndex];
        const remaining = unlockTime - now;

        if (remaining > 0) {
            box.innerHTML = `
                <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #9966cc; border-radius:6px; color:#c0aae0; line-height:1.7; margin-bottom:12px; font-style:italic;">
                    Kapitan Mira przekazała ci rysopis kuriera i zaznaczyła na planie ostatnie miejsca gdzie go widziano. Jej ludzie obserwują miasto — gdy coś wypatrzą, dadzą znać.<br><br>
                    Nowy ślad pojawi się za: <b id="courier-timer" style="color:#ffcc44;">...</b><br>
                    Wskazany rejon: <b style="color:#ffcc44;">${loc.label}</b>
                </div>
                <div class="dialog-button" onclick="openRegion('miasto')">Wróć do Astorveil</div>
            `;
            const tick = () => {
                const el = document.getElementById('courier-timer');
                if (!el) return;
                const rem = (getGuardState().nextSearchUnlock || 0) - Date.now();
                if (rem <= 0) { renderGuardMission(); return; }
                el.textContent = formatTime(rem);
                setTimeout(tick, 1000);
            };
            tick();
        } else {
            // Ready to search
            box.innerHTML = `
                <div style="padding:12px; background:rgba(10,40,20,0.7); border-left:3px solid #44cc88; border-radius:6px; color:#99ffcc; line-height:1.7; margin-bottom:12px; font-style:italic;">
                    Masz rysopis kuriera w kieszeni. Ostatni ślad prowadzi do: <b>${loc.label}</b>.<br>
                    Idź tam i szukaj. (Próba ${(gs.attempt||0)+1}/4)
                </div>
                <div class="dialog-button" onclick="openRegion('${loc.region}'); setTimeout(()=>openLocation('${loc.region}','${loc.loc}'),80)">📍 Idź do ${loc.label}</div>
                <div class="dialog-button" style="border-color:#778;color:#aab;" onclick="openRegion('miasto')">← Wróć do Astorveil</div>
            `;
        }
        return;
    }

    if (gs.stage === 'curious') {
        // Redirect to asking_docs for unified handling
        const gs2 = getGuardState();
        gs2.stage = 'asking_docs';
        setGuardState(gs2);
        renderGuardMission();
        return;
    }

    if (gs.stage === 'found') {
        const approach = gs.approach || 'loyal';
        const _foundLocId2 = gs.foundAtLoc || '';
        const _loyalDescs = {
            karczma:           'Podchodzisz do jego stolika. Unosi glowe — blady, z oczami pelnych rezygnacji. Dokumenty ma za paskiem, pod kurtka. Wyciaga je bez slowa.\n\nPatrzy na ciebie z ulga i przerażeniem jednocześnie.',
            plac:              'Doganiasz go przy wyjściu z placu. Zatrzymuje sie — wie, ze nie ma sensu dalej biec. Zawiniątko podaje ci drżącymi rekami. W środku — rulon pergaminu.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
            port:              'Wyciągasz go z beczki. Siada na skrzynce i kaszle. Dokumenty miał za paskiem w szczelnej skórzanej tubie. Mokre od potu, ale czytelne.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
            tablica:           'Stoi bez ruchu gdy do niego podchodzisz. Dokumenty sam wyciąga i podaje — jakby czekał właśnie na ten moment.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
            handlarz_zywnosci: 'Złapałeś go przy straganie. Odwraca się powoli i wyjmuje dokumenty z wewnętrznej kieszeni. Handlarka robi krok w tył i udaje, że nic nie widzi.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
            kowal:             'Wychodzi zza stojaka z rezygnacją na twarzy. Dokumenty wyciąga z buta — zwiniety rulon, nieco zgnieciony.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
            biblioteka:        'Powoli się prostuje i podaje ci dokumenty — były ukryte między dwiema grubymi księgami, które trzymał pod pachą.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.',
        };
        const _indepDescs = {
            karczma:           'Podchodzisz. Pochyla się i mówi cicho:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            plac:              'Zatrzymujesz go przy wyjściu. Odwraca się i mówi szybko:\n\n— Te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            port:              'Siada na skrzynce i łapie oddech. Mówi cicho:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            tablica:           'Stoi spokojnie i mówi wprost:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            handlarz_zywnosci: 'Zerka za siebie i szepcze:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            kowal:             'Stoi oparty o stojak i mówi spokojnie:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
            biblioteka:        'Wstaje powoli i mówi szeptem, jakby cisza biblioteki nakazywała ostrożność:\n\n— Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.',
        };
        const _defLoyal = 'Odnalazłeś kuriera. Żyje — blady ze strachu. Dokumenty ma przy sobie.\n\nPatrzy na ciebie z ulgą i przerażeniem jednocześnie.';
        const _defIndep = 'Odnalazłeś kuriera. Żyje — dokumenty ma przy sobie.\n\nSzepcze: — Nie wiem kto cię przesłał. Ale te dokumenty są niebezpieczne. Jeśli wrócą do Straży — ludzie skończą w lochu.';
        if (approach === 'loyal') {
            const desc = _loyalDescs[_foundLocId2] || _defLoyal;
            box.innerHTML = `
                <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #cc9900; border-radius:6px; color:#e0d0a0; line-height:1.7; margin-bottom:12px; white-space:pre-line; font-style:italic;">${desc}</div>
                <div class="dialog-button" onclick="finishGuardMission('A')">Weź dokumenty i wróć do Kapitan</div>
                <div class="dialog-button" onclick="guardReadDocs()">Zapytaj kuriera co to za dokumenty</div>
            `;
        } else {
            const desc = _indepDescs[_foundLocId2] || _defIndep;
            box.innerHTML = `
                <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #cc9900; border-radius:6px; color:#e0d0a0; line-height:1.7; margin-bottom:12px; white-space:pre-line; font-style:italic;">${desc}</div>
                <div class="dialog-button" onclick="finishGuardMission('A')">Wróć do Kapitan z dokumentami</div>
                <div class="dialog-button" onclick="finishGuardMission('B')">Spal dokumenty na miejscu</div>
                <div class="dialog-button" onclick="finishGuardMission('C')">Daj dokumenty kurierowi — niech ucieka</div>
            `;
        }
        return;
    }

    if (gs.stage === 'declined') {
        box.innerHTML = `
            <div style="padding:10px; color:#8090aa; font-style:italic; margin-bottom:10px;">Odmówiłeś zlecenia Kapitan Miry. Może jednak zmienisz zdanie?</div>
            <div class="dialog-button" onclick="resetGuardMission()">Wróć i podejmij zlecenie</div>
            <div class="dialog-button" style="border-color:#778;color:#aab;" onclick="openRegion('miasto')">← Zawróć</div>
        `;
        return;
    }
}

function acceptGuardMission(approach) {
    const firstLoc = pickNextCourierLocation([]);
    setGuardState({
        stage: 'searching',
        approach,
        attempt: 0,
        currentLocIndex: firstLoc.i,
        usedIndices: [firstLoc.i],
        nextSearchUnlock: Date.now() + 2 * 60 * 1000, // 2 minutes
    });
    // Plant the "courier button" flag for that location
    localStorage.setItem('courierSearchLoc', firstLoc.i);
    renderGuardMission();
}

function declineGuardMission() {
    setGuardState({ stage: 'declined' });
    renderGuardMission();
}

function resetGuardMission() {
    setGuardState({ stage: 'none' });
    renderGuardMission();
}

function guardAskAboutDocs() {
    const gs = getGuardState();
    gs.stage = 'asking_docs';
    setGuardState(gs);
    renderGuardMission();
}

function guardReadDocs() {
    const gs = getGuardState();
    gs.readDocs = true;
    setGuardState(gs);
    const box = document.getElementById('location-action-area');
    if (!box) return;
    box.innerHTML = `
        <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #cc9900; border-radius:6px; color:#e0d0a0; line-height:1.7; margin-bottom:12px; white-space:pre-line; font-style:italic;">Kurier patrzy na ciebie z wahaniem.\n\n— Listy. Czyjeś listy do kogoś. Adresy, nazwiska, spotkania. Spis osób obserwowanych przez Straż.\n\nSerce przyspiesza. To rejestr szpiegów. Kapitan Mira zleca takie rzeczy?</div>
        <div class="dialog-button" onclick="finishGuardMission('A')">Wróć do Kapitan z dokumentami</div>
        <div class="dialog-button" onclick="finishGuardMission('C')">Oddaj dokumenty komuś innemu (Droga Cienia)</div>
    `;
}

// Called from location rendering when courier location matches

function courierLocTimerTick() {
    const el = document.getElementById('loc-courier-timer');
    if (!el) return;
    const gs = getGuardState();
    const rem = (gs.nextSearchUnlock || 0) - Date.now();
    if (rem <= 0) {
        // Refresh the location view
        const gs2 = getGuardState();
        if (gs2.currentLocIndex !== undefined) {
            const loc = COURIER_SEARCH_LOCATIONS[gs2.currentLocIndex];
            if (loc) openLocation(loc.region, loc.loc);
        }
        return;
    }
    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    setTimeout(courierLocTimerTick, 1000);
}

function renderCourierSearchButton(regionKey, locationId) {
    const gs = getGuardState();
    if (gs.stage !== 'searching') return '';
    const locIdx = Number(localStorage.getItem('courierSearchLoc') ?? -1);
    const loc = COURIER_SEARCH_LOCATIONS[locIdx];
    if (!loc) return '';

    const now = Date.now();
    const isCorrectLoc = loc.region === regionKey && loc.loc === locationId;

    // If timer still running — show countdown in the indicated location
    if (gs.nextSearchUnlock && now < gs.nextSearchUnlock) {
        if (!isCorrectLoc) return '';
        const remaining = gs.nextSearchUnlock - now;
        setTimeout(courierLocTimerTick, 100);
    return `<div style="margin:10px 0; padding:12px; background:rgba(30,20,50,0.7); border:2px solid #9966cc; border-radius:8px; animation:worldFadeIn 0.5s;">
            <b style="color:#cc99ff;">🔍 Ślad kuriera wiedzie tutaj</b>
            <p style="color:#c0aae0; font-size:13px; margin:6px 0 6px;">Ty i ludzie Kapitan Miry obserwujecie okolicę. Szukanie możliwe za:</p>
            <div style="font-size:22px; font-weight:bold; color:#ffcc44;" id="loc-courier-timer">...</div>
<!-- timer started by courierLocTimerTick() -->
        </div>`;
    }

    if (!isCorrectLoc) return '';

    const _searchHints = {
        karczma:           'Na sali jest nieźle zatłoczone. Ktoś w kapturze zamówił chwilę temu piwo i nie pije — tylko obserwuje wyjście. Rozejrzyj się wolno, nie zwracając na siebie uwagi.',
        plac:              'Plac pełen kupców i przechodniów — idealne miejsce, żeby zniknąć w tłumie. Szukaj kogoś, kto stoi zbyt długo w jednym miejscu albo unika wzroku strażników.',
        port:              'Przy pomostach śmierdzi rybami i smołą. Jeden z dokerów kręci się bez celu przy składzie beczek — nie załadowuje ani nie rozładowuje. Może to on.',
        tablica:           'Przy tablicy stoi kilka osób. Jedna z nich — w szarej pelerynie — czyta to samo ogłoszenie już trzeci raz. Zbyt długo. Zbyt uważnie.',
        handlarz_zywnosci: 'Stragan jest głośny i pełen ludzi. Dobra kryjówka jeśli wiesz jak wtopić się w tłum. Szukaj kogoś, kto kupuje mało, ale stoi długo — i zerka przez ramię.',
        kowal:             'Kuźnia huczy od uderzeń. W głębi, między stojakami ze zbroją, jest ktoś kto udaje, że ogląda towar. Kurier raczej nie interesuje się żelazem — ale tu można czekać niewidocznym.',
        biblioteka:        'W bibliotece panuje cisza. Między wysokimi regałami w głębi sali widać oparty o półkę kapelusz. Ktoś przykucnął za jednym z regałów — jakby szukał czegoś bardzo blisko podłogi.',
    };
    const _hint = _searchHints[locationId] || 'Ślad prowadzi właśnie tutaj. Masz rysopis — rozejrzyj się uważnie.';
    return `<div style="margin:10px 0; padding:12px; background:rgba(30,50,20,0.7); border:2px solid #66cc44; border-radius:8px; animation:worldFadeIn 0.5s;">
        <b style="color:#aaff66;">🔍 Szukaj kuriera tutaj</b>
        <p style="color:#c0e0a0; font-size:13px; margin:6px 0 10px;">${_hint}</p>
        <div class="dialog-button" style="border-color:#66cc44;color:#aaff66;" onclick="attemptCourierSearch()">Szukaj</div>
    </div>`;
}

function attemptCourierSearch() {
    const gs = getGuardState();
    const attempt = gs.attempt || 0;
    const chance = courierSuccessChance(attempt);
    const success = Math.random() < chance || attempt >= 3;

    if (success) {
        const _locIdx2 = Number(localStorage.getItem('courierSearchLoc') ?? gs.currentLocIndex ?? 0);
        const _foundLocId = (COURIER_SEARCH_LOCATIONS[_locIdx2] || {}).loc || '';
        const _foundMsgs = {
            karczma:           'Wypatrzyłeś go. Siedzi sam przy stoliku pod ścianą, twarzą do okna — ale oczy wędrują nerwowo po sali. Kapelusz naciągnięty głęboko. Widzi cię zanim jeszcze do niego dojdziesz.',
            plac:              'Stoi przy fontannie z zawiniątkiem pod pachą — za ciężkim, żeby to był zwykły zakup. Kiedy na niego patrzysz, zaczyna wolno iść w stronę bocznej uliczki. Zrywasz się za nim.',
            port:              'Jedna z dużych beczek przy składzie kołysze się lekko — bez powodu. Podnosisz pokrywę. Kurier siedzi w środku, skulony między deskami, z dokumentami za paskiem. Patrzy na ciebie wielkimi oczami.',
            tablica:           'Podchodzisz od tyłu. Odwraca się — za późno. Macie kontakt wzrokowy. Przez chwilę oboje stoją bez ruchu. Potem ty robisz krok do przodu.',
            handlarz_zywnosci: 'Zauważasz go między kramami — udaje, że wybiera mięso. Handlarka patrzy na niego dziwnie; on za dużo czasu poświęca na wąchanie kawałka, który nie wygląda zachęcająco. Podchodzisz od boku.',
            kowal:             'Ukrył się za stojakiem z hełmami w głębi kuźni. Brag rzuca w jego kierunku krótkie spojrzenie — ale to nie jego sprawa. Ty podchodzisz pewnym krokiem. Kurier nie ma dokąd uciec.',
            biblioteka:        'Kucnął między dolnymi półkami w bocznym korytarzu — udaje, że szuka jakiejś księgi. Bibliotekarz mruży oczy w jego kierunku, ale nic nie mówi. Ty kładziesz rękę na regale tuż nad jego głową.',
        };
        const _foundMsg = _foundMsgs[_foundLocId] || 'Wypatrzyłeś go! Siedzi w kącie, osłaniając twarz kapeluszem. Oczy zdradzają strach.';
        gs.stage = 'found';
        gs.foundAtLoc = _foundLocId;
        setGuardState(gs);
        localStorage.removeItem('courierSearchLoc');
        // Show found message then render
        const box = document.getElementById('location-action-area');
        if (box) {
            box.innerHTML = `<div style="padding:12px; background:rgba(20,50,20,0.7); border-left:3px solid #44cc88; border-radius:6px; color:#99ffcc; margin-bottom:12px; font-style:italic;">
                ${_foundMsg}
                <div class="dialog-button" style="margin-top:10px;" onclick="renderGuardMission()">Podejdź do kuriera</div>
            </div>`;
        }
    } else {
        // Failed — set timer for next attempt in different location
        const nextAttempt = attempt + 1;
        const usedIndices = gs.usedIndices || [gs.currentLocIndex];
        const nextLoc = pickNextCourierLocation(usedIndices);
        usedIndices.push(nextLoc.i);
        gs.attempt = nextAttempt;
        gs.currentLocIndex = nextLoc.i;
        gs.usedIndices = usedIndices;
        gs.nextSearchUnlock = Date.now() + 2 * 60 * 1000;
        setGuardState(gs);
        localStorage.setItem('courierSearchLoc', nextLoc.i);

        const msgs = [
            'Szukasz go wszędzie. Nic. Może jest w innym miejscu.',
            'Kilka osób widziało kogoś podobnego. Idą w innym kierunku.',
            'Trop urwał się. Trzeba szukać gdzie indziej.',
        ];
        const box = document.getElementById('location-action-area');
        if (box) {
            box.innerHTML = `<div style="padding:12px; background:rgba(40,20,10,0.7); border-left:3px solid #cc6644; border-radius:6px; color:#ffaa88; margin-bottom:12px; font-style:italic;">
                ${msgs[Math.floor(Math.random() * msgs.length)]}<br><br>
                Nowy ślad: <b>${COURIER_SEARCH_LOCATIONS[nextLoc.i].label}</b>. Poczekaj 2 minuty, zanim znów zaczniesz szukać.
                <div class="dialog-button" style="margin-top:10px;" onclick="openRegion('miasto')">← Wróć do Astorveil</div>
            </div>`;
        }
    }
}

function finishGuardMission(ending) {
    const gs = getGuardState();
    gs.stage = 'done_' + ending;
    gs.ending = ending;
    setGuardState(gs);
    localStorage.removeItem('courierSearchLoc');
    renderGuardEnding(ending);
}

function renderGuardEnding(ending) {
    const box = document.getElementById('location-action-area');
    if (!box) return;

    const endings = {
        A: {
            color: '#ffcc66', border: '#cc9900',
            title: '⚔️ Zakończenie: Droga Straży',
            text: `Wracasz do Kapitan z dokumentami. Mira bierze je bez słowa, nie otwierając.<br><br>— Dobrze — mówi. — Jak obiecałam.<br><br>Kładzie na biurku 2 złote monety.<br><br>— I jeszcze jedno. — Unosi głowę. — Mamy wakat na nocnej warcie. Jeśli cię to interesuje, daj znać. Dobra robota.`,
            reward: () => adjustCurrency('gold', 2),
            unlockHint: 'Wstąp do Straży Miejskiej i odblokuj zakładkę <b>⚔️ Warta</b>.',
            joinLabel: '⚔️ Wstąp do Straży Miejskiej',
            joinFn: 'joinGuard',
            alreadyLabel: '✅ Jesteś już członkiem Straży Miejskiej.',
            alreadyCheck: 'isGuardMember',
        },
        B: {
            color: '#88ccff', border: '#4488bb',
            title: '🛡️ Zakończenie: Droga Ochrony',
            text: `Palisz dokumenty. Kurier odchodzi w milczeniu.<br><br>Wracasz do Kapitan z pustymi rękami.<br><br>— Gdzie są? — pyta twardo.<br>— Spłonęły.<br><br>Milczenie trwa długo. Mira w końcu kiwa głową — nie z uznaniem, ale bez złości.<br><br>— Nie zapłacę ci za to. Ale... wiem, że robiłeś co uważałeś za słuszne.<br><br>Kilka dni później w karczmie karczmarz dyskretnie wsuwa ci kartkę pod kufel. <em>Ktoś potrzebuje ochroniarza do prywatnych spraw. Stawki lepsze niż na warcie.</em>`,
            reward: () => {
                adjustCurrency('silver', 10);
                inventory['Tajemnicza notatka'] = (inventory['Tajemnicza notatka'] || 0) + 1;
                localStorage.setItem('inventory', JSON.stringify(inventory));
            },
            unlockHint: 'Odblokuj zakładkę <b>🛡️ Ochrona</b> — prywatna służba dla tych, którzy nie pytają za dużo.',
            joinLabel: '🛡️ Podejmij pracę jako ochroniarz',
            joinFn: 'joinOchrona',
            alreadyLabel: '✅ Pracujesz już jako ochroniarz.',
            alreadyCheck: 'isOchronaMember',
        },
        C: {
            color: '#cc88ff', border: '#9944cc',
            title: '🌑 Zakończenie: Droga Cienia',
            text: `Dokumenty trafiają w inne ręce. Kurier znika w zaułkach Astorveil.<br><br>Kilka dni później anonimowa paczka przy drzwiach — złota moneta i złożona kartka.<br><br><em>„Dobra robota. Mamy dla ciebie więcej zadań. Jeśli chcesz wiedzieć co się naprawdę dzieje w tym mieście — znajdź nas."</em><br><br>Na kartce adres. Nikt nie wie, że tam idziesz.`,
            reward: () => { adjustCurrency('gold', 1); localStorage.setItem('shadowContact', 'true'); },
            unlockHint: 'Odblokuj zakładkę <b>🌑 Szpiegowanie</b> — praca w cieniu dla nieznanych mocodawców.',
            joinLabel: '🌑 Nawiąż kontakt z Siecią Cienia',
            joinFn: 'joinSzpiegowanie',
            alreadyLabel: '✅ Jesteś już agentem Sieci Cienia.',
            alreadyCheck: 'isSzpiegMember',
        },
    };

    const e = endings[ending];
    if (!e) return;
    e.reward();
    updateInventoryTabFull();

    const alreadyJoined = window[e.alreadyCheck] ? window[e.alreadyCheck]() : false;
    box.innerHTML = `
        <div style="padding:14px; background:rgba(10,20,40,0.8); border:1px solid ${e.border}; border-radius:8px; color:${e.color}; line-height:1.8; font-style:italic; margin-bottom:12px;">
            <div style="font-weight:bold; font-size:15px; margin-bottom:10px;">${e.title}</div>
            ${e.text}
        </div>
        ${!alreadyJoined ? `
            <div style="padding:10px 12px; background:rgba(10,20,40,0.6); border-left:3px solid ${e.border}; border-radius:6px; color:#b0bbd0; font-size:13px; margin-bottom:10px;">
                ${e.unlockHint}
            </div>
            <div class="dialog-button" style="border-color:${e.border};color:${e.color};" onclick="${e.joinFn}()">${e.joinLabel}</div>
        ` : `<div style="color:#66cc88; margin:8px 0; font-size:13px; font-style:italic;">${e.alreadyLabel}</div>`}
        <div class="dialog-button" style="border-color:#778;color:#aab;margin-top:6px;" onclick="openRegion('miasto')">← Wróć do Astorveil</div>
    `;
}

function isGuardMember()    { return localStorage.getItem('guardMember')    === 'true'; }
function isOchronaMember()  { return localStorage.getItem('ochronaMember')  === 'true'; }
function isSzpiegMember()   { return localStorage.getItem('szpiegMember')   === 'true'; }

function joinGuard() {
    localStorage.setItem('guardMember', 'true');
    unlockWartaTab();
    alert('Zostałeś przyjęty do Straży Miejskiej Astorveil!\n\nNowa zakładka "⚔️ Warta" jest teraz dostępna.');
    renderGuardEnding('A');
    updateSidebarTabs();
}

function joinOchrona() {
    localStorage.setItem('ochronaMember', 'true');
    unlockOchronaTab();
    alert('Nawiązałeś kontakt z siecią ochroniarzy.\n\nNowa zakładka "🛡️ Ochrona" jest dostępna — znajdziesz ją też w karczmie.');
    renderGuardEnding('B');
    updateSidebarTabs();
}

function joinSzpiegowanie() {
    localStorage.setItem('szpiegMember', 'true');
    unlockSzpiegowanieTab();
    alert('Wszedłeś w kontakt z Siecią Cienia.\n\nNowa zakładka "🌑 Szpiegowanie" jest teraz dostępna.');
    renderGuardEnding('C');
    updateSidebarTabs();
}


/* ==============================================
   QUEST: SERCE LASU MGIEŁ
   5 etapów, rozgałęzienie od etapu 3 (Droga Światła / Droga Cienia)
================================================ */

const LAS_QUEST_KEY = 'lasMgielQuest';


/* ───────────────────────────────────────────────────────────────
   UNIVERSAL DRAGON PICKER FOR QUESTS
─────────────────────────────────────────────────────────────── */
const ELEMENT_ICONS = {
    ogien:'🔥', woda:'💧', ziemia:'🪨', powietrze:'🌪️',
    swiatlo:'✨', cien:'🌑', lod:'❄️', magma:'🌋'
};
const ELEMENT_NAMES_PL = {
    ogien:'Ogień', woda:'Woda', ziemia:'Ziemia', powietrze:'Powietrze',
    swiatlo:'Światło', cien:'Cień', lod:'Lód', magma:'Magma'
};
const ELEMENT_COLORS = {
    ogien:'#ff8866', woda:'#66bbff', ziemia:'#88cc66', powietrze:'#ccddff',
    swiatlo:'#ffe566', cien:'#aa77ff', lod:'#aaeeff', magma:'#ff6633'
};

function getHatchedDragonsInfo() {
    const list = [];
    const h1 = Number(localStorage.getItem('eggHeats')) || 0;
    if (h1 >= 3) list.push({ num:1, name: localStorage.getItem('dragonName')||'Smok 1', element: localStorage.getItem('chosenDragon')||'ogien' });
    const h2 = Number(localStorage.getItem('secondEggHeats')) || 0;
    if (h2 >= 3) list.push({ num:2, name: localStorage.getItem('secondDragonName')||'Smok 2', element: localStorage.getItem('secondDragonElement')||'ogien' });
    const h3 = Number(localStorage.getItem('thirdEggHeats')) || 0;
    if (h3 >= 3) list.push({ num:3, name: localStorage.getItem('thirdDragonName')||'Smok 3', element: localStorage.getItem('thirdDragonElement')||'ogien' });
    return list;
}

let _questDragonPickerCallback = null;

function renderDragonPickerForQuest(title, flavourText, borderColor, bgColor, onPickFn) {
    const box = document.getElementById('location-action-area');
    if (!box) return;
    const dragons = getHatchedDragonsInfo();
    if (dragons.length === 1) {
        onPickFn(dragons[0]);
        return;
    }
    // Store callback globally so onclick can reach it
    _questDragonPickerCallback = onPickFn;
    const cards = dragons.map((dr, idx) => {
        const icon  = ELEMENT_ICONS[dr.element]  || '🐉';
        const color = ELEMENT_COLORS[dr.element] || '#aab';
        const elName= ELEMENT_NAMES_PL[dr.element]|| dr.element;
        return `<div style="padding:12px 14px;background:rgba(10,15,30,0.6);border:2px solid ${color};border-radius:10px;cursor:pointer;transition:transform 0.15s;"
                     onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'"
                     onclick="questPickDragon(${idx})">
            <div style="font-size:22px;margin-bottom:4px;">${icon}</div>
            <div style="font-weight:bold;color:${color};font-size:14px;">${dr.name}</div>
            <div style="color:#aab;font-size:12px;">${elName}</div>
        </div>`;
    }).join('');
    box.innerHTML = `
    <div style="padding:14px;background:${bgColor};border:2px solid ${borderColor};border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
        <div style="font-size:16px;font-weight:bold;color:#e8e0c0;margin-bottom:8px;">🐉 ${title}</div>
        <div style="color:#c0b890;font-style:italic;line-height:1.7;margin-bottom:14px;">${flavourText}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:10px;">${cards}</div>
    </div>`;
}

function questPickDragon(idx) {
    const dragons = getHatchedDragonsInfo();
    const chosen = dragons[idx];
    if (!chosen || !_questDragonPickerCallback) return;
    const cb = _questDragonPickerCallback;
    _questDragonPickerCallback = null;
    cb(chosen);
}

function getLasQuestState() {
    const s = localStorage.getItem(LAS_QUEST_KEY);
    return s ? JSON.parse(s) : { stage: 'none' };
}
function setLasQuestState(obj) {
    localStorage.setItem(LAS_QUEST_KEY, JSON.stringify(obj));
}
function isLasQuestActive() {
    const s = getLasQuestState().stage;
    return s !== 'none' && !s.startsWith('done_');
}
function lasQuestStage() {
    return getLasQuestState().stage;
}

/* ── Główna funkcja renderująca quest ──────────────── */
function renderLasMgielQuest() {
    const qs = getLasQuestState();
    const box = document.getElementById('location-action-area');
    if (!box) return;

    /* ETAP 1 — Leśniczka proponuje quest */
    if (qs.stage === 'offered') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(10,30,20,0.85);border:2px solid #44aa66;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#66ff88;margin-bottom:10px;">📜 Etap 1 z 5 — Cień nad Lasem</div>
            <div style="color:#a0e0b0;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Leśniczka odkłada cerowanie i patrzy na ciebie poważnie.<br><br>
                — Od tygodnia coś jest nie tak. Polana milknie, ptaki uciekają, a w nocy przy Ruinach Świątyni pali się fioletowe światło. Bałam się sama sprawdzać. Ale ktoś musi — i widzę, że ty masz smoka. To coś znaczy.<br><br>
                Czy zajrzysz do Ruin i powiesz mi co tam się dzieje?
            </div>
            <div class="dialog-button" style="border-color:#44aa66;color:#66ff88;" onclick="lasQuestAccept()">✅ Zgadzam się — idę sprawdzić Ruiny</div>
            <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Nie teraz</div>
        </div>`;
        return;
    }

    /* ETAP 2 — Badanie Ruin */
    if (qs.stage === 'stage2') {
        const foundClue = qs.foundClue || false;
        box.innerHTML = `
        <div style="padding:14px;background:rgba(10,20,45,0.85);border:2px solid #6688cc;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#88aaff;margin-bottom:10px;">🔍 Etap 2 z 5 — Tajemnica Ruin</div>
            <div style="color:#a0b4e0;line-height:1.8;font-style:italic;margin-bottom:12px;">
                Mgła jest tu gęstsza niż zwykle — niemal dotykalna. Na ołtarzu dostrzegasz coś, czego wcześniej nie było: mały, ciemny kamień otoczony kręgiem popiołu.<br><br>
                Kamień drga lekko. W powietrzu unosi się zapach spalonej żywicy i czegoś starszego — jak ziemia po deszczu, tylko głębiej.
            </div>
            ${foundClue ? `
            <div style="padding:8px 12px;background:rgba(20,40,80,0.7);border-left:3px solid #6688cc;border-radius:6px;color:#a0c0ff;font-size:13px;margin-bottom:10px;font-style:italic;">
                🔎 Trop odnaleziony: Ślady butów prowadzą regularnie do ołtarza. Ktoś tu wraca. Kamień czeka.
            </div>` : ''}
            <div class="dialog-button" style="border-color:#6688cc;color:#88aaff;" onclick="lasQuestExamineArtifact()">🔮 Połóż dłoń na kamieniu</div>
            ${!foundClue ? `<div class="dialog-button" style="border-color:#6688cc;color:#88aaff;margin-top:6px;" onclick="lasQuestSearchArea()">🔎 Przeszukaj okolice ołtarza</div>` : ''}
            <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Wróć do Lasu</div>
        </div>`;
        return;
    }

    /* ETAP 3 — Punkt wyboru */
    if (qs.stage === 'stage3_choice') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(20,10,40,0.9);border:2px solid #9944cc;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#cc88ff;margin-bottom:10px;">⚠️ Etap 3 z 5 — Głos z Serca Lasu</div>
            <div style="color:#c0a0e8;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Gdy twoje palce dotknęły kamienia — wszystko zamarło. Mgła cofnęła się w sekundę. Kamień rozbłysnął fioletowym światłem i usłyszałeś głos, jakby szeptany z głębi korzeni:<br><br>
                <em style="color:#e0c8ff;">— Hodowco smoków. Znalazłeś Serce Lasu. Ostatni opiekun zginął sto lat temu i las zaczął chorować. Możesz go uleczyć — albo pochłonąć jego moc dla siebie.</em><br><br>
                Kamień czeka na decyzję. Obie drogi mają swoją cenę.
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                <div class="dialog-button" style="flex:1;min-width:200px;border-color:#44aaff;color:#88ccff;text-align:center;padding:14px;" onclick="lasQuestChooseLight()">
                    ☀️ <b>Droga Światła</b><br>
                    <span style="font-size:12px;color:#6699cc;display:block;margin-top:4px;">Przywróć las do równowagi.<br>Zostań jego opiekunem.</span>
                </div>
                <div class="dialog-button" style="flex:1;min-width:200px;border-color:#9944cc;color:#cc88ff;text-align:center;padding:14px;" onclick="lasQuestChooseShadow()">
                    🌑 <b>Droga Cienia</b><br>
                    <span style="font-size:12px;color:#9966cc;display:block;margin-top:4px;">Pochłoń moc Serca.<br>Las stanie się twoim narzędziem.</span>
                </div>
            </div>
        </div>`;
        return;
    }

    /* ETAP 4 — Droga Światła */
    if (qs.stage === 'stage4_light') {
        const vL = qs.visitedLake || false;
        const vN = qs.visitedNest || false;
        const allDone = vL && vN;
        box.innerHTML = `
        <div style="padding:14px;background:rgba(10,25,45,0.9);border:2px solid #44aaff;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#88ccff;margin-bottom:10px;">☀️ Etap 4 z 5 — Sojusznicy Lasu</div>
            <div style="color:#90b8e0;line-height:1.8;font-style:italic;margin-bottom:12px;">
                Głos z kamienia szepcze:<br>
                <em style="color:#aad4ff;">— By uleczyć las, musisz zebrać sojuszników. Odwiedź Jezioro Snu i nawiąż kontakt z Leśnym Strażnikiem przy jego Gnieździe. Dopiero wtedy wróć tutaj.</em>
                ${qs.missionDragonName ? `<br><br><span style="color:#66ddaa;">🐉 Towarzysz misji: <b>${qs.missionDragonName}</b> (${ELEMENT_NAMES_PL[qs.missionDragon]||qs.missionDragon})</span>` : ''}
            </div>
            <div style="padding:10px 12px;background:rgba(10,20,40,0.6);border-radius:8px;margin-bottom:12px;font-size:13px;line-height:2.0;">
                <span style="${vL ? 'color:#66ff88;' : 'color:#5060a0;'}">${vL ? '✅' : '⬜'} Jezioro Snu — ${vL ? '<b>odwiedzono</b>' : 'wymagana wizyta'}</span><br>
                <span style="${vN ? 'color:#66ff88;' : 'color:#5060a0;'}">${vN ? '✅' : '⬜'} Gniazdo Leśnego Strażnika — ${vN ? '<b>odwiedzono</b>' : 'wymagana wizyta'}</span>
            </div>
            ${allDone
                ? `<div class="dialog-button" style="border-color:#44aaff;color:#88ccff;" onclick="lasQuestLightReady()">🌿 Wróć do Serca Lasu z sojusznikami</div>`
                : `<div class="dialog-button" style="opacity:0.45;border-color:#334;color:#556;pointer-events:none;cursor:default;">Odwiedź najpierw oba miejsca...</div>`
            }
            <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Las Mgieł</div>
        </div>`;
        return;
    }

    /* ETAP 4 — Droga Cienia */
    if (qs.stage === 'stage4_shadow') {
        const shadowEnd = qs.shadowEndTime || 0;
        const now = Date.now();
        const rem = shadowEnd - now;

        if (rem > 0) {
            const mm = Math.floor(rem / 60000);
            const ss = Math.floor((rem % 60000) / 1000);
            box.innerHTML = `
            <div style="padding:14px;background:rgba(20,5,35,0.95);border:2px solid #9944cc;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
                <div style="font-size:16px;font-weight:bold;color:#cc88ff;margin-bottom:10px;">🌑 Etap 4 z 5 — Pochłanianie Serca</div>
                <div style="color:#a080c8;line-height:1.8;font-style:italic;margin-bottom:14px;">
                    Kamień pulsuje w twoich dłoniach. Ciemność wsącza się przez palce jak atrament — zimna, stara, głodna.<br>
                    <em style="color:#cc99ff;">Musisz wytrzymać i nie puścić. Nie zamykaj oczu.</em>
                </div>
                <div style="font-size:36px;font-weight:bold;color:#aa66ff;text-align:center;font-variant-numeric:tabular-nums;" id="las-shadow-countdown">${mm}:${ss.toString().padStart(2,'0')}</div>
                <div style="color:#6050a0;font-size:12px;text-align:center;margin-top:6px;">pozostały czas pochłaniania</div>
            </div>`;
            const tick = () => {
                const el = document.getElementById('las-shadow-countdown');
                if (!el) return;
                const r = (getLasQuestState().shadowEndTime || 0) - Date.now();
                if (r <= 0) { lasQuestShadowDone(); return; }
                const m2 = Math.floor(r / 60000), s2 = Math.floor((r % 60000) / 1000);
                el.textContent = m2 + ':' + s2.toString().padStart(2,'0');
                setTimeout(tick, 1000);
            };
            setTimeout(tick, 400);
        } else {
            box.innerHTML = `
            <div style="padding:14px;background:rgba(20,5,35,0.95);border:2px solid #cc44aa;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
                <div style="font-size:16px;font-weight:bold;color:#ff88cc;margin-bottom:10px;">🌑 Etap 4 z 5 — Moc pochłoniętą</div>
                <div style="color:#e0a0c0;line-height:1.8;font-style:italic;margin-bottom:14px;">
                    Pochłanianie dobiegło końca. Serce Lasu bije teraz innym rytmem — twoim. Ciemność jest zimna, ale posłuszna.<br><br>
                    Zostaje jeszcze jedno: Leśny Strażnik wyczuł zmianę. Leci tutaj.
                </div>
                <div class="dialog-button" style="border-color:#cc44aa;color:#ff88cc;" onclick="lasQuestShadowReadyConfirm()">💀 Staw czoła Leśnemu Strażnikowi</div>
                <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Wycofaj się tymczasowo</div>
            </div>`;
        }
        return;
    }

    /* ETAP 5 — Droga Światła: Rytuał */
    if (qs.stage === 'stage5_light') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(10,30,30,0.9);border:2px solid #66ccaa;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#88ffcc;margin-bottom:10px;">☀️ Etap 5 z 5 — Rytuał Odnowienia</div>
            <div style="color:#a0e4cc;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Wracasz do Serca Lasu. Kamień jarzy się miękkim, zielonym blaskiem gdy wkraczasz między kolumny. Leśny Strażnik — ogromny ptak o złotych oczach — siada cicho na ołtarzu, jakby na ciebie czekał.<br><br>
                Głos szepcze spokojnie:<br>
                <em style="color:#aaffdd;">— Gotowy? Połóż dłonie na Sercu. To nie jest bitwa. To przymierze.</em>
            </div>
            <div class="dialog-button" style="border-color:#66ccaa;color:#88ffcc;" onclick="lasQuestLightEnding()">🌿 Zawrzyj przymierze z Lasem</div>
            <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Jeszcze nie teraz</div>
        </div>`;
        return;
    }

    /* ETAP 5 — Droga Cienia: Konfrontacja */
    if (qs.stage === 'stage5_shadow') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(25,5,30,0.97);border:2px solid #dd2266;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ff6699;margin-bottom:10px;">🌑 Etap 5 z 5 — Konfrontacja ze Strażnikiem</div>
            <div style="color:#e0a0b8;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Leśny Strażnik spada z nieba jak złoty grom. Skrzydła rozpostarte, oczy czerwone z gniewu i bólu.<br><br>
                — Zdradziłeś las — mówi głosem, który drży korony drzew. — Oddaj Serce albo walcz.<br><br>
                Czujesz moc w dłoniach. Zimną. Gotową.
            </div>
            <div class="dialog-button" style="border-color:#dd2266;color:#ff6699;" onclick="lasQuestShadowEnding()">⚔️ Walcz ze Strażnikiem Lasu</div>
            <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Ucieknij (możesz wrócić)</div>
        </div>`;
        return;
    }

    /* ZAKOŃCZENIE — Droga Światła */
    if (qs.stage === 'done_light') {
        box.innerHTML = `
        <div style="padding:16px;background:rgba(10,35,20,0.9);border:2px solid #44ff88;border-radius:10px;text-align:center;animation:worldFadeIn 0.4s;">
            <div style="font-size:19px;font-weight:bold;color:#66ff88;margin-bottom:10px;">✅ Quest Ukończony — Droga Światła</div>
            <div style="color:#a0e8b8;font-style:italic;margin-bottom:12px;line-height:1.8;">
                Las Mgieł żyje. Serce zostało uzdrowione.<br>
                Leśniczka kłania ci się z głębokim szacunkiem, a Strażnik krąży spokojnie nad koronami drzew — strzeże was oboje.<br><br>
                <em style="color:#88ffaa;">Las pamięta opiekunów. Twoje imię jest teraz wpisane w korzenie.</em>
            </div>
            <div style="font-size:20px;color:#ffcc44;margin:10px 0;font-weight:bold;">+3 złoto &nbsp;|&nbsp; 🌿 Amulet Lasu</div>
            <div class="dialog-button" style="margin-top:10px;" onclick="openRegion('las')">← Wróć do Lasu Mgieł</div>
        </div>`;
        return;
    }

    /* ZAKOŃCZENIE — Droga Cienia */
    if (qs.stage === 'done_shadow') {
        box.innerHTML = `
        <div style="padding:16px;background:rgba(20,5,30,0.95);border:2px solid #9900cc;border-radius:10px;text-align:center;animation:worldFadeIn 0.4s;">
            <div style="font-size:19px;font-weight:bold;color:#cc66ff;margin-bottom:10px;">⚫ Quest Ukończony — Droga Cienia</div>
            <div style="color:#c090e0;font-style:italic;margin-bottom:12px;line-height:1.8;">
                Strażnik leży pokonany. Las jest cichy — inaczej niż wcześniej.<br>
                Cichy jak grób, nie jak spokój.<br><br>
                <em style="color:#aa66ff;">Serce Lasu bije teraz w rytm twojego serca. To ma swoją cenę — ale cena zawsze przychodzi później.</em>
            </div>
            <div style="font-size:20px;color:#aa66ff;margin:10px 0;font-weight:bold;">+5 złoto &nbsp;|&nbsp; 🌑 Kamień Cienia</div>
            <div class="dialog-button" style="margin-top:10px;border-color:#9900cc;color:#cc66ff;" onclick="openRegion('las')">← Wróć do Lasu Mgieł</div>
        </div>`;
        return;
    }
}

/* ── Funkcje przejść między etapami ────────────────────── */

function lasQuestTrigger() {
    /* Wywołane z Siedziby Leśnika — pokazuje etap 1 */
    setLasQuestState({ stage: 'offered' });
    renderLasMgielQuest();
}

function lasQuestAccept() {
    setLasQuestState({ stage: 'stage2' });
    const box = document.getElementById('location-action-area');
    if (!box) return;
    box.innerHTML = `
        <div style="padding:12px;background:rgba(10,35,20,0.75);border-left:3px solid #44aa66;border-radius:6px;color:#88ffaa;margin-bottom:12px;line-height:1.7;font-style:italic;">
            Leśniczka kiwa głową z ulgą i podaje ci suchy kawałek ziół.<br>
            — Dziękuję. Idź do Ruin Leśnej Świątyni — to na wschód od polany. I uważaj na mgłę przy ołtarzu.
        </div>
        <div class="dialog-button" onclick="openLocation('las','ruiny_swiatyni')">→ Idź do Ruin Leśnej Świątyni</div>
        <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Las Mgieł</div>`;
}

function lasQuestSearchArea() {
    const qs = getLasQuestState();
    qs.foundClue = true;
    setLasQuestState(qs);
    const box = document.getElementById('location-action-area');
    if (!box) return;
    box.innerHTML = `
        <div style="padding:12px;background:rgba(10,20,45,0.75);border-left:3px solid #6688cc;border-radius:6px;color:#a0b8f0;margin-bottom:12px;line-height:1.7;font-style:italic;">
            Przeszukujesz ruiny metodycznie. Między kamieniami znajdziesz coś dziwnego — ślady butów, świeże, regularne. Ktoś tu wraca codziennie. Wszystkie tropy prowadzą do ołtarza.
        </div>
        <div class="dialog-button" style="border-color:#6688cc;color:#88aaff;" onclick="lasQuestExamineArtifact()">🔮 Połóż dłoń na kamieniu na ołtarzu</div>`;
}

function lasQuestExamineArtifact() {
    setLasQuestState({ stage: 'stage3_choice' });
    renderLasMgielQuest();
}

function lasQuestChooseLight() {
    renderDragonPickerForQuest(
        'Wybierz smoka towarzyszącego misji',
        'Droga Światła wymaga sojuszników. Który smok wyruszy z tobą do Jeziora Snu i Gniazda Strażnika?',
        '#44aaff', 'rgba(10,25,45,0.9)',
        (dragon) => {
            setLasQuestState({ stage: 'stage4_light', visitedLake: false, visitedNest: false, missionDragon: dragon.element, missionDragonName: dragon.name });
            const box = document.getElementById('location-action-area');
            if (!box) return;
            const elName = ELEMENT_NAMES_PL[dragon.element] || dragon.element;
            const elIcon = ELEMENT_ICONS[dragon.element] || '🐉';
            const elColor= ELEMENT_COLORS[dragon.element] || '#aab';
            box.innerHTML = `
        <div style="padding:12px;background:rgba(10,25,40,0.8);border-left:3px solid #44aaff;border-radius:6px;color:#a0c8f0;margin-bottom:12px;line-height:1.7;font-style:italic;">
            Kamień pulsuje ciepłym, błękitnym blaskiem. Głos mówi spokojnie:<br>
            <em style="color:#88ccff;">— Mądrze. Odwiedź Jezioro Snu i Gniazdo Leśnego Strażnika. Gdy wrócisz — rytuał będzie gotowy.</em>
            <br><br><span style="color:${elColor};">${elIcon} ${dragon.name} wyrusza razem z tobą.</span>
        </div>
        <div class="dialog-button" onclick="openRegion('las')">→ Szukaj sojuszników w Lesie</div>`;
        }
    );
}

function lasQuestChooseShadow() {
    renderDragonPickerForQuest(
        'Wybierz smoka towarzyszącego misji',
        'Droga Cienia wymaga siły i cierpliwości. Który smok poprowadzi cię przez mroczny rytuał?',
        '#cc66ff', 'rgba(20,10,40,0.9)',
        (dragon) => {
            setLasQuestState({ stage: 'stage4_shadow', shadowEndTime: Date.now() + 3 * 60 * 1000, missionDragon: dragon.element, missionDragonName: dragon.name });
            renderLasMgielQuest();
        }
    );
}

function hasAnyHatchedDragon() {
    const h1 = Number(localStorage.getItem('eggHeats')) || 0;
    const h2 = Number(localStorage.getItem('secondEggHeats')) || 0;
    const h3 = Number(localStorage.getItem('thirdEggHeats')) || 0;
    return h1 >= 3 || h2 >= 3 || h3 >= 3;
}

function getHatchedDragonElements() {
    // Returns array of element strings for all hatched dragons
    const result = [];
    const h1 = Number(localStorage.getItem('eggHeats')) || 0;
    if (h1 >= 3) result.push(localStorage.getItem('dragon1Element') || 'ogien');
    const h2 = Number(localStorage.getItem('secondEggHeats')) || 0;
    if (h2 >= 3) result.push(localStorage.getItem('dragon2Element') || '');
    const h3 = Number(localStorage.getItem('thirdEggHeats')) || 0;
    if (h3 >= 3) result.push(localStorage.getItem('dragon3Element') || '');
    return result.filter(Boolean);
}

function lasQuestMarkLightVisit(place) {
    const qs = getLasQuestState();
    if (qs.stage !== 'stage4_light') return;
    qs[place] = true;
    setLasQuestState(qs);

    // Show alliance narration in location-action-area
    const box = document.getElementById('location-action-area');
    if (!box) return;

    const qs2 = getLasQuestState();
    const primaryEl = qs2.missionDragon || getHatchedDragonElements()[0] || 'ogien';

    if (place === 'visitedLake') {
        // Alliance with Jezioro Snu — varies by dragon element
        const lakeNarrations = {
            ogien: `Twój smok zbliża się do brzegu ostrożnie — ogień i woda nie lubią się z natury. Ale tu jest inaczej. Kiedy smok dotyka nozdrza powierzchni jeziora, woda nie ucieka. Nie paruje. Zamiast tego delikatnie unosi się i opada — jakby oddychała.\n\nZ głębi wydobywa się ciepłe, niebieskie światło. Smok prychnie, cofa łeb — a potem znowu się pochyla, tym razem bez lęku.\n\nJezioro cię zaakceptowało.`,
            woda: `Twój smok wchodzi w jezioro bez wahania, jakby wracał do domu. Woda przyjmuje go jak część siebie — kręgi idą na zewnątrz od każdego jego kroku. Z głębi wznosi się powolny, harmonijny puls, który smok powtarza własnym oddechem.\n\nPrzez chwilę — człowiek, smok i jezioro — oddychacie razem.`,
            ziemia: `Smok siada przy brzegu ciężko i wpatruje się w ciemną powierzchnię jeziora. Długo. Woda jest nieruchoma. On też.\n\nPotem — z samego dna — wzrasta coś jak echo. Jakby ziemia pod jeziorem odpowiedziała na obecność smoka. Kamyczki przy brzegu drżą lekko.\n\nJezioro Snu pamięta kamień. Pamięta teraz i ciebie.`,
            powietrze: `Smok krąży nad jeziorem, a skrzydła muskają powierzchnię wody — niemal, lecz nie dotykają. Woda reaguje na każdy ruch skrzydeł, formując małe fale, które wyglądają jak litery nieznanego języka.\n\nPotem smok siada przy brzegu i składa skrzydła. Woda uspokaja się. Sojusz zawarty.`,
            swiatlo: `Gdy smok podchodzi, jezioro rozbłyska od środka — jakby pod powierzchnią ktoś zapalił tysiąc świec. Ciemna woda staje się na chwilę przezroczysta. Widać dno. Widać coś jeszcze — coś, co porusza się w głębi i patrzy.\n\nSmok pochyla głowę. Błysk gaśnie. Jezioro zapamięta.`,
            cien: `Smok nie podchodzi do brzegu — zatrzymuje się w cieniu drzew i patrzy. Jezioro jakby to czuje — na powierzchni pojawiają się kręgi bez żadnej przyczyny, odpowiadając na obecność smoka.\n\nZ wody dobiegają szepczące dźwięki, których nie możesz rozróżnić. Smok je słyszy. Odwraca się do ciebie i kiwa głową powoli.\n\nSojusz zawarty — po cichu, jak wszystko co dotyczy cienia.`,
            lod: `Twój lodowy smok podchodzi do brzegu i zatrzymuje się. Jezioro Snu i smok patrzą na siebie — dwie zimne natury, każda po swojemu spokojna.\n\nPotocznie temperatura przy brzegu spada o kilka stopni. Na powierzchni wody formuje się cienka, piękna sieć szronu — i znika. Jezioro przemówiło.\n\nSojusz zawarty — między lodem a głębią.`,
            magma: `Smok magmowy staje przy brzegu i wpatruje się w czarną wodę bez lęku. Między żywiołami kipi napięcie — ale jezioro nie cofa się. Zamiast tego, w głębinie pojawia się ciepły poblask.\n\nDwa skrajne żywioły — lawa i ciemna woda — mierzą się spokojnie. Smok prychnie iskrami, woda pochłania je bez szmeru.\n\nSojusz zawarty — żar i głębia znalazły równowagę.`,
        };
        const narration = lakeNarrations[primaryEl] || lakeNarrations['ogien'];
        box.innerHTML = `
            <div style="padding:14px; background:rgba(10,20,50,0.75); border-left:3px solid #44aaff; border-radius:8px; color:#c0d8ff; line-height:1.8; margin-bottom:14px; white-space:pre-line; font-style:italic;">
                💧 <b style="font-style:normal; color:#88ccff;">Sojusz z Jeziorem Snu</b><br><br>${narration}
            </div>
            <div style="padding:8px 14px; background:rgba(10,30,20,0.6); border-left:3px solid #44ff88; border-radius:6px; color:#66ff88; font-size:13px; margin-bottom:12px;">
                ✅ Jezioro Snu dołącza do sojuszu Serca Lasu.
            </div>
            <div class="dialog-button" onclick="openLocation('las','jezioro_snu')">Wróć do jeziora</div>
        `;
    } else if (place === 'visitedNest') {
        // Alliance with Leśny Strażnik — varies by dragon element
        const nestNarrations = {
            ogien: `Leśny Strażnik siada na najwyższej gałęzi i patrzy w dół na twojego smoka. Twój smok patrzy w górę. Żadne z nich się nie rusza.\n\nPotem smok wydaje niski, spokojny dźwięk — coś między mruczeniem a pomrukiem. Strażnik prostuje się. Przez długą chwilę trwa między nimi milcząca rozmowa w języku, którego nie znasz.\n\nW końcu Strażnik opuszcza skrzydła o kilka centymetrów. To wystarczy — wiesz, że cię zaakceptował.`,
            woda: `Leśny Strażnik wita twojego smoka wodnego z rezerwą — ale bez wrogości. Siada na niskiej gałęzi i przygląda się uważnie.\n\nSmok nurkuje ogonem w pobliskim strumieniu i tryska wodą w górę — delikatna fontanna. Strażnik chwyci kilka kropelek dziobem. Potrząsa głową z czymś w rodzaju zaskoczenia.\n\nZdecydował.`,
            ziemia: `Leśny Strażnik zlatuje nisko — tak nisko, że niemal dotyka ziemi. Twój smok pochyla głowę, a ziemia pod jego nogami lekko drżeje.\n\nStrażnik spaceruje wokół smoka raz, potem drugi raz. Zatrzymuje się naprzeciwko niego i patrzy. Długo.\n\nW końcu — bez żadnego dźwięku — odlatuje na swoje gniazdo i siada tam plecami do was. To znak, że wam ufa.`,
            powietrze: `Leśny Strażnik spada z gniazda i leci w kierunku twojego smoka z rozpostartymi skrzydłami — nie agresywnie, tylko... sprawdzająco.\n\nSmok odpowiada własnym rozpostarciem skrzydeł. Oboje zawisają w miejscu przez chwilę, skrzydło przy skrzydle, wiatr między nimi.\n\nPotem Strażnik zawraca i wraca na gałąź. Wiesz, że to koniec testu i że go zdałeś.`,
            swiatlo: `Gdy twój smok zbliża się do gniazda, Leśny Strażnik wybucha krótkim, przenikliwym krzykiem. Ale nie odlatuje.\n\nSmok świetlisty siedzi spokojnie. Z jego skóry sączy się delikatny blask. Strażnik nachyla głowę — raz, drugi — jakby chciał zobaczyć źródło światła.\n\nPotem milknie. I siedzi razem z wami w ciszy, która nie jest już wrogością.`,
            cien: `Leśny Strażnik znika z gałęzi gdy tylko twój smok się zbliża. Widzisz go potem — wysoko, między koronami, obserwujący.\n\nTwój smok nie próbuje go przywołać. Siada pod drzewem i czeka.\n\nPo długiej chwili Strażnik zlatuje cicho i siada kilka metrów od smoka. Razem patrzą w las. To wystarczy.`,
            lod: `Leśny Strażnik siada wysoko i obserwuje twojego lodowego smoka z zainteresowaniem. Smok stoi nieruchomo jak posąg z lodu — spokojny, pewny.\n\nStrażnik schodzi coraz niżej. W końcu siada na gałęzi na wysokości głowy smoka i patrzy mu prosto w oczy.\n\nZimno i dzikość — rozumieją się nawzajem. Sojusz zawarty bez słów.`,
            magma: `Leśny Strażnik wzlatuje gdy czuje żar twojego smoka magmowego. Krąży wyżej, obserwując.\n\nSmok siada i wydaje niski, spokojny pomruk. Nie groźba — zaproszenie.\n\nStrażnik powoli opada. Gorąco i dzikie — dwie siły bez obawy przed sobą. Sojusz zawarty w ogniu.`,
        };
        const narration = nestNarrations[primaryEl] || nestNarrations['ogien'];
        box.innerHTML = `
            <div style="padding:14px; background:rgba(10,30,10,0.75); border-left:3px solid #66cc44; border-radius:8px; color:#c0e0a0; line-height:1.8; margin-bottom:14px; white-space:pre-line; font-style:italic;">
                🦅 <b style="font-style:normal; color:#aaff66;">Sojusz z Leśnym Strażnikiem</b><br><br>${narration}
            </div>
            <div style="padding:8px 14px; background:rgba(10,30,20,0.6); border-left:3px solid #44ff88; border-radius:6px; color:#66ff88; font-size:13px; margin-bottom:12px;">
                ✅ Leśny Strażnik dołącza do sojuszu Serca Lasu.
            </div>
            <div class="dialog-button" onclick="openLocation('las','gniazdo_straznika')">Wróć do gniazda</div>
        `;
    }
}


function lasQuestShadowDone() {
    const qs = getLasQuestState();
    if (qs.stage !== 'stage4_shadow') return;
    qs.stage = 'stage5_shadow';
    setLasQuestState(qs);
    renderLasMgielQuest();
}

function lasQuestShadowReadyConfirm() {
    const qs = getLasQuestState();
    qs.stage = 'stage5_shadow';
    setLasQuestState(qs);
    renderLasMgielQuest();
}

function lasQuestLightReady() {
    const qs = getLasQuestState();
    qs.stage = 'stage5_light';
    setLasQuestState(qs);
    renderLasMgielQuest();
}

function lasQuestLightEnding() {
    adjustCurrency('gold', 3);
    inventory['Amulet Lasu'] = (inventory['Amulet Lasu'] || 0) + 1;
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTabFull();
    updateCurrencyDisplay();

    const qs = getLasQuestState();
    const el = qs.missionDragon || getHatchedDragonElements()[0] || 'ogien';
    const dName = qs.missionDragonName || 'Twój smok';

    const endings = {
        ogien:     `${dName} ryczy triumfalnie gdy twoje dłonie dotykają kamienia. Płomień tryska w górę niczym pochodnia — ale zamiast palić, ogrzewa. Las przyjmuje ten ogień jak dawno zgaszone ognisko. Korzenie odpowiadają ciepłem.`,
        woda:      `${dName} pochyla głowę razem z tobą. Kamień drży — i nagle przez korzenie całego lasu przepływa fala wilgoci. Mgła gęstnieje chwilowo, potem opada. Las oddycha.`,
        ziemia:    `${dName} kładzie ciężką łapę na ziemi przy ołtarzu. Drżenie idzie przez grunt. Kamień stabilizuje się, puls spowalnia do spokojnego, głębokiego rytmu — jak bicie serca starego drzewa.`,
        powietrze: `${dName} wzlatuje i krąży nad ołtarzem, skrzydłami zbierając mgłę. Las wzdycha — naprawdę wzdycha, jakby całe drzewa nabrały powietrza. Kamień gaśnie spokojnie.`,
        swiatlo:   `${dName} promieniuje blaskiem gdy twoje dłonie dotykają kamienia. Przez chwilę cały las lśni — każdy liść, każda kroplą rosy. Potem blask opada. Coś zostało uzdrowione.`,
        cien:      `${dName} wchodzi w cień między korzeniami ołtarza. Kamień na moment gaśnie — i zapala się ponownie, spokojniej. Cień i las zawarły przymierze w ciszy.`,
        lod:       `${dName} stoi nieruchomo jak posąg gdy twoje dłonie dotykają kamienia. Temperatura spada — mgła krzepnie w drobne kryształy lodu wokół was. Chwilę później topią się. Las przyjął zimno jako część siebie.`,
        magma:     `${dName} siedzi przy ołtarzu z łapą na gorącej skale. Żar smoka i żar kamienia zlewają się w jedno — ziemia pod stopami cieplejsza przez chwilę. Las odczuwa to jak dawno zapomniane słońce dochodzące przez glebę.`,
    };
    const endingText = endings[el] || endings['ogien'];

    setLasQuestState({ stage: 'done_light' });
    const box = document.getElementById('location-action-area');
    if (box) box.innerHTML = `
        <div style="padding:16px;background:rgba(10,35,20,0.9);border:2px solid #44ff88;border-radius:10px;animation:worldFadeIn 0.5s;">
            <div style="font-size:17px;font-weight:bold;color:#66ff88;margin-bottom:10px;">✅ Quest Ukończony — Droga Światła</div>
            <div style="color:#a0e8b8;font-style:italic;margin-bottom:14px;line-height:1.9;">
                ${endingText}<br><br>
                <em style="color:#88ffaa;">Las Mgieł żyje. Twoje imię jest teraz wpisane w korzenie.</em>
            </div>
            <div style="padding:10px 14px;background:rgba(10,30,20,0.6);border-left:3px solid #44ff88;border-radius:6px;color:#66ff88;font-size:13px;margin-bottom:12px;">🎁 Nagroda: +3 złoto, +Amulet Lasu</div>
            <div class="dialog-button" style="border-color:#44ff88;color:#66ff88;" onclick="openRegion('las')">← Las Mgieł</div>
        </div>`;
}

function lasQuestShadowEnding() {
    const qs = getLasQuestState();
    const el = qs.missionDragon || getHatchedDragonElements()[0] || 'ogien';
    const dName = qs.missionDragonName || 'Twój smok';

    // Use missionDragon's slot stats if known
    const missionNum = (['ogien','woda','ziemia','powietrze','swiatlo','cien','lod','magma'].indexOf(el) % 3) + 1;
    const stats = loadDragonStats(missionNum);
    const power = (stats.sila || 5) + (stats.sila_woli || 5) + (stats.szczescie || 5);
    const win = power >= 18 || Math.random() > 0.35;

    if (win) {
        adjustCurrency('gold', 5);
        inventory['Kamień Cienia'] = (inventory['Kamień Cienia'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTabFull();
        updateCurrencyDisplay();

        const shadowEndings = {
            ogien:     `${dName} wchodzi w rytualny ogień bez wahania. Płomienie i mrok lasu zderzają się — przez chwilę wszystko drży. Potem cisza. Smok wyłania się z cienia silniejszy — a las wchłonął moc, którą mu zaoferowałeś.`,
            woda:      `${dName} sięga do głębin mrocznej wody pod ołtarzem. Ciemna mgła owijała się wokół was — smok pochłaniał ją, zamieniając w lód i oddech. Las przemówił wodą.`,
            ziemia:    `${dName} wbija łapy w ziemię gdy rytuał osiąga szczyt. Korzenie ciągną mrok do głębi — smok trzyma je w miejscu siłą kamiennego spokoju. Las zapieczętowany.`,
            powietrze: `${dName} wzlatuje w sam wir mrocznej energii. Smok rozniósł ją na skrzydłach — rozproszył jak mgłę po wietrze. Las odetchnął.`,
            swiatlo:   `${dName} rozbłyska w środku mrocznego rytuału — cień i blask walczą przez sekundę. Potem blask wchłonął cień. ${dName} stoi pośród iskier, spokojny i zwycięski.`,
            cien:      `${dName} zlewa się z mrokiem lasu — nie walczy, pochłania. Ciemność lasu i ciemność smoka stają się jednym. Rytuał zakończony w absolutnej ciszy.`,
            lod:       `${dName} zamraża mrok — dosłownie. Lodowy oddech twardnieje czarną energię w kryształy, które opadają i rozsypują się w pył. Las zapieczętowany zimnem.`,
            magma:     `${dName} topi mrok gorącem. Lawa i cień — skrajności, które się znoszą. Energia rytuału pochłonięta przez żar smoka. Las oczyszczony ogniem.`,
        };
        const endingText = shadowEndings[el] || shadowEndings['ogien'];

        setLasQuestState({ stage: 'done_shadow' });
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:16px;background:rgba(20,5,40,0.9);border:2px solid #cc66ff;border-radius:10px;animation:worldFadeIn 0.5s;">
                <div style="font-size:17px;font-weight:bold;color:#cc66ff;margin-bottom:10px;">✅ Quest Ukończony — Droga Cienia</div>
                <div style="color:#c0a0e8;font-style:italic;margin-bottom:14px;line-height:1.9;">
                    ${endingText}<br><br>
                    <em style="color:#e0c8ff;">Las zapamięta to. I ty też.</em>
                </div>
                <div style="padding:10px 14px;background:rgba(20,5,40,0.6);border-left:3px solid #cc66ff;border-radius:6px;color:#cc66ff;font-size:13px;margin-bottom:12px;">🎁 Nagroda: +5 złoto, +Kamień Cienia</div>
                <div class="dialog-button" style="border-color:#cc66ff;color:#cc66ff;" onclick="openRegion('las')">← Las Mgieł</div>
            </div>`;
    } else {
        const box = document.getElementById('location-action-area');
        if (!box) return;
        if (canAfford(costToCopper(0, 5, 0))) spendCurrency(costToCopper(0, 5, 0));
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,5,20,0.9);border:2px solid #cc2244;border-radius:8px;color:#ff8899;line-height:1.8;margin-bottom:12px;">
            <b style="color:#ff4466;font-size:15px;">💀 Za słaby na Strażnika</b><br><br>
            Moc, którą pochłonąłeś, okazała się niewystarczająca. Strażnik zepchnął cię z lasu siłą, od której drżą drzewa.<br>
            Straciłeś 5 srebrnych monet rozsypanych w ucieczce.<br><br>
            <em>Rozwiń smoka i spróbuj ponownie gdy będziesz silniejszy.</em>
        </div>
        <div class="dialog-button" style="border-color:#dd2266;color:#ff6699;" onclick="lasQuestShadowReadyConfirm()">🔄 Spróbuj ponownie</div>
        <div class="dialog-button" style="border-color:#556;color:#889;margin-top:6px;" onclick="openRegion('las')">← Wycofaj się</div>`;
    }
}

/* ── Dodatkowa zawartość questowa wstrzykiwana w lokacje ─── */
/* ═══════════════════════════════════════════════════════════════
   GRA W KOŚCI — FARKLE (styl Kingdom Come Deliverance 2)
   
   Zasady:
   - Gra toczy się do 2000 pkt. Wejście na planszę wymaga min. 300 pkt w jednej turze.
   - Rzut 6 kośćmi. Gracz MUSI zabrać co najmniej jedną punktującą kość.
   - Po zabraniu kości można rzucać pozostałymi LUB zatrzymać i zabrać punkty.
   - "Gorący rzut" (hot dice) — gdy wszystkie 6 kości punktuje, bierzesz wszystkie i
     możesz rzucać od nowa wszystkimi 6.
   - Brak żadnej punktującej kości = "fiasko" — tracisz punkty rundy.
   - Przeciwnik (karczmarz) gra automatycznie wg prostej AI.
   
   Punktacja:
   - 1 oczko = 100 pkt         5 oczek = 50 pkt
   - Trójka jedynek = 1000 pkt  Trójka dowolna N = N×100 pkt
   - Czwórka = 2× trójki        Piątka = 4× trójki       Szóstka = 8× trójki
   - Trzy pary = 750 pkt        Mały szlem (1-2-3-4-5-6) = 1500 pkt
═══════════════════════════════════════════════════════════════ */

let diceState = null;

function openDiceGame() {
    const box = document.getElementById('location-action-area');
    if (!box) return;

    const opponents = [
        { name: 'Karczmarz Borek', desc: 'Rudy karczmarz odkłada ścierkę i siada naprzeciwko z szerokim uśmiechem.', skill: 0.65, portrait: '🍺' },
        { name: 'Stary Żołnierz',  desc: 'Weteran przy kominku unosi brew. — Młodemu chce się grać? Dobrze, siadaj.', skill: 0.78, portrait: '⚔️' },
        { name: 'Wędrowna Kupiec', desc: 'Kobieta w podróżnym płaszczu tasuje kostki z wprawą. — Stawka?', skill: 0.72, portrait: '💼' },
        { name: 'Pijany Szlachcic', desc: 'Szlachcic kładzie na stole garść monet. — Jeden rzut losu, co?', skill: 0.45, portrait: '🍷' },
    ];
    const opp = opponents[Math.floor(Math.random() * opponents.length)];

    box.innerHTML = `
    <div style="padding:16px;background:rgba(20,12,5,0.95);border:2px solid #8B6914;border-radius:12px;animation:worldFadeIn 0.4s;" id="dice-game-root">
        <div style="font-size:17px;font-weight:bold;color:#e8c84a;margin-bottom:6px;">🎲 Kości — Karczma Pod Smokiem</div>
        <div style="color:#b8966a;font-style:italic;margin-bottom:16px;line-height:1.6;">${opp.portrait} ${opp.desc}</div>
        <div style="background:rgba(10,6,2,0.7);border:1px solid #6B4F14;border-radius:8px;padding:14px;margin-bottom:14px;">
            <div style="color:#e8c84a;font-weight:bold;margin-bottom:8px;">Zasady gry</div>
            <div style="color:#a08050;font-size:12px;line-height:1.9;">
                🎯 Cel: pierwszy do <b style="color:#e8c84a;">2000 punktów</b><br>
                🔒 Wejście na planszę: minimum <b style="color:#e8c84a;">300 pkt</b> w jednej turze<br>
                💀 Fiasko: brak punktujących kości — tracisz punkty rundy<br>
                🔥 Gorący rzut: wszystkie 6 kości punktują — rzuć ponownie wszystkimi!<br>
                <br>
                <span style="color:#9B7840;">1 = 100 pkt &nbsp;|&nbsp; 5 = 50 pkt &nbsp;|&nbsp; Trójka = N×100 (jedynki = 1000)<br>
                Czwórka = 2× &nbsp;|&nbsp; Piątka = 4× &nbsp;|&nbsp; Szóstka = 8× &nbsp;|&nbsp; 3 pary = 750 &nbsp;|&nbsp; Szlem = 1500</span>
            </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div class="dialog-button" style="border-color:#c8a430;color:#e8c84a;flex:1;" onclick="diceGameStart('${opp.name}',${opp.skill},10)">🥉 Gra za 10 miedzi</div>
            <div class="dialog-button" style="border-color:#888;color:#aaa;flex:1;" onclick="diceGameStart('${opp.name}',${opp.skill},30)">🥈 Gra za 30 miedzi</div>
            <div class="dialog-button" style="border-color:#aaa870;color:#ffe060;flex:1;" onclick="diceGameStart('${opp.name}',${opp.skill},100)">🥇 Gra za 1 srebro</div>
        </div>
        <div class="dialog-button" style="border-color:#554;color:#887;margin-top:8px;" onclick="openLocation('miasto','karczma')">← Wróć do karczmy</div>
    </div>`;
}

function diceGameStart(oppName, oppSkill, stake) {
    if (!canAfford(stake)) {
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:12px 16px;background:rgba(20,12,5,0.9);border-left:3px solid #cc4422;border-radius:8px;color:#cc8866;font-style:italic;margin-bottom:12px;">
                — Nie masz tyle przy sobie — mówi ${oppName}. — Wróć kiedy będziesz bogatszy.
            </div>
            <div class="dialog-button" onclick="openDiceGame()">← Wróć</div>`;
        return;
    }
    spendCurrency(stake);
    updateCurrencyDisplay();

    diceState = {
        oppName, oppSkill, stake,
        playerScore: 0, oppScore: 0,
        playerOnBoard: false, oppOnBoard: false,
        turn: 'player',   // 'player' | 'opp'
        phase: 'rolling', // 'rolling' | 'selecting'
        diceCount: 6,
        rolledDice: [],
        keptDice: [],    // indices of kept dice from current roll
        keptThisTurn: [],// all kept dice values this turn
        turnPoints: 0,
        log: [`💰 Stawka: ${stake} miedzi. Grasz z ${oppName}.`, '--- Twoja tura ---'],
    };

    diceRollPlayer();
}

// ── SCORING ENGINE ────────────────────────────────────────────────

function diceScore(dice) {
    // Returns { points, valid } for a SELECTION of dice
    if (!dice.length) return { points: 0, valid: false };
    const counts = [0,0,0,0,0,0,0];
    dice.forEach(v => counts[v]++);

    // Full 6-dice combos (only valid if all 6 provided)
    if (dice.length === 6) {
        // Straight (1-2-3-4-5-6)
        if (counts.slice(1).every(c => c === 1)) return { points: 1500, valid: true };
        // Three pairs
        const pairs = counts.filter(c => c === 2).length;
        if (pairs === 3) return { points: 750, valid: true };
    }

    let pts = 0;
    for (let v = 1; v <= 6; v++) {
        const c = counts[v];
        if (c === 0) continue;
        if (c >= 3) {
            const base = v === 1 ? 1000 : v * 100;
            const mult = [0,0,0,1,2,4,8][c];
            pts += base * mult;
            const rem = 0; // handled
        } else {
            if (v === 1) pts += c * 100;
            else if (v === 5) pts += c * 50;
            else return { points: 0, valid: false }; // non-1, non-5, count < 3 = invalid selection
        }
    }
    return { points: pts, valid: pts > 0 };
}

function diceScoreAll(dice) {
    // Score all dice (for display purposes), returns total
    return diceScore(dice).points;
}

function diceHasAnyScoring(dice) {
    // Check if any single die or combination scores
    if (dice.includes(1) || dice.includes(5)) return true;
    const counts = [0,0,0,0,0,0,0];
    dice.forEach(v => counts[v]++);
    if (counts.some(c => c >= 3)) return true;
    if (dice.length === 6) {
        if (counts.slice(1).every(c => c === 1)) return true;
        if (counts.filter(c => c === 2).length === 3) return true;
    }
    return false;
}

function diceGetScoringSubsets(dice) {
    // Returns array of scoring selections for AI and hints
    // Simplified: return valid individual dice + triples
    const scoring = [];
    const counts = [0,0,0,0,0,0,0];
    dice.forEach((v,i) => counts[v]++);

    // Check full 6-dice combos first
    if (dice.length === 6) {
        const straight = counts.slice(1).every(c => c === 1);
        if (straight) return [{ indices: dice.map((_,i)=>i), points: 1500, label: 'Szlem!' }];
        const pairs = counts.filter(c => c === 2).length;
        if (pairs === 3) return [{ indices: dice.map((_,i)=>i), points: 750, label: '3 Pary' }];
    }

    for (let v = 1; v <= 6; v++) {
        const idxs = dice.map((d,i)=>d===v?i:-1).filter(i=>i>=0);
        const c = counts[v];
        if (c >= 3) {
            const base = v === 1 ? 1000 : v * 100;
            const mult = [0,0,0,1,2,4,8][c];
            scoring.push({ indices: idxs, points: base * mult, label: `${c}×${v}` });
        } else {
            if (v === 1) idxs.forEach(i => scoring.push({ indices:[i], points:100, label:'1 (100)' }));
            if (v === 5) idxs.forEach(i => scoring.push({ indices:[i], points:50,  label:'5 (50)' }));
        }
    }
    return scoring;
}

// ── RENDER HELPERS ────────────────────────────────────────────────

function diceFaceHTML(val, idx, selectable, selected, kept) {
    const faces = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];
    const isScoring = (val === 1 || val === 5);
    let bg, border, cursor = 'default', opacity = '1', scale = '';
    if (kept) {
        bg = 'rgba(60,40,10,0.8)'; border = '#664400'; opacity = '0.5';
    } else if (selected) {
        bg = 'rgba(40,60,10,0.95)'; border = '#88ee44'; scale = 'scale(1.15)';
    } else if (selectable && isScoring) {
        bg = 'rgba(20,35,10,0.8)'; border = '#66aa44'; cursor = 'pointer';
    } else if (selectable) {
        bg = 'rgba(30,20,10,0.7)'; border = '#554433'; cursor = 'pointer';
    } else {
        bg = 'rgba(15,10,5,0.8)'; border = '#333';
    }
    const onclick = selectable && !kept ? `onclick="diceToggle(${idx})"` : '';
    return `<div ${onclick} style="display:inline-flex;align-items:center;justify-content:center;
        width:52px;height:52px;font-size:32px;border-radius:10px;border:2px solid ${border};
        background:${bg};cursor:${cursor};opacity:${opacity};transform:${scale || 'scale(1)'};
        transition:transform 0.15s,border 0.1s;user-select:none;"
        title="${kept ? 'Już zabrana' : isScoring ? 'Punktuje!' : 'Nie punktuje'}"
        onmouseover="${selectable && !kept ? `this.style.transform='scale(1.1)'` : ''}"
        onmouseout="${selectable && !kept ? `this.style.transform='${scale||'scale(1)'}'` : ''}">
        ${faces[val]}</div>`;
}

function diceRenderGame() {
    const box = document.getElementById('dice-game-root');
    if (!box || !diceState) return;
    const s = diceState;
    const isPlayer = s.turn === 'player';

    // Score bars
    const pct = (score) => Math.min(100, Math.round(score / 20));
    const barColor = (score, onBoard) => score >= 2000 ? '#ffcc00' : onBoard ? '#66dd44' : '#dd8833';

    // Selected dice score preview
    const selVals = s.keptDice.map(i => s.rolledDice[i]);
    const selScore = selVals.length ? diceScore(selVals) : { points: 0, valid: false };
    const potentialTotal = s.turnPoints + selScore.points;

    // Build dice HTML
    const keptSet = new Set(s.keptDice);
    const alreadyKeptCount = s.keptThisTurn.length;
    let diceHTML = '';
    s.rolledDice.forEach((val, idx) => {
        const isKept = false; // shown separately
        diceHTML += diceFaceHTML(val, idx, isPlayer && s.phase === 'rolling', keptSet.has(idx), false);
    });

    // Already-kept dice (greyed)
    let keptHTML = '';
    s.keptThisTurn.forEach(val => {
        keptHTML += diceFaceHTML(val, -1, false, false, true);
    });

    // Log (last 5)
    const logLines = s.log.slice(-6).map(l =>
        `<div style="color:${l.startsWith('---') ? '#775533' : l.startsWith('💀') ? '#dd4444' : l.startsWith('✅') ? '#44dd88' : l.startsWith('🔥') ? '#ff9900' : '#a08060'};font-size:12px;margin-bottom:2px;">${l}</div>`
    ).join('');

    // Buttons
    let btns = '';
    if (isPlayer && s.phase === 'rolling') {
        const canKeep = selScore.valid;
        const canBank  = (potentialTotal >= 300 || s.playerOnBoard) && canKeep && potentialTotal > 0;
        btns = `
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                <div class="dialog-button" style="flex:1;${canKeep ? 'border-color:#88ee44;color:#aaf066;' : 'opacity:0.4;pointer-events:none;border-color:#444;color:#666;'}"
                    onclick="diceKeepAndRoll()">
                    🎲 Zabierz i rzuć (${selScore.points > 0 ? '+'+selScore.points+' pkt' : 'wybierz kości'})
                </div>
                <div class="dialog-button" style="flex:1;${canBank ? 'border-color:#e8c84a;color:#f0d060;' : 'opacity:0.4;pointer-events:none;border-color:#444;color:#666;'}"
                    onclick="diceBankPoints()">
                    🏦 Zatrzymaj (${potentialTotal} pkt)
                </div>
            </div>`;
    } else if (!isPlayer) {
        btns = `<div style="padding:10px;text-align:center;color:#a08050;font-style:italic;">Tura ${s.oppName}...</div>`;
    }

    box.innerHTML = `
    <div style="background:rgba(20,12,5,0.98);border:2px solid #8B6914;border-radius:12px;padding:14px;">
        <div style="font-size:15px;font-weight:bold;color:#e8c84a;margin-bottom:12px;">🎲 Kości — <span style="font-size:12px;color:#a08050;">vs ${s.oppName}</span></div>

        <!-- SCORE BARS -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div>
                <div style="color:#66dd88;font-size:12px;font-weight:bold;margin-bottom:4px;">TY ${s.playerOnBoard?'':'🔒'}</div>
                <div style="background:#1a1008;border-radius:6px;height:12px;overflow:hidden;border:1px solid #444;">
                    <div style="height:100%;width:${pct(s.playerScore)}%;background:${barColor(s.playerScore,s.playerOnBoard)};transition:width 0.4s;border-radius:6px;"></div>
                </div>
                <div style="color:#e8c84a;font-weight:bold;margin-top:2px;">${s.playerScore} / 2000</div>
            </div>
            <div>
                <div style="color:#ff8866;font-size:12px;font-weight:bold;margin-bottom:4px;">${s.oppName} ${s.oppOnBoard?'':'🔒'}</div>
                <div style="background:#1a1008;border-radius:6px;height:12px;overflow:hidden;border:1px solid #444;">
                    <div style="height:100%;width:${pct(s.oppScore)}%;background:${barColor(s.oppScore,s.oppOnBoard)};transition:width 0.4s;border-radius:6px;"></div>
                </div>
                <div style="color:#ff8866;font-weight:bold;margin-top:2px;">${s.oppScore} / 2000</div>
            </div>
        </div>

        <!-- TURA INFO -->
        <div style="background:rgba(10,6,2,0.8);border:1px solid #443322;border-radius:8px;padding:10px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="color:${isPlayer ? '#66dd88' : '#ff8866'};font-weight:bold;font-size:13px;">${isPlayer ? '▶ TWOJA TURA' : `▶ TURA: ${s.oppName}`}</span>
                <span style="color:#e8c84a;font-size:13px;">Pula: <b>${s.turnPoints}${selScore.points > 0 ? ' + ' + selScore.points : ''} pkt</b></span>
            </div>

            <!-- Już zabrane kości -->
            ${keptHTML ? `<div style="margin-bottom:8px;opacity:0.5;">${keptHTML}</div>` : ''}

            <!-- Aktywne kości -->
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">${diceHTML || '<span style="color:#665533;font-style:italic;">Czekaj...</span>'}</div>

            ${isPlayer && s.phase === 'rolling' ? `
            <div style="font-size:11px;color:#776644;margin-top:4px;">
                ${selScore.valid ? `✅ Wybór: <b style="color:#aaee66;">+${selScore.points} pkt</b>` : selVals.length ? `❌ Nieprawidłowy wybór` : 'Kliknij kości żeby wybrać'}
                ${!s.playerOnBoard && potentialTotal < 300 ? ` • 🔒 Potrzebujesz 300 pkt żeby wejść (masz ${potentialTotal})` : ''}
            </div>` : ''}
        </div>

        ${btns}

        <!-- LOG -->
        <div style="background:rgba(5,3,1,0.7);border:1px solid #332211;border-radius:6px;padding:8px;margin-top:10px;max-height:110px;overflow-y:auto;">
            ${logLines}
        </div>
    </div>`;
}

// ── PLAYER ACTIONS ────────────────────────────────────────────────

function diceRollPlayer() {
    const s = diceState;
    s.rolledDice = Array.from({length: s.diceCount}, () => Math.ceil(Math.random()*6));
    s.keptDice = [];
    s.phase = 'rolling';
    s.log.push(`🎲 Rzut ${s.diceCount} kośćmi: [${s.rolledDice.join(', ')}]`);

    if (!diceHasAnyScoring(s.rolledDice)) {
        s.turnPoints = 0;
        s.keptThisTurn = [];
        s.log.push(`💀 Fiasko! Brak punktujących kości. Stracono punkty rundy.`);
        diceRenderGame();
        setTimeout(() => {
            s.turn = 'opp';
            s.turnPoints = 0;
            s.keptThisTurn = [];
            s.diceCount = 6;
            s.log.push(`--- Tura ${s.oppName} ---`);
            diceRenderGame();
            setTimeout(diceOppTurn, 1200);
        }, 1800);
    } else {
        diceRenderGame();
    }
}

function diceToggle(idx) {
    const s = diceState;
    if (s.turn !== 'player' || s.phase !== 'rolling') return;
    const pos = s.keptDice.indexOf(idx);
    if (pos >= 0) s.keptDice.splice(pos, 1);
    else s.keptDice.push(idx);
    diceRenderGame();
}

function diceKeepAndRoll() {
    const s = diceState;
    const selVals = s.keptDice.map(i => s.rolledDice[i]);
    const sc = diceScore(selVals);
    if (!sc.valid) return;

    s.turnPoints += sc.points;
    s.keptThisTurn.push(...selVals);
    s.log.push(`✅ Zabrałeś [${selVals.join(',')}] → +${sc.points} pkt (pula: ${s.turnPoints})`);

    const remaining = s.diceCount - s.keptDice.length;

    // Hot dice — all scored, get fresh 6
    if (remaining === 0) {
        s.log.push(`🔥 Gorący rzut! Wszystkie kości punktują — rzut od nowa!`);
        s.diceCount = 6;
        s.rolledDice = [];
        s.keptDice = [];
        diceRenderGame();
        setTimeout(diceRollPlayer, 800);
        return;
    }

    s.diceCount = remaining;
    s.rolledDice = [];
    s.keptDice = [];
    diceRenderGame();
    setTimeout(diceRollPlayer, 600);
}

function diceBankPoints() {
    const s = diceState;
    const selVals = s.keptDice.map(i => s.rolledDice[i]);
    const sc = diceScore(selVals);
    if (!sc.valid && selVals.length > 0) return;

    const total = s.turnPoints + (sc.valid ? sc.points : 0);
    if (!s.playerOnBoard && total < 300) return;

    if (!s.playerOnBoard && total >= 300) {
        s.playerOnBoard = true;
        s.log.push(`🏆 Wchodzisz na planszę!`);
    }
    s.playerScore += total;
    s.log.push(`🏦 Zatrzymujesz ${total} pkt. Wynik: ${s.playerScore}/2000`);

    if (s.playerScore >= 2000) {
        diceGameEnd(true);
        return;
    }

    s.turnPoints = 0;
    s.keptThisTurn = [];
    s.diceCount = 6;
    s.turn = 'opp';
    s.log.push(`--- Tura ${s.oppName} ---`);
    diceRenderGame();
    setTimeout(diceOppTurn, 1000);
}

// ── OPPONENT AI ───────────────────────────────────────────────────

function diceOppTurn() {
    const s = diceState;
    s.keptThisTurn = [];
    s.turnPoints = 0;
    diceOppRollStep(6);
}

function diceOppRollStep(diceCount) {
    const s = diceState;
    s.diceCount = diceCount;
    const roll = Array.from({length: diceCount}, () => Math.ceil(Math.random()*6));
    s.rolledDice = roll;
    s.keptDice = [];
    s.log.push(`🎲 ${s.oppName} rzuca ${diceCount} kośćmi: [${roll.join(', ')}]`);
    diceRenderGame();

    if (!diceHasAnyScoring(roll)) {
        s.turnPoints = 0;
        s.keptThisTurn = [];
        s.log.push(`💀 ${s.oppName} — fiasko! Brak punktów.`);
        diceRenderGame();
        setTimeout(() => {
            s.turn = 'player';
            s.turnPoints = 0;
            s.keptThisTurn = [];
            s.diceCount = 6;
            s.log.push('--- Twoja tura ---');
            diceRollPlayer();
        }, 1500);
        return;
    }

    // AI decision: greedily take best scoring subset
    const subsets = diceGetScoringSubsets(roll);
    if (!subsets.length) {
        setTimeout(() => {
            s.turn = 'player';
            s.turnPoints = 0;
            s.keptThisTurn = [];
            s.diceCount = 6;
            s.log.push('--- Twoja tura ---');
            diceRollPlayer();
        }, 1200);
        return;
    }

    // Sort: take highest value subset
    subsets.sort((a,b) => b.points - a.points);
    const best = subsets[0];
    const bestVals = best.indices.map(i => roll[i]);
    s.turnPoints += best.points;
    s.keptThisTurn.push(...bestVals);
    s.log.push(`${s.oppName} bierze [${bestVals.join(',')}] → +${best.points} (pula: ${s.turnPoints})`);
    diceRenderGame();

    const remaining = diceCount - best.indices.length;
    const needsBoard = !s.oppOnBoard && s.turnPoints < 300;

    setTimeout(() => {
        // Hot dice
        if (remaining === 0) {
            s.log.push(`🔥 ${s.oppName} — gorący rzut!`);
            diceOppRollStep(6);
            return;
        }

        // AI: continue or bank?
        const shouldBank = diceOppShouldBank(s, remaining);
        if (shouldBank) {
            if (!s.oppOnBoard && s.turnPoints >= 300) {
                s.oppOnBoard = true;
                s.log.push(`${s.oppName} wchodzi na planszę!`);
            }
            if (s.oppOnBoard || s.turnPoints >= 300) {
                s.oppScore += s.turnPoints;
                s.log.push(`${s.oppName} zatrzymuje ${s.turnPoints} pkt. Wynik: ${s.oppScore}/2000`);
                s.turnPoints = 0;
                s.keptThisTurn = [];
                if (s.oppScore >= 2000) { diceGameEnd(false); return; }
                s.turn = 'player';
                s.diceCount = 6;
                s.log.push('--- Twoja tura ---');
                diceRenderGame();
                setTimeout(diceRollPlayer, 800);
            } else {
                diceOppRollStep(remaining);
            }
        } else {
            diceOppRollStep(remaining);
        }
    }, 1200);
}

function diceOppShouldBank(s, remainingDice) {
    const pts = s.turnPoints;
    const skill = s.oppSkill; // 0..1, higher = more aggressive

    // Must hit 300 to get on board
    if (!s.oppOnBoard && pts < 300) return false;
    // Very close to winning — always bank
    if (s.oppScore + pts >= 2000) return true;
    // Ahead and comfortable — tend to bank
    const lead = s.oppScore - s.playerScore;
    const riskTolerance = skill; // higher skill = take more risks for bigger score
    const bankThreshold = 300 + Math.floor((1 - riskTolerance) * 400);
    if (pts >= bankThreshold && remainingDice <= 2) return true;
    if (pts >= bankThreshold + 200) return Math.random() > riskTolerance * 0.5;
    if (pts >= 500) return Math.random() > 0.3;
    return false;
}

// ── GAME END ──────────────────────────────────────────────────────

function diceGameEnd(playerWon) {
    const s = diceState;
    const box = document.getElementById('dice-game-root');
    if (!box) return;

    const winnings = playerWon ? s.stake * 2 : 0;
    if (playerWon) {
        adjustCurrency('copper', winnings);
        updateCurrencyDisplay();
    }

    const bgColor = playerWon ? 'rgba(10,35,15,0.97)' : 'rgba(35,8,8,0.97)';
    const borderColor = playerWon ? '#44dd88' : '#cc3333';
    const title = playerWon ? '🏆 Wygrałeś!' : '💀 Przegrana';
    const msg = playerWon
        ? `${s.oppName} wzdycha i przesuwa monety przez stół. — Nieźle, nieźle... — mruczy. — Następnym razem moje szczęście wróci.<br><br>Wygrałeś <b style="color:#e8c84a;">${winnings} miedzi</b>!`
        : `${s.oppName} zgarnia monety z szerokim uśmiechem. — Nic osobistego, przyjacielu. Taka gra.<br><br>Straciłeś <b style="color:#cc4444;">${s.stake} miedzi</b>.`;

    box.innerHTML = `
    <div style="padding:18px;background:${bgColor};border:2px solid ${borderColor};border-radius:12px;text-align:center;animation:worldFadeIn 0.5s;">
        <div style="font-size:22px;font-weight:bold;color:${borderColor};margin-bottom:10px;">${title}</div>
        <div style="color:#c0a070;line-height:1.9;font-style:italic;margin-bottom:16px;">${msg}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;font-size:13px;color:#9B7840;background:rgba(10,6,2,0.6);padding:10px;border-radius:8px;">
            <div>Twój wynik: <b style="color:#e8c84a;">${s.playerScore}</b></div>
            <div>${s.oppName}: <b style="color:#ff8866;">${s.oppScore}</b></div>
        </div>
        <div class="dialog-button" style="border-color:#c8a430;color:#e8c84a;" onclick="openDiceGame()">🎲 Zagraj ponownie</div>
        <div class="dialog-button" style="border-color:#554;color:#887;margin-top:8px;" onclick="openLocation('miasto','karczma')">← Wróć do karczmy</div>
    </div>`;
    diceState = null;
}

/* ═══════════════════════════════════════════════════════════
   QUEST: DUCH HALYAZ - PUSTYNIA HALYAZ
   Etapy: none → offered → stage2 (znaki) → stage3_choice
          → stage4_trials → stage5_finale → done_ochrona / done_przemiana
═══════════════════════════════════════════════════════════ */

const HALYAZ_QUEST_KEY = 'halyazQuest';

function getHalyazQuestState() {
    const s = localStorage.getItem(HALYAZ_QUEST_KEY);
    return s ? JSON.parse(s) : { stage: 'none' };
}

function setHalyazQuestState(obj) {
    localStorage.setItem(HALYAZ_QUEST_KEY, JSON.stringify(obj));
}

function halyazQuestStage() {
    return getHalyazQuestState().stage || 'none';
}

function isHalyazQuestActive() {
    const s = halyazQuestStage();
    return s !== 'none' && !s.startsWith('done_');
}

function halyazQuestTrigger() {
    setHalyazQuestState({ stage: 'offered' });
    renderHalyazQuest();
}

function renderHalyazQuest() {
    const qs = getHalyazQuestState();
    const box = document.getElementById('location-action-area');
    if (!box) return;

    /* ETAP 1 — oferowanie questa */
    if (qs.stage === 'offered') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.9);border:2px solid #cc8833;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:10px;">📜 Etap 1 z 5 — Głos Pustyni</div>
            <div style="color:#e0c080;line-height:1.8;font-style:italic;margin-bottom:12px;">
                Strażniczka odkłada swoje narzędzie i patrzy na ciebie długo.<br><br>
                <em style="color:#ffdd88;">— Halyaz kiedyś żyło — mówi w końcu. — Nie jak miasto żyje. Jak istota. Oddychało piaskiem, myślało przez runy, czuło przez słońce. Potem coś się stało. Zasnęło.<br><br>
                Twój smok go poczuł — inaczej niż ty. Zwierzęta wiedzą więcej od ludzi w takich sprawach.<br><br>
                Mogę cię poprowadzić. Ale musisz chcieć iść. Czy chcesz poznać tajemnicę Halyaz?</em>
            </div>
            <div class="dialog-button" style="border-color:#cc8833;color:#ffcc66;" onclick="halyazQuestAccept()">„Tak. Chcę wiedzieć."</div>
            <div class="dialog-button" style="border-color:#665533;color:#aa8855;margin-top:6px;" onclick="openRegion('pustynia')">← Nie, może później</div>
        </div>`;
        return;
    }

    /* ETAP 2 — szukanie znaków w Ruinach */
    if (qs.stage === 'stage2') {
        const signs = qs.signsFound || 0;
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.9);border:2px solid #cc8833;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:10px;">🔍 Etap 2 z 5 — Trzy Znaki ${qs.missionDragonName ? `<span style="font-size:12px;color:${ELEMENT_COLORS[qs.missionDragon]||'#aab'};">${ELEMENT_ICONS[qs.missionDragon]||'🐉'} ${qs.missionDragonName}</span>` : ''}</div>
            <div style="color:#e0c080;line-height:1.8;font-style:italic;margin-bottom:12px;">
                Strażniczka podaje ci kawałek węgla drzewnego.<br><br>
                <em style="color:#ffdd88;">— W Ruinach Halyaz są wyryte trzy znaki. Musisz je wszystkie znaleźć i przerysować. Twój smok je rozpozna — śledź jego reakcje.</em>
            </div>
            <div style="padding:10px 12px;background:rgba(20,10,5,0.6);border-radius:8px;margin-bottom:12px;font-size:13px;line-height:2.0;">
                <span style="${signs>=1 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${signs>=1 ? '✅' : '⬜'} Znak Słońca — ${signs>=1 ? '<b>znaleziony</b>' : 'szukaj w ruinach'}</span><br>
                <span style="${signs>=2 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${signs>=2 ? '✅' : '⬜'} Znak Wiatru — ${signs>=2 ? '<b>znaleziony</b>' : 'szukaj głębiej'}</span><br>
                <span style="${signs>=3 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${signs>=3 ? '✅' : '⬜'} Znak Ognia — ${signs>=3 ? '<b>znaleziony</b>' : 'szukaj pod kolumnami'}</span>
            </div>
            ${signs >= 3
                ? `<div class="dialog-button" style="border-color:#cc8833;color:#ffcc66;" onclick="halyazSignsDone()">🌅 Wróć do Strażniczki ze znaleziskami</div>`
                : `<div class="dialog-button" style="opacity:0.45;border-color:#554;color:#776;pointer-events:none;">Znajdź wszystkie trzy znaki...</div>`
            }
            <div class="dialog-button" style="border-color:#665533;color:#aa8855;margin-top:6px;" onclick="openLocation('pustynia','ruiny_halyaz')">📍 Idź do Ruin Halyaz</div>
        </div>`;
        return;
    }

    /* ETAP 3 — wybór ścieżki */
    if (qs.stage === 'stage3_choice') {
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.9);border:2px solid #cc8833;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:10px;">⚖️ Etap 3 z 5 — Wybór</div>
            <div style="color:#e0c080;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Strażniczka bierze trzy narysowane znaki i układa je na ołtarzu. Reagują na siebie — tworzą wzór.<br><br>
                <em style="color:#ffdd88;">— Halyaz może się obudzić na dwa sposoby. Droga Ochrony — przywrócimy je takim jakim było, strażnikiem równowagi. Droga Przemiany — Halyaz obudzi się inne, silniejsze, ale zmienione na zawsze.<br><br>
                Obydwie są prawdziwe. Obydwie mają cenę.</em>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
                <div style="padding:12px;background:rgba(20,40,20,0.6);border:1px solid #44aa66;border-radius:8px;">
                    <div style="color:#66ff88;font-weight:bold;margin-bottom:6px;">☀️ Droga Ochrony</div>
                    <div style="color:#90c0a0;font-size:12px;line-height:1.6;">Halyaz budzi się jako strażnik. Las, pustynia i góry pozostają w równowadze. Spokojniejsza droga.</div>
                </div>
                <div style="padding:12px;background:rgba(40,15,10,0.6);border:1px solid #cc4422;border-radius:8px;">
                    <div style="color:#ff6644;font-weight:bold;margin-bottom:6px;">🔥 Droga Przemiany</div>
                    <div style="color:#c09080;font-size:12px;line-height:1.6;">Halyaz budzi się przemienione — potężniejsze, ale nieprzewidywalne. Większa nagroda, większe ryzyko.</div>
                </div>
            </div>
            <div class="dialog-button" style="border-color:#44aa66;color:#66ff88;" onclick="halyazChooseOchrona()">☀️ Droga Ochrony</div>
            <div class="dialog-button" style="border-color:#cc4422;color:#ff6644;margin-top:6px;" onclick="halyazChoosePrzemiana()">🔥 Droga Przemiany</div>
        </div>`;
        return;
    }

    /* ETAP 4 — próby */
    if (qs.stage === 'stage4_trials') {
        const path = qs.path || 'ochrona';
        const t1 = qs.trialSands || false;
        const t2 = qs.trialOasis || false;
        const t3 = qs.trialCaravan || false;
        const allDone = t1 && t2 && t3;
        const pathColor = path === 'ochrona' ? '#44aa66' : '#cc4422';
        const pathName  = path === 'ochrona' ? '☀️ Droga Ochrony' : '🔥 Droga Przemiany';
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.9);border:2px solid ${pathColor};border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:10px;">🏺 Etap 4 z 5 — Trzy Próby (${pathName})</div>
            <div style="color:#e0c080;line-height:1.8;font-style:italic;margin-bottom:12px;">
                <em style="color:#ffdd88;">— Halyaz musi przetestować czy jesteś gotowy — mówi Strażniczka. — Trzy próby czekają w trzech miejscach pustyni. Idź tam, gdzie cię wezwie.</em>
            </div>
            <div style="padding:10px 12px;background:rgba(20,10,5,0.6);border-radius:8px;margin-bottom:12px;font-size:13px;line-height:2.0;">
                <span style="${t1 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${t1 ? '✅' : '⬜'} Próba Pieśni Piasku — ${t1 ? '<b>ukończona</b>' : 'Pieśń Piasku'}</span><br>
                <span style="${t2 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${t2 ? '✅' : '⬜'} Próba Oazy — ${t2 ? '<b>ukończona</b>' : 'Oaza Halim'}</span><br>
                <span style="${t3 ? 'color:#ffaa44;' : 'color:#5a4030;'}">${t3 ? '✅' : '⬜'} Próba Karawany — ${t3 ? '<b>ukończona</b>' : 'Obóz Karawany'}</span>
            </div>
            ${allDone
                ? `<div class="dialog-button" style="border-color:${pathColor};color:#ffcc66;" onclick="halyazTrialsDone()">🌅 Wszystkie próby pokonane — wróć do Strażniczki</div>`
                : `<div class="dialog-button" style="opacity:0.45;border-color:#554;color:#776;pointer-events:none;">Ukończ wszystkie trzy próby...</div>`
            }
            <div class="dialog-button" style="border-color:#665533;color:#aa8855;margin-top:6px;" onclick="openRegion('pustynia')">← Pustynia Halyaz</div>
        </div>`;
        return;
    }

    /* ETAP 5 — finał */
    if (qs.stage === 'stage5_finale') {
        const path = qs.path || 'ochrona';
        const isOchrona = path === 'ochrona';
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.9);border:2px solid #ffaa44;border-radius:10px;margin-bottom:14px;animation:worldFadeIn 0.4s;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:10px;">✨ Etap 5 z 5 — Przebudzenie</div>
            <div style="color:#e0c080;line-height:1.8;font-style:italic;margin-bottom:14px;">
                Ołtarz pulsuje mocniej niż kiedykolwiek. Gorący kamień wibruje — w powietrzu unosi się coś niewidzialnego.<br><br>
                <em style="color:#ffdd88;">— Czas. — Strażniczka cofa się o krok. — To ty musisz to dokończyć. Połóż dłoń na kamieniu. Twój smok wie co robić.</em><br><br>
                ${isOchrona
                    ? 'Czujesz spokojne ciepło emanujące z kamienia. Coś starożytnego — i życzliwego.'
                    : 'Kamień jest gorętszy niż normalnie. Coś tam wrze — niecierpliwe, silne, nieprzewidywalne.'}
            </div>
            <div class="dialog-button" style="border-color:#ffaa44;color:#ffcc66;" onclick="halyazFinale()">🌅 Połóż dłoń na kamieniu</div>
        </div>`;
        return;
    }

    /* DONE */
    if (qs.stage && qs.stage.startsWith('done_')) {
        const isOchrona = qs.stage === 'done_ochrona';
        box.innerHTML = `
        <div style="padding:14px;background:rgba(40,25,10,0.85);border:2px solid ${isOchrona ? '#44aa66' : '#cc4422'};border-radius:10px;margin-bottom:14px;">
            <div style="font-size:16px;font-weight:bold;color:#ffcc66;margin-bottom:8px;">${isOchrona ? '☀️ Halyaz Ochronione' : '🔥 Halyaz Przemienione'}</div>
            <div style="color:#e0c080;font-style:italic;line-height:1.7;">
                ${isOchrona
                    ? 'Pustynia żyje spokojnym rytmem jak dawniej. Coś starożytnego odetchnęło — i jest ci za to wdzięczne.'
                    : 'Pustynia jest inna. Ciemniejsza, gorąca, nieprzewidywalna — ale żywa. Halyaz przemienione patrzy na cię jak na część siebie.'}
            </div>
        </div>`;
        return;
    }
}

function halyazQuestAccept() {
    renderDragonPickerForQuest(
        'Wybierz smoka towarzyszącego wyprawie',
        'Halyaz przemawia przez żywioły. Który smok wyruszy z tobą w głąb pustyni?',
        '#cc8833', 'rgba(40,25,10,0.9)',
        (dragon) => {
            setHalyazQuestState({ stage: 'stage2', signsFound: 0, missionDragon: dragon.element, missionDragonName: dragon.name });
            const box = document.getElementById('location-action-area');
            const elIcon = ELEMENT_ICONS[dragon.element] || '🐉';
            const elColor= ELEMENT_COLORS[dragon.element] || '#aab';
            if (box) box.innerHTML = `
                <div style="padding:12px;background:rgba(40,25,10,0.75);border-left:3px solid #cc8833;border-radius:6px;color:#e0c080;line-height:1.7;margin-bottom:12px;font-style:italic;">
                    Strażniczka kiwa głową z powagą i spogląda na twojego smoka z uznaniem.<br><br>
                    — ${elIcon} ${dragon.name} będzie dobrym towarzyszem. Zacznij od Ruin. Trzy znaki — słońce, wiatr i ogień. Twój smok je rozpozna.
                    <div class="dialog-button" style="margin-top:10px;border-color:${elColor};color:${elColor};" onclick="openLocation('pustynia','ruiny_halyaz')">📍 Idź do Ruin Halyaz z ${dragon.name}</div>
                </div>`;
        }
    );
}

function halyazSearchSign() {
    const qs = getHalyazQuestState();
    if (qs.stage !== 'stage2') return;
    const signs = qs.signsFound || 0;
    if (signs >= 3) return;

    const qss = getHalyazQuestState();
    const primaryEl = qss.missionDragon || getHatchedDragonElements()[0] || 'ogien';

    const dragonReactions = {
        ogien:    ['Smok nagle zatrzymuje się przy kolumnie i wdycha powietrze z przejęciem — coś tu go przyciąga. Widzisz znak.', 'Smok uderza łapą w kamień i wrzeszczy — nie z bólu, z triumfu. Pod warstwą pyłu — znak.', 'Smok siada przy ruinie i wpatruje się w jedno miejsce. Gdy podchodzisz, widzisz wyryty symbol.'],
        woda:     ['Smok węszy przy ścianie i liże kamień. Ślina na symbolu — znak staje się widoczny.', 'Smok zatrzymuje się i zaczyna wydawać niski dźwięk. Drżenie powietrza ujawnia ukryty symbol.', 'Smok kręci się w kółko przy kolumnie aż w końcu siada. Pod jego łapą — znak.'],
        ziemia:   ['Smok grzebie łapą w piasku i nagle zatrzymuje się. Spod piasku wyłania się kamienny fragment ze znakiem.', 'Smok opiera się o kolumnę i nieruchomieje. Po chwili uderza ogonem w ziemię — grunt pęka, odsłaniając znak.', 'Smok wchodzi głęboko między ruiny i nie daje się ruszyć. Gdy za nim idzie, widzisz znak.'],
        powietrze:['Smok wzlatuje i krąży nad jednym miejscem. Gdzie patrzy — tam jest znak.', 'Podmuch skrzydeł smoka zdmuchuje piasek z kolumny. Pod nim — symbol.', 'Smok siada na szczycie ruiny i wskazuje dziobem. Tam jest znak.'],
        swiatlo:  ['Smok obraca się tak, że jego łuski załamują słońce wprost na jeden punkt ściany. Symbol lśni.', 'Smok mruczy i jego oczy rozświetlają się — wskazując miejsce na ścianie.', 'Smok idzie prosto do jednej kolumny i siada. Kiedy słońce pada na odpowiednim kącie, znak staje się widoczny.'],
        cien:     ['Smok znika w cieniu ruin i po chwili słyszysz głuche stuknięcie. Idąc za nim, widzisz odkryty znak.', 'Smok staje w cieniu kolumny i patrzy na jeden punkt — jakby widział przez kamień. Tam jest znak.', 'Smok podchodzi do miejsca które wyglądało na puste i siada. Pod pyłem — symbol.'],
        lod:      ['Smok chuchnie na kamień — skroplona wilgoć zamraża w symbol. Znak odkryty.', 'Smok dotyka kamienia łapą — szron rysuje kontur ukrytego znaku jak kredą.', 'Smok staje spokojnie i patrzy. Temperatura w jednym miejscu spada — tam jest znak.'],
        magma:    ['Smok uderza ogonem w ziemię — kamienie pękają, odsłaniając wyrytą płaskorzeźbę.', 'Smok liże powierzchnię skały. Ciepło jego języka stopi piasek zalepiony w ryty — znak widoczny.', 'Smok siada na ruinie z rozmachem. Kurz opada — i widzisz symbol.'],
    };

    const reactions = dragonReactions[primaryEl] || dragonReactions['ogien'];
    const reaction = reactions[signs];

    const signNames = ['Znak Słońca', 'Znak Wiatru', 'Znak Ognia'];
    qs.signsFound = signs + 1;
    setHalyazQuestState(qs);

    const box = document.getElementById('location-action-area');
    if (box) {
        box.innerHTML = `
            <div style="padding:14px;background:rgba(40,25,10,0.8);border-left:3px solid #ffaa44;border-radius:8px;color:#e0c080;line-height:1.8;margin-bottom:12px;font-style:italic;">
                🔍 <b style="font-style:normal;color:#ffcc66;">${signNames[signs]} — odnaleziony!</b><br><br>${reaction}
            </div>
            <div style="padding:8px 14px;background:rgba(20,10,5,0.6);border-left:3px solid #cc8833;border-radius:6px;color:#ffaa44;font-size:13px;margin-bottom:12px;">
                ✅ Znaki: ${qs.signsFound}/3
            </div>
            <div class="dialog-button" onclick="openLocation('pustynia','ruiny_halyaz')">Szukaj dalej w ruinach</div>
        `;
    }
}

function halyazSignsDone() {
    const qs = getHalyazQuestState();
    qs.stage = 'stage3_choice';
    setHalyazQuestState(qs);
    renderHalyazQuest();
}

function halyazChooseOchrona() {
    const qs = getHalyazQuestState();
    qs.stage = 'stage4_trials';
    qs.path = 'ochrona';
    qs.trialSands = false;
    qs.trialOasis = false;
    qs.trialCaravan = false;
    qs.trialsComplete = 0;
    setHalyazQuestState(qs);
    renderHalyazQuest();
}

function halyazChoosePrzemiana() {
    const qs = getHalyazQuestState();
    qs.stage = 'stage4_trials';
    qs.path = 'przemiana';
    qs.trialSands = false;
    qs.trialOasis = false;
    qs.trialCaravan = false;
    qs.trialsComplete = 0;
    setHalyazQuestState(qs);
    renderHalyazQuest();
}

function halyazCompleteTrial(trialKey) {
    const qs = getHalyazQuestState();
    if (qs.stage !== 'stage4_trials') return;
    qs[trialKey] = true;
    qs.trialsComplete = [qs.trialSands, qs.trialOasis, qs.trialCaravan].filter(Boolean).length;
    setHalyazQuestState(qs);
}

function halyazTrialsDone() {
    const qs = getHalyazQuestState();
    qs.stage = 'stage5_finale';
    setHalyazQuestState(qs);
    renderHalyazQuest();
}

function halyazFinale() {
    const qs = getHalyazQuestState();
    const path = qs.path || 'ochrona';
    const isOchrona = path === 'ochrona';

    qs.stage = isOchrona ? 'done_ochrona' : 'done_przemiana';
    setHalyazQuestState(qs);

    // Rewards
    if (isOchrona) {
        adjustCurrency('gold', 4);
        inventory['Kamień Halyaz'] = (inventory['Kamień Halyaz'] || 0) + 1;
        inventory['Amulet Pustyni'] = (inventory['Amulet Pustyni'] || 0) + 1;
    } else {
        adjustCurrency('gold', 5);
        inventory['Kamień Przemiany'] = (inventory['Kamień Przemiany'] || 0) + 1;
        inventory['Łuska Magmy'] = (inventory['Łuska Magmy'] || 0) + 1;
    }
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTabFull();
    updateCurrencyDisplay();

    const box = document.getElementById('location-action-area');
    if (!box) return;

    const qsf = getHalyazQuestState();
    const primaryEl = qsf.missionDragon || getHatchedDragonElements()[0] || 'ogien';

    const ochronaScenes = {
        ogien:    'Twój smok ryczy — nie z agresji, z triumfu. Płomień wybucha z jego pysk, ale zamiast parzyć, tańczy wokół ołtarza jak złota korona. Kamień gaśnie spokojnie, jakby zadanie było wykonane.',
        woda:    'Smok nisko pochyla głowę nad ołtarzem. Z kamienia wydobywa się ciepła para — spokojna, łagodna. Gdy opada, kamień jest zimniejszy. Halyaz oddycha.',
        ziemia:   'Ziemia pod stopami drży przez chwilę — i ustaje. Smok kładzie łapę na kamieniu bez lęku. Pulsowanie kamienia zwalnia do spokojnego rytmu.',
        powietrze:'Podmuch wiatru gasi żar wokół ołtarza na moment. Potem wraca — słabszy, łagodniejszy. Twój smok tańczy na skrzydłach wokół świątyni.',
        swiatlo:  'Kamień rozbłyska tak jasno, że przez chwilę nic nie widać. Gdy blask opada, całe niebo nad pustynią ma złotą poświatę. Halyaz przebudziło się w spokoju.',
        cien:     'Cień smoka pada na ołtarz i połyka blask kamienia. Przez moment jest ciemno jak w środku nocy. Potem — spokojny, żółty brzask. Halyaz oddycha.',
        lod:      'Twój lodowy smok kładzie łapę na kamieniu spokojnie. Żar ołtarza napotyka zimno smoka — i zwalnia. Puls kamienia stabilizuje się do spokojnego, równego rytmu. Jak lód pod którym płynie strumień.',
        magma:    'Magmowy smok dotyka kamienia z szacunkiem. Żar z żarem — ale tu nie ma walki. Dwa gorące oddechy zlewają się w jeden rytm. Halyaz przebudzone.',
    };

    const przemianaScenes = {
        ogien:    'Kamień eksploduje płomieniem — twój smok rzuca się w sam środek i pochłania go. Gdy wychodzi, jest wyraźnie silniejszy. Halyaz przemienione.',
        woda:     'Smok liże kamień długim strumieniem wody. Kamień syczą jak rozpalone żelazo. Gdy para opada, kamień jest ciemny jak obsydian — i żywy.',
        ziemia:   'Kamień pęka pod dotknięciem smoka — z pęknięcia wydobywa się strumień rozgrzanej magmy i pary. Smok ziemi pochłania siłę ołtarza w korzenie pustyni. Halyaz wyzwolone, nieprzewidywalne.',
        powietrze:'Smok tworzy wir nad ołtarzem. Kamień unosi się i przez chwilę wiruje — potem opada inny. Ciemniejszy. Mocniejszy.',
        swiatlo:  'Blask kamienia i blask smoka zderzają się — cały horyzont pustyni płonie przez sekundę pomarańczem. Halyaz przemienione przez światło.',
        cien:     'Cień smoka pochłania kamień bez reszty. Przez długą chwilę na ołtarzu jest tylko ciemność. Potem — coś wraca. Inne. Ciemniejsze. Silne.',
        lod:      'Smok przykrywa kamień lodem — na chwilę. Lód stopi się od środka, a kamień stygnie do obsydianu. Halyaz przemienione w coś zimnego i twardego jak wieczność.',
        magma:    'Smok wybucha — lawa zalewa ołtarz. Gdy styg, kamień zniknął, zastąpiony przez skałę wulkaniczną w kolorze krwi. Halyaz przemienione w ogień.',
    };

    const scene = isOchrona
        ? (ochronaScenes[primaryEl] || ochronaScenes['ogien'])
        : (przemianaScenes[primaryEl] || przemianaScenes['ogien']);

    const color  = isOchrona ? '#44aa66' : '#cc4422';
    const title  = isOchrona ? '☀️ Zakończenie: Droga Ochrony' : '🔥 Zakończenie: Droga Przemiany';
    const reward = isOchrona ? '+4 złoto, +Kamień Halyaz, +Amulet Pustyni' : '+5 złoto, +Kamień Przemiany, +Łuska Magmy';

    box.innerHTML = `
        <div style="padding:16px;background:rgba(30,15,5,0.9);border:2px solid ${color};border-radius:10px;animation:worldFadeIn 0.5s;">
            <div style="font-size:17px;font-weight:bold;color:#ffcc66;margin-bottom:12px;">${title}</div>
            <div style="color:#e0c080;line-height:1.9;font-style:italic;margin-bottom:14px;">${scene}</div>
            <div style="padding:10px 14px;background:rgba(20,10,5,0.7);border-left:3px solid ${color};border-radius:6px;color:#ffaa44;font-size:13px;margin-bottom:12px;">
                🎁 Nagroda: ${reward}
            </div>
            <div class="dialog-button" style="border-color:${color};color:#ffcc66;" onclick="openRegion('pustynia')">← Pustynia Halyaz</div>
        </div>`;
}

function getLasQuestInjection(locationId) {
    const qs = getLasQuestState();
    const stage = qs.stage;
    if (stage === 'none') return { extra: '', questActions: [] };

    /* Siedziba Leśnika — pokaż quest jeśli aktywny (ale nie done) */
    if (locationId === 'siedziba') {
        if (stage === 'done_light' || stage === 'done_shadow') {
            const color = stage === 'done_light' ? '#66ff88' : '#cc66ff';
            const icon  = stage === 'done_light' ? '🌿' : '🌑';
            return {
                extra: `<div style="margin:10px 0;padding:10px 14px;background:rgba(10,30,20,0.6);border-left:3px solid ${color};border-radius:6px;color:${color};font-style:italic;font-size:13px;">
                    ${icon} Quest zakończony. Leśniczka patrzy na ciebie inaczej niż wcześniej.
                </div>`,
                questActions: []
            };
        }
        if (stage === 'offered') {
            return {
                extra: `<div style="margin:10px 0;padding:10px 14px;background:rgba(10,30,20,0.65);border-left:3px solid #44aa66;border-radius:6px;color:#88ffaa;font-style:italic;font-size:13px;">
                    📜 Leśniczka czeka na twoją odpowiedź w sprawie niepokoju w lesie.
                </div>`,
                questActions: []
            };
        }
        if (isLasQuestActive()) {
            return {
                extra: `<div style="margin:10px 0;padding:10px 14px;background:rgba(10,30,20,0.65);border-left:3px solid #44aa66;border-radius:6px;color:#66cc88;font-style:italic;font-size:13px;">
                    🌲 Quest aktywny — <b>Serce Lasu Mgieł</b>
                </div>`,
                questActions: []
            };
        }
    }

    /* Ruiny — pokaż sekcję questową gdy gracz jest w etapie 2 */
    if (locationId === 'ruiny_swiatyni' && stage === 'stage2') {
        return {
            extra: `<div style="margin:10px 0;padding:10px 14px;background:rgba(20,10,50,0.7);border-left:3px solid #9944cc;border-radius:6px;color:#cc88ff;font-style:italic;font-size:13px;">
                📜 <b>Quest aktywny:</b> Leśniczka prosiła cię o zbadanie tego miejsca.
            </div>`,
            questActions: [{ label: '🔮 Zbadaj Serce Lasu (Quest)', onclick: 'renderLasMgielQuest()' }]
        };
    }

    /* Jezioro Snu i Gniazdo Strażnika — sojusze obsługiwane przez getDynamicLocationData */
    if (locationId === 'jezioro_snu' || locationId === 'gniazdo_straznika') {
        return { extra: '', questActions: [] };
    }

    /* Serce Lasu — główny hub questowy, etapy 3-5 */
    if (locationId === 'serce_lasu') {
        return { extra: '', questActions: [] }; // rendered fully by openLocation override
    }

    return { extra: '', questActions: [] };
}

/* ==========================================================
   ZAKŁADKA OCHRONA
========================================================== */

function openOchronaFromTavern() {
    if (!isOchronaMember()) {
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:12px; background:rgba(10,20,40,0.7); border-left:3px solid #4488bb; border-radius:6px; color:#c0cce0; line-height:1.7; margin-bottom:10px; font-style:italic;">
                Karczmarz wzrusza ramionami.<br><br>— Mam tu kartkę dla pewnego... ochroniarza. Ale nie wygląda mi na to, żebyś był tym kimś. Wróć jak będziesz miał odpowiednie rekomendacje.
            </div>
            <div class="dialog-button" style="border-color:#778;color:#aab;" onclick="openRegion('miasto')">← Wróć</div>
        `;
        return;
    }
    openTab('ochrona');
}

const OCHRONA_JOBS = [
    {
        id: 'ochro_kupiec',
        name: 'Eskorta kupca',
        client: 'Anonimowy kupiec',
        desc: 'Pewien kupiec chce dyskretnej eskorty przez Dzielnicę Portową. Nie pyta się po co — i ty nie pytaj.',
        duration: 3 * 60 * 1000,
        reward: { silver: 25 },
        risk: 'Niskie',
    },
    {
        id: 'ochro_magazyn',
        name: 'Pilnowanie magazynu',
        client: 'Nieznany zleceniodawca',
        desc: 'Nocna warta przy zamkniętym magazynie przy porcie. Masz nie wpuszczać nikogo. Nikt nie mówi co jest w środku.',
        duration: 8 * 60 * 1000,
        reward: { silver: 60 },
        risk: 'Średnie',
    },
    {
        id: 'ochro_dom',
        name: 'Ochrona prywatnego domostwa',
        client: 'Zamożna rodzina',
        desc: 'Bogata rodzina prosi o dyskretną ochronę przez kilka dni. Mają wrogów — nie mówią, ilu.',
        duration: 15 * 60 * 1000,
        reward: { silver: 120, gold: 1 },
        risk: 'Wysokie',
    },
    {
        id: 'ochro_spotkanie',
        name: 'Zabezpieczenie tajnego spotkania',
        client: 'Nieznana organizacja',
        desc: 'Dwóch ważnych ludzi spotka się w piwnicy gospody. Twoja rola: pilnuj drzwi i reaguj jeśli coś pójdzie nie tak.',
        duration: 6 * 60 * 1000,
        reward: { silver: 45 },
        risk: 'Średnie',
    },
];

function updateOchronaTab() {
    const div = document.getElementById('ochrona-content');
    if (!div) return;
    if (!isOchronaMember()) {
        div.innerHTML = `<p style="color:#7080a0; font-style:italic;">Ta zakładka jest zablokowana. Ukończ misję kuriera wybierając Drogę Ochrony, a następnie podejmij pracę jako ochroniarz.</p>`;
        return;
    }
    const active = localStorage.getItem('ochronaActive') === 'true';
    const endTime = Number(localStorage.getItem('ochronaEndTime') || 0);
    const now = Date.now();
    if (active && endTime > now) {
        const jobId = localStorage.getItem('ochronaJobId');
        const job = OCHRONA_JOBS.find(j => j.id === jobId) || OCHRONA_JOBS[0];
        div.innerHTML = `
            <div style="padding:16px; background:rgba(10,25,45,0.7); border:2px solid #4488bb; border-radius:10px; margin-bottom:16px; text-align:center;">
                <div style="font-size:17px; font-weight:bold; color:#88bbff; margin-bottom:6px;">🛡️ ${job.name}</div>
                <div style="color:#8090aa; font-size:13px; font-style:italic; margin-bottom:12px;">${job.desc}</div>
                <div style="font-size:30px; font-weight:bold; color:#ffcc44;" id="ochrona-countdown">...</div>
                <div style="color:#6070a0; font-size:12px; margin-top:4px;">pozostały czas zlecenia</div>
            </div>
        `;
        const tick = () => {
            const el = document.getElementById('ochrona-countdown');
            if (!el) return;
            const rem = Number(localStorage.getItem('ochronaEndTime') || 0) - Date.now();
            if (rem <= 0) { collectOchronaPay(); return; }
            el.textContent = formatTime(rem);
            setTimeout(tick, 1000);
        };
        tick();
        return;
    }
    if (active && endTime <= now) { collectOchronaPay(); return; }
    // Job selection
    let html = `
        <div style="padding:12px; background:rgba(10,20,40,0.6); border:1px solid #3a4a6a; border-radius:8px; margin-bottom:14px;">
            <p style="color:#88aacc; font-size:13px; font-style:italic; margin:0;">Sieć ochroniarzy działa w cieniu. Zlecenia trafiają przez pośredników — bez nazwisk, bez pytań. Wykonujesz robotę, dostajesz zapłatę.</p>
        </div>
    `;
    OCHRONA_JOBS.forEach(job => {
        const rewardStr = Object.entries(job.reward).map(([t,a]) => `${a} ${t}`).join(', ');
        const riskColor = job.risk === 'Niskie' ? '#66cc88' : job.risk === 'Średnie' ? '#ffcc44' : '#ff6644';
        html += `
            <div style="margin:8px 0; padding:12px; background:rgba(15,25,45,0.6); border:1px solid #3a4a7a; border-radius:8px;">
                <div style="font-weight:bold; color:#c0d0ff; margin-bottom:4px;">${job.name}</div>
                <div style="color:#6070a0; font-size:11px; margin-bottom:4px;">Zleceniodawca: <em>${job.client}</em></div>
                <div style="color:#8090aa; font-size:12px; margin-bottom:6px; line-height:1.5;">${job.desc}</div>
                <div style="font-size:12px; color:#7080aa;">
                    ⏱ ${formatTime(job.duration)} &nbsp;|&nbsp; 💰 ${rewardStr} &nbsp;|&nbsp; ⚠️ Ryzyko: <span style="color:${riskColor};">${job.risk}</span>
                </div>
                <div class="dialog-button" style="margin-top:8px; font-size:13px;" onclick="startOchronaJob('${job.id}')">Podejmij zlecenie</div>
            </div>
        `;
    });
    div.innerHTML = html;
}

function startOchronaJob(jobId) {
    const job = OCHRONA_JOBS.find(j => j.id === jobId);
    if (!job) return;
    localStorage.setItem('ochronaActive', 'true');
    localStorage.setItem('ochronaEndTime', String(Date.now() + job.duration));
    localStorage.setItem('ochronaJobId', jobId);
    updateOchronaTab();
}

function collectOchronaPay() {
    const jobId = localStorage.getItem('ochronaJobId');
    const job = OCHRONA_JOBS.find(j => j.id === jobId) || OCHRONA_JOBS[0];
    Object.entries(job.reward).forEach(([t,a]) => adjustCurrency(t, a));
    localStorage.setItem('ochronaActive', 'false');
    updateCurrencyDisplay();
    const div = document.getElementById('ochrona-content');
    if (div) {
        const rewardStr = Object.entries(job.reward).map(([t,a]) => `+${a} ${t}`).join(', ');
        div.innerHTML = `
            <div style="padding:16px; background:rgba(15,40,20,0.7); border:2px solid #44aa66; border-radius:10px; text-align:center;">
                <div style="font-size:17px; font-weight:bold; color:#66ff88; margin-bottom:8px;">✅ Zlecenie wykonane!</div>
                <div style="color:#8090aa; font-size:13px; font-style:italic;">Koperta z zapłatą czeka na ciebie u pośrednika.</div>
                <div style="font-size:22px; color:#ffcc44; margin:12px 0; font-weight:bold;">${rewardStr}</div>
                <div class="dialog-button" style="margin-top:8px;" onclick="updateOchronaTab()">Następne zlecenie</div>
            </div>
        `;
    }
}

/* ==========================================================
   ZAKŁADKA SZPIEGOWANIE
========================================================== */

const SZPIEG_MISSIONS = [
    {
        id: 'szp_obserwacja',
        name: 'Obserwacja celu',
        briefing: 'Masz śledzić pewnego urzędnika przez kilka godzin i sporządzić raport o jego kontaktach. Nie możesz dać się zauważyć.',
        duration: 5 * 60 * 1000,
        reward: { silver: 30 },
        difficulty: '★☆☆',
    },
    {
        id: 'szp_paczka',
        name: 'Dostawa bez pytań',
        briefing: 'Paczka ma trafić pod wskazany adres. Zawartość: nieznana. Jeśli pytasz — nie nadajesz się do tej roboty.',
        duration: 4 * 60 * 1000,
        reward: { silver: 20, copper: 50 },
        difficulty: '★☆☆',
    },
    {
        id: 'szp_infiltracja',
        name: 'Wejście na bankiet',
        briefing: 'Masz wejść na prywatny bankiet w Dzielnicy Honorowej pod fałszywą tożsamością i poznać nazwiska gości. Strój zapewniamy.',
        duration: 10 * 60 * 1000,
        reward: { silver: 80 },
        difficulty: '★★☆',
    },
    {
        id: 'szp_przeciek',
        name: 'Przeciek informacji',
        briefing: 'Jesteś blisko kogoś kto pracuje dla Straży. Masz zdobyć jeden dokument — bez śladu, bez wpadki. To test lojalności.',
        duration: 20 * 60 * 1000,
        reward: { gold: 2 },
        difficulty: '★★★',
    },
];

function updateSzpiegowanieTab() {
    const div = document.getElementById('szpiegowanie-content');
    if (!div) return;
    if (!isSzpiegMember()) {
        div.innerHTML = `<p style="color:#7080a0; font-style:italic;">Ta zakładka jest zablokowana. Ukończ misję kuriera wybierając Drogę Cienia, a następnie nawiąż kontakt z Siecią.</p>`;
        return;
    }
    const active = localStorage.getItem('szpiegActive') === 'true';
    const endTime = Number(localStorage.getItem('szpiegEndTime') || 0);
    const now = Date.now();
    if (active && endTime > now) {
        const jobId = localStorage.getItem('szpiegJobId');
        const job = SZPIEG_MISSIONS.find(j => j.id === jobId) || SZPIEG_MISSIONS[0];
        div.innerHTML = `
            <div style="padding:16px; background:rgba(20,10,40,0.8); border:2px solid #9944cc; border-radius:10px; text-align:center; margin-bottom:16px;">
                <div style="font-size:17px; font-weight:bold; color:#cc88ff; margin-bottom:6px;">🌑 ${job.name}</div>
                <div style="color:#7060a0; font-size:13px; font-style:italic; margin-bottom:12px;">${job.briefing}</div>
                <div style="font-size:30px; font-weight:bold; color:#aa66ff;" id="szpieg-countdown">...</div>
                <div style="color:#5a4a70; font-size:12px; margin-top:4px;">pozostały czas misji</div>
            </div>
        `;
        const tick = () => {
            const el = document.getElementById('szpieg-countdown');
            if (!el) return;
            const rem = Number(localStorage.getItem('szpiegEndTime') || 0) - Date.now();
            if (rem <= 0) { collectSzpiegPay(); return; }
            el.textContent = formatTime(rem);
            setTimeout(tick, 1000);
        };
        tick();
        return;
    }
    if (active && endTime <= now) { collectSzpiegPay(); return; }
    let html = `
        <div style="padding:12px; background:rgba(20,10,35,0.6); border:1px solid #4a2a6a; border-radius:8px; margin-bottom:14px;">
            <p style="color:#9970cc; font-size:13px; font-style:italic; margin:0;">Rozkazy przychodzą w kopertach bez nadawcy. Wykonujesz. Milczysz. Zarabiasz. Nikt nie pyta jak — ty też nie pytasz dlaczego.</p>
        </div>
    `;
    SZPIEG_MISSIONS.forEach(job => {
        const rewardStr = Object.entries(job.reward).map(([t,a]) => `${a} ${t}`).join(', ');
        html += `
            <div style="margin:8px 0; padding:12px; background:rgba(20,10,40,0.5); border:1px solid #4a2a6a; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-weight:bold; color:#c0a0ff;">${job.name}</span>
                    <span style="color:#7060a0; font-size:13px;">${job.difficulty}</span>
                </div>
                <div style="color:#7060a0; font-size:12px; margin-bottom:6px; line-height:1.5; font-style:italic;">${job.briefing}</div>
                <div style="font-size:12px; color:#6050a0;">⏱ ${formatTime(job.duration)} &nbsp;|&nbsp; 💰 ${rewardStr}</div>
                <div class="dialog-button" style="margin-top:8px; font-size:13px; border-color:#7744bb; color:#cc88ff;" onclick="startSzpiegJob('${job.id}')">Przyjmij misję</div>
            </div>
        `;
    });
    div.innerHTML = html;
}

function startSzpiegJob(jobId) {
    const job = SZPIEG_MISSIONS.find(j => j.id === jobId);
    if (!job) return;
    localStorage.setItem('szpiegActive', 'true');
    localStorage.setItem('szpiegEndTime', String(Date.now() + job.duration));
    localStorage.setItem('szpiegJobId', jobId);
    updateSzpiegowanieTab();
}

function collectSzpiegPay() {
    const jobId = localStorage.getItem('szpiegJobId');
    const job = SZPIEG_MISSIONS.find(j => j.id === jobId) || SZPIEG_MISSIONS[0];
    Object.entries(job.reward).forEach(([t,a]) => adjustCurrency(t, a));
    localStorage.setItem('szpiegActive', 'false');
    updateCurrencyDisplay();
    const div = document.getElementById('szpiegowanie-content');
    if (div) {
        const rewardStr = Object.entries(job.reward).map(([t,a]) => `+${a} ${t}`).join(', ');
        div.innerHTML = `
            <div style="padding:16px; background:rgba(20,10,40,0.8); border:2px solid #7744bb; border-radius:10px; text-align:center;">
                <div style="font-size:17px; font-weight:bold; color:#cc88ff; margin-bottom:8px;">✅ Misja zakończona</div>
                <div style="color:#7060a0; font-size:13px; font-style:italic;">Koperta z zapłatą czeka w umówionym miejscu.</div>
                <div style="font-size:22px; color:#aa66ff; margin:12px 0; font-weight:bold;">${rewardStr}</div>
                <div class="dialog-button" style="margin-top:8px; border-color:#7744bb; color:#cc88ff;" onclick="updateSzpiegowanieTab()">Następna misja</div>
            </div>
        `;
    }
}

/* ==============================================
   ZAKŁADKA WARTA
================================================ */

function unlockWartaTab() {
    localStorage.setItem('wartaUnlocked', 'true');
    const tab = document.getElementById('tab-warta');
    if (tab) tab.style.display = 'block';
}

function unlockOchronaTab() {
    localStorage.setItem('ochronaUnlocked', 'true');
    const tab = document.getElementById('tab-ochrona');
    if (tab) tab.style.display = 'block';
}

function unlockSzpiegowanieTab() {
    localStorage.setItem('szpiegowanieUnlocked', 'true');
    const tab = document.getElementById('tab-szpiegowanie');
    if (tab) tab.style.display = 'block';
}

function updateWartaTab() {
    const div = document.getElementById('warta-content');
    if (!div) return;

    const active = localStorage.getItem('wartaActive') === 'true';
    const endTime = Number(localStorage.getItem('wartaEndTime') || 0);
    const now = Date.now();

    if (active && endTime > now) {
        // Warta in progress
        const remaining = endTime - now;
        div.innerHTML = `
            <div style="padding:16px; background:rgba(30,20,10,0.7); border:2px solid #cc9900; border-radius:10px; margin-bottom:16px; text-align:center;">
                <div style="font-size:18px; font-weight:bold; color:#ffcc66; margin-bottom:8px;">⚔️ Pełnisz wartę</div>
                <div style="color:#aaa; margin-bottom:12px; font-size:13px; font-style:italic;">Stoisz przy bramie. Czas mija powoli.</div>
                <div style="font-size:32px; font-weight:bold; color:#ffaa44;" id="warta-countdown">...</div>
                <div style="color:#8090aa; font-size:12px; margin-top:4px;">pozostało</div>
            </div>
        `;
        const tick = () => {
            const el = document.getElementById('warta-countdown');
            if (!el) return;
            const rem = Number(localStorage.getItem('wartaEndTime') || 0) - Date.now();
            if (rem <= 0) { collectWartaPay(); return; }
            const m = Math.floor(rem / 60000);
            const s = Math.floor((rem % 60000) / 1000);
            el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            setTimeout(tick, 1000);
        };
        tick();
    } else if (active && endTime <= now) {
        collectWartaPay();
    } else {
        // Setup UI
        const currentVal = Number(localStorage.getItem('wartaMinutes') || 0);
        div.innerHTML = `
            <div style="padding:16px; background:rgba(10,20,40,0.6); border:1px solid #3a4a6a; border-radius:10px; margin-bottom:16px;">
                <h3 style="color:#ffcc66; margin:0 0 8px 0;">⚔️ Służba w Straży Miejskiej</h3>
                <p style="color:#9ab; font-size:13px; margin-bottom:16px;">Wybierz czas warty. Za każde 10 sekund służby otrzymujesz 10 srebra.</p>
                <div style="margin-bottom:14px;">
                    <label style="color:#aab; font-size:13px; display:block; margin-bottom:8px;">Czas warty: <b id="warta-display" style="color:#ffcc66;">${currentVal} minut</b></label>
                    <input type="range" id="warta-slider" min="0" max="12" step="1" value="${currentVal}"
                        style="width:100%; accent-color:#cc9900; cursor:pointer;"
                        oninput="syncWartaInput(this.value)">
                    <div style="display:flex; justify-content:space-between; color:#6070a0; font-size:11px; margin-top:4px;">
                        <span>0</span><span>3</span><span>6</span><span>9</span><span>12 min</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                    <label style="color:#aab; font-size:13px;">Lub wpisz ręcznie:</label>
                    <input type="number" id="warta-input" min="0" max="12" value="${currentVal}"
                        style="width:70px; background:#0a1428; border:1px solid #3a4a6a; color:#e0e8ff; border-radius:4px; padding:4px 8px; font-size:14px;"
                        oninput="syncWartaSlider(this.value)">
                    <span style="color:#6070a0; font-size:13px;">minut</span>
                </div>
                <div style="padding:10px; background:rgba(30,40,20,0.5); border-radius:6px; margin-bottom:12px; font-size:13px; color:#aab;">
                    💰 Zarobek: <b style="color:#ffcc66;">${currentVal > 0 ? (currentVal * 60 * 10) : 0} srebrnych</b> za ${currentVal} min warty
                </div>
                <div class="dialog-button" ${currentVal === 0 ? 'style="opacity:0.4;pointer-events:none;"' : ''} id="warta-start-btn" onclick="startWarta()">⚔️ Rozpocznij wartę</div>
            </div>
        `;
    }
}

function syncWartaInput(val) {
    val = Math.max(0, Math.min(12, Number(val)));
    localStorage.setItem('wartaMinutes', val);
    const inp = document.getElementById('warta-input');
    const disp = document.getElementById('warta-display');
    const btn = document.getElementById('warta-start-btn');
    const earn = document.querySelector('#warta-content [style*="Zarobek"] b');
    if (inp) inp.value = val;
    if (disp) disp.textContent = val + ' minut';
    if (btn) { btn.style.opacity = val === 0 ? '0.4' : '1'; btn.style.pointerEvents = val === 0 ? 'none' : 'auto'; }
    if (earn) earn.textContent = (val * 60 * 10) + ' srebrnych';
}

function syncWartaSlider(val) {
    val = Math.max(0, Math.min(12, Number(val)));
    localStorage.setItem('wartaMinutes', val);
    const slider = document.getElementById('warta-slider');
    if (slider) slider.value = val;
    syncWartaInput(val);
}

function startWarta() {
    const mins = Number(localStorage.getItem('wartaMinutes') || 0);
    if (mins <= 0) return;
    localStorage.setItem('wartaActive', 'true');
    localStorage.setItem('wartaEndTime', String(Date.now() + mins * 60 * 1000));
    localStorage.setItem('wartaMins', String(mins));
    updateWartaTab();
}

function collectWartaPay() {
    const mins = Number(localStorage.getItem('wartaMins') || 0);
    const silver = mins * 60 * 10; // 10 silver per 10s = 60 per minute
    adjustCurrency('silver', silver);
    localStorage.setItem('wartaActive', 'false');
    updateCurrencyDisplay();
    const div = document.getElementById('warta-content');
    if (div) {
        div.innerHTML = `
            <div style="padding:16px; background:rgba(20,40,15,0.7); border:2px solid #44cc66; border-radius:10px; margin-bottom:16px; text-align:center;">
                <div style="font-size:18px; font-weight:bold; color:#66ff88; margin-bottom:8px;">✅ Warta zakończona!</div>
                <div style="color:#aaa; font-size:13px;">Kapitan kiwa głową z uznaniem.</div>
                <div style="font-size:24px; color:#ffcc44; margin:12px 0; font-weight:bold;">+${silver} srebrnych</div>
                <div class="dialog-button" style="margin-top:8px;" onclick="updateWartaTab()">Kolejna warta</div>
            </div>
        `;
    }
}

function updateSidebarTabs() {
    if (isGuardMember()   || localStorage.getItem('wartaUnlocked')       === 'true') { const t = document.getElementById('tab-warta');         if (t) t.style.display = 'block'; }
    if (isOchronaMember() || localStorage.getItem('ochronaUnlocked')     === 'true') { const t = document.getElementById('tab-ochrona');        if (t) t.style.display = 'block'; }
    if (isSzpiegMember()  || localStorage.getItem('szpiegowanieUnlocked') === 'true') { const t = document.getElementById('tab-szpiegowanie');   if (t) t.style.display = 'block'; }
}

/* ==============================================
   REGENERACJA SMOKÓW — 10% HP/MANA/ZMĘCZENIE CO MINUTĘ
================================================ */


function calcRegenETA(current, max, regenPctPerMin) {
    if (current >= max) return null;
    const missing = max - current;
    const perMin = Math.max(1, Math.round(max * regenPctPerMin));
    const minsNeeded = Math.ceil(missing / perMin);
    const eta = new Date(Date.now() + minsNeeded * 60 * 1000);
    const h = eta.getHours().toString().padStart(2, '0');
    const m = eta.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function renderVitalsLine(vitals, maxHP, maxMana) {
    const hpFull = vitals.hp >= maxHP;
    const manaFull = vitals.mana >= maxMana;
    const fatigueDone = vitals.fatigue <= 0;

    const hpETA = calcRegenETA(vitals.hp, maxHP, 0.10);
    const manaETA = calcRegenETA(vitals.mana, maxMana, 0.10);
    // Fatigue: loses 10/min
    const fatigueETA = vitals.fatigue > 0 ? (() => {
        const minsNeeded = Math.ceil(vitals.fatigue / 10);
        const eta = new Date(Date.now() + minsNeeded * 60 * 1000);
        return eta.getHours().toString().padStart(2,'0') + ':' + eta.getMinutes().toString().padStart(2,'0');
    })() : null;

    const hpColor = hpFull ? '#aab' : '#ff6699';
    const manaColor = manaFull ? '#aab' : '#6699ff';
    const fatigueColor = fatigueDone ? '#aab' : '#ffaa44';

    return `<span style="color:${hpColor};">❤️ ${vitals.hp}/${maxHP}${hpETA ? ` <span style="font-size:11px; color:#ff99bb;">(pełne o ${hpETA})</span>` : ''}</span>
        &nbsp;|&nbsp;
        <span style="color:${manaColor};">💧 ${vitals.mana}/${maxMana}${manaETA ? ` <span style="font-size:11px; color:#99bbff;">(pełna o ${manaETA})</span>` : ''}</span>
        &nbsp;|&nbsp;
        <span style="color:${fatigueColor};">😴 ${vitals.fatigue}/100${fatigueETA ? ` <span style="font-size:11px; color:#ffcc88;">(0 o ${fatigueETA})</span>` : ''}</span>`;
}

function startDragonRegenLoop() {
    // Regen loop: 1 minute
    setInterval(() => {
        [1, 2, 3].forEach(num => {
            const heats = num === 1 ? eggHeats : num === 2 ? secondEggHeats : thirdEggHeats;
            if (heats < 3) return;
            const unlocked = num === 1 ? true : num === 2 ? secondDragonUnlocked : thirdDragonUnlocked;
            if (!unlocked) return;

            const stats = loadDragonStats(num);
            const vitals = loadDragonVitals(num);
            const maxHP = getDragonMaxHP(stats);
            const maxMana = getDragonMaxMana(stats);

            let changed = false;
            if (vitals.hp < maxHP) {
                vitals.hp = Math.min(maxHP, Math.round(vitals.hp + maxHP * 0.10));
                changed = true;
            }
            if (vitals.mana < maxMana) {
                vitals.mana = Math.min(maxMana, Math.round(vitals.mana + maxMana * 0.10));
                changed = true;
            }
            if (vitals.fatigue > 0) {
                vitals.fatigue = Math.max(0, Math.round(vitals.fatigue - 10));
                changed = true;
            }
            if (changed) saveDragonVitals(num, vitals);
        });
    }, 60 * 1000);

    // Mission complete check every 5 seconds (no full home re-render)
    setInterval(() => {
        checkMissionCompleteNotification();
    }, 5000);
}

function checkMissionCompleteNotification() {
    let anyComplete = false;
    [1, 2, 3].forEach(num => {
        const mission = loadDragonMission(num);
        if (mission && Date.now() >= mission.endTime) anyComplete = true;
    });
    let btn = document.getElementById('tab-dragons-btn');
    if (!btn) {
        document.querySelectorAll('.tab').forEach(t => {
            if (t.textContent.trim() === 'Smoki') btn = t;
        });
    }
    if (btn) {
        if (anyComplete) {
            btn.style.background = 'linear-gradient(#1a4a0a, #0a2a05)';
            btn.style.borderColor = '#66ff44';
            btn.style.color = '#99ff66';
            btn.style.boxShadow = '0 0 8px rgba(100,255,50,0.4)';
            btn.setAttribute('data-mission-complete', 'true');
        } else if (btn.getAttribute('data-mission-complete') === 'true') {
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            btn.removeAttribute('data-mission-complete');
        }
    }
}

/* ==============================================
   WALKA NA ARENIE — GRACZ DECYDUJE (INTERAKTYWNA)
================================================ */

let _pendingCombat = null; // { dragonNum, enemy, dragonHP, mana, stats, equipBonus }

function startInteractiveFight(dragonNum) { startInteractiveFightVs(dragonNum, 0); }
function startInteractiveFightVs(dragonNum, opponentIndex) {
    const fightsDone = loadArenaFights(dragonNum);
    if (fightsDone >= 3) { alert('Ten smok walczył już 3 razy dzisiaj. Wróć jutro.'); return; }
    const vitals = loadDragonVitals(dragonNum);
    if (vitals.fatigue >= 80) { alert('Smok jest zbyt zmęczony (zmęczenie ≥80). Pozwól mu odpocząć.'); return; }
    const mission = loadDragonMission(dragonNum);
    if (mission) { alert('Smok jest na misji. Nie może teraz walczyć.'); return; }

    const stats = loadDragonStats(dragonNum);
    const equipBonus = getEquipmentStatBonus(dragonNum);
    const opponent = ARENA_OPPONENTS[Math.min(opponentIndex ?? fightsDone, ARENA_OPPONENTS.length - 1)];
    const enemyMaxHP = opponent.wytrzymalosc * 10 + 30;

    _pendingCombat = {
        dragonNum,
        enemy: { ...opponent, hp: enemyMaxHP, maxHP: enemyMaxHP },
        dragonHP: vitals.hp,
        dragonMana: vitals.mana,
        stats,
        equipBonus,
        round: 1,
    };

    incrementArenaFights(dragonNum);
    vitals.fatigue = Math.min(100, vitals.fatigue + 10);
    saveDragonVitals(dragonNum, vitals);

    renderCombatScreen();
}

function renderCombatScreen() {
    const box = document.getElementById('location-action-area');
    if (!box || !_pendingCombat) return;
    const c = _pendingCombat;
    const spells = loadDragonSpells(c.dragonNum);
    const dragonName_local = c.dragonNum === 1 ? dragonName : c.dragonNum === 2 ? secondDragonName : thirdDragonName;
    const element = c.dragonNum === 1 ? chosenDragon : c.dragonNum === 2 ? secondDragonElement : thirdDragonElement;

    const effectiveSila = (c.stats.sila || 5) + (c.equipBonus.sila || 0);
    const effectiveWytr = (c.stats.wytrzymalosc || 5) + (c.equipBonus.wytrzymalosc || 0);
    const dragonMaxHP = getDragonMaxHP(c.stats);

    const elementSpells = DRAGON_SPELLS[element] || [];
    const knownSpells = elementSpells.filter(s => spells.includes(s.id));

    const hpPct = Math.round((c.dragonHP / dragonMaxHP) * 100);
    const enemyHpPct = Math.round((c.enemy.hp / c.enemy.maxHP) * 100);

    box.innerHTML = `
        <div style="background:rgba(10,5,20,0.9); border:1px solid #4a2a6a; border-radius:10px; padding:14px;">
            <div style="font-size:14px; font-weight:bold; color:#cc99ff; margin-bottom:10px; text-align:center;">⚔️ WALKA — Runda ${c.round}</div>
            
            <!-- Dragon HP bar -->
            <div style="margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#aab; margin-bottom:3px;">
                    <span>${dragonName_local}</span><span>❤️ ${c.dragonHP}/${dragonMaxHP} | 💧 ${c.dragonMana}</span>
                </div>
                <div style="height:8px; background:#1a0a2a; border-radius:4px; overflow:hidden;">
                    <div style="width:${hpPct}%; height:100%; background:linear-gradient(#cc4488,#ff66aa); transition:0.3s;"></div>
                </div>
            </div>
            
            <!-- Enemy HP bar -->
            <div style="margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#aab; margin-bottom:3px;">
                    <span>${c.enemy.name}</span><span>❤️ ${c.enemy.hp}/${c.enemy.maxHP}</span>
                </div>
                <div style="height:8px; background:#1a0a2a; border-radius:4px; overflow:hidden;">
                    <div style="width:${enemyHpPct}%; height:100%; background:linear-gradient(#cc2200,#ff4422); transition:0.3s;"></div>
                </div>
            </div>
            
            <!-- Actions -->
            <div style="font-size:12px; color:#8090aa; margin-bottom:8px;">Co robi ${dragonName_local}?</div>
            <div class="dialog-button" onclick="combatAction('claw')">🐾 Atak Pazurami (${Math.floor(effectiveSila * 2 + effectiveWytr * 0.5)} - ${Math.floor(effectiveSila * 3 + effectiveWytr * 0.5)} obrażeń)</div>
            ${knownSpells.length > 0 ? knownSpells.map(sp => {
                const intel = c.stats.inteligencja || 5;
                let rangeStr = '';
                if (sp.isHeal) {
                    rangeStr = `💚 leczy ${sp.heal[0]}–${sp.heal[1]} HP`;
                } else if (sp.dmgMult) {
                    rangeStr = `${Math.floor(intel * sp.dmgMult[0])}–${Math.floor(intel * sp.dmgMult[1])} obrażeń`;
                }
                return `<div class="dialog-button" ${c.dragonMana < sp.manaCost ? 'style="opacity:0.5;pointer-events:none;"' : ''} onclick="combatAction('spell','${sp.id}')">
                    ✨ ${sp.name} <span style="font-size:11px; color:#aab;">(mana: ${sp.manaCost} | ${rangeStr})${c.dragonMana < sp.manaCost ? ' — brak many' : ''}</span>
                </div>`;
            }).join('') : ''}
            <div class="dialog-button" style="border-color:#cc4422;color:#ff8866;" onclick="combatAction('flee')">🏃 Uciekaj</div>
        </div>
    `;
}

function combatAction(action, spellId) {
    if (!_pendingCombat) return;
    const c = _pendingCombat;
    const effectiveSila = (c.stats.sila || 5) + (c.equipBonus.sila || 0);
    const effectiveWytr = (c.stats.wytrzymalosc || 5) + (c.equipBonus.wytrzymalosc || 0);
    const effectiveZrec = (c.stats.zrecznosc || 5) + (c.equipBonus.zrecznosc || 0);

    let dmgToEnemy = 0;
    let dmgToDragon = 0;
    let actionLog = '';

    if (action === 'flee') {
        _pendingCombat = null;
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:12px; color:#ffaa44; font-style:italic;">Smok ucieka z areny. Brak nagrody.</div>
            <div class="dialog-button" onclick="renderArenaContent('smocza')">← Wróć do Areny</div>
        `;
        updateHomeTab();
        return;
    }

    if (action === 'claw') {
        dmgToEnemy = Math.floor(effectiveSila * (1.5 + Math.random()) + effectiveWytr * 0.3);
        dmgToDragon = Math.floor(c.enemy.sila * (0.8 + Math.random() * 0.5));
        actionLog = `Smok atakuje pazurami! Zadaje ${dmgToEnemy} obrażeń.`;
    } else if (action === 'spell') {
        const element = c.dragonNum === 1 ? chosenDragon : c.dragonNum === 2 ? secondDragonElement : thirdDragonElement;
        const elementSpells = DRAGON_SPELLS[element] || [];
        const spell = elementSpells.find(s => s.id === spellId);
        if (spell && c.dragonMana >= spell.manaCost) {
            c.dragonMana -= spell.manaCost;
            const intel = c.stats.inteligencja || 5;
            if (spell.isHeal) {
                const healAmt = Math.floor(spell.heal[0] + Math.random() * (spell.heal[1] - spell.heal[0]));
                const dragonMaxHP = getDragonMaxHP(c.stats);
                c.dragonHP = Math.min(dragonMaxHP, c.dragonHP + healAmt);
                if (spell.dodge) {
                    dmgToDragon = 0;
                    actionLog = `${spell.name}! Smok leczy ${healAmt} HP i unika ataku!`;
                } else {
                    dmgToDragon = Math.floor(c.enemy.sila * (0.5 + Math.random() * 0.3));
                    actionLog = `${spell.name}! Smok leczy ${healAmt} HP.`;
                }
                dmgToEnemy = 0;
            } else if (spell.dmgMult) {
                dmgToEnemy = Math.floor(intel * (spell.dmgMult[0] + Math.random() * (spell.dmgMult[1] - spell.dmgMult[0])));
                // Drain: steal 10% of damage as HP
                if (spell.drain) {
                    const stolen = Math.floor(dmgToEnemy * 0.10);
                    c.dragonHP = Math.min(c.dragonHP + stolen, getDragonMaxHP(loadDragonStats(c.dragonNum)));
                    combatLog.push(`💜 Drenaż: +${stolen} HP`);
                }
                // Shield: absorb next hit (stored as flag)
                if (spell.shield) {
                    localStorage.setItem('dragonShield_' + c.dragonNum, 'true');
                    combatLog.push(`🛡️ Tarcza Światła aktywna — następny cios pochłonięty!`);
                }
                dmgToDragon = Math.floor(c.enemy.sila * (0.5 + Math.random() * 0.3));
                actionLog = `${spell.name}! Zadaje ${dmgToEnemy} obrażeń magicznych.`;
            }
        }
    }

    // Apply dodge from zrecznosc
    const dodgeChance = Math.min(0.3, effectiveZrec * 0.02);
    if (Math.random() < dodgeChance) {
        dmgToDragon = 0;
        actionLog += ' Smok unika kontrataku!';
    }

    c.enemy.hp = Math.max(0, c.enemy.hp - dmgToEnemy);
    c.dragonHP = Math.max(0, c.dragonHP - dmgToDragon);
    c.round++;

    // Check end conditions
    if (c.enemy.hp <= 0) {
        // Victory
        const stats = loadDragonStats(c.dragonNum);
        const raisableStat = ['sila','wytrzymalosc','zrecznosc','inteligencja','sila_woli'][Math.floor(Math.random() * 5)];
        stats[raisableStat]++;
        saveDragonStats(c.dragonNum, stats);
        adjustCurrency('silver', 1);

        // Update dragon vitals
        const vitals = loadDragonVitals(c.dragonNum);
        vitals.hp = Math.max(1, c.dragonHP);
        vitals.mana = c.dragonMana;
        saveDragonVitals(c.dragonNum, vitals);

        _pendingCombat = null;
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:14px; background:rgba(20,40,15,0.8); border:1px solid #44cc66; border-radius:8px; color:#99ffaa; line-height:1.7; margin-bottom:12px; font-style:italic;">
                <b style="color:#66ff88; font-size:15px;">🏆 ZWYCIĘSTWO!</b><br>
                ${actionLog}<br>
                Smok pokonał ${c.enemy.name}!<br>
                +1 srebro | +1 ${STAT_LABELS[raisableStat]}
            </div>
            <div class="dialog-button" onclick="renderArenaContent('smocza')">← Wróć do Areny</div>
        `;
        updateHomeTab();
        return;
    }

    if (c.dragonHP <= 0) {
        // Defeat
        const vitals = loadDragonVitals(c.dragonNum);
        vitals.hp = 1;
        vitals.mana = c.dragonMana;
        saveDragonVitals(c.dragonNum, vitals);
        _pendingCombat = null;
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:14px; background:rgba(40,10,10,0.8); border:1px solid #cc2200; border-radius:8px; color:#ff8866; line-height:1.7; margin-bottom:12px; font-style:italic;">
                <b style="color:#ff4422; font-size:15px;">💀 PORAŻKA</b><br>
                Smok pada. ${c.enemy.name} wygrał. Brak nagrody.
            </div>
            <div class="dialog-button" onclick="renderArenaContent('smocza')">← Wróć do Areny</div>
        `;
        updateHomeTab();
        return;
    }

    // Continue combat
    _pendingCombat = c;
    const box = document.getElementById('location-action-area');
    if (box) {
        // Show round log then re-render
        const logDiv = document.createElement('div');
        logDiv.style.cssText = 'padding:8px 12px; background:rgba(20,10,40,0.6); border-left:3px solid #9966cc; border-radius:4px; color:#cc99ff; font-size:13px; margin-bottom:8px; font-style:italic;';
        logDiv.textContent = `Runda ${c.round-1}: ${actionLog} Wróg zadał ${dmgToDragon} obrażeń.`;
        renderCombatScreen();
        const actionArea = document.getElementById('location-action-area');
        if (actionArea) actionArea.insertBefore(logDiv, actionArea.firstChild);
    }
}

/* ==============================================
   TOOLTIP CECH SMOKA Z EKWIPUNKIEM
================================================ */

function renderStatWithBonus(statKey, baseValue, equipBonus) {
    const bonus = equipBonus[statKey] || 0;
    const total = baseValue + bonus;
    const label = STAT_LABELS[statKey] || statKey;

    if (bonus === 0) {
        return `<span style="color:#8090aa;">${label}: <b>${total}</b></span>`;
    }

    // Build tooltip content
    const tooltipId = `tooltip-${statKey}-${Date.now().toString(36)}`;
    const tooltipContent = `${label}: ${baseValue} bazowe + ${bonus} z ekwipunku = ${total}`;

    return `<span style="color:#55ee88; cursor:help; position:relative;"
        onmouseenter="showStatTooltip(this, '${statKey}', ${baseValue})"
        onmouseleave="hideStatTooltip()"
        onclick="toggleStatTooltip(this, '${statKey}', ${baseValue})"
    >${label}: <b style="color:#66ff99;">${total}</b> <span style="font-size:11px; color:#44bb66;">+${bonus}</span></span>`;
}

let _tooltipEl = null;
let _tooltipLocked = false;

function showStatTooltip(el, statKey, baseValue) {
    if (_tooltipLocked) return;
    _createTooltip(el, statKey, baseValue);
}

function hideStatTooltip() {
    if (_tooltipLocked) return;
    if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
}

function toggleStatTooltip(el, statKey, baseValue) {
    if (_tooltipLocked && _tooltipEl) {
        _tooltipEl.remove(); _tooltipEl = null; _tooltipLocked = false;
    } else {
        _tooltipLocked = true;
        _createTooltip(el, statKey, baseValue);
    }
}

function _createTooltip(el, statKey, baseValue) {
    if (_tooltipEl) { _tooltipEl.remove(); }
    const tooltip = document.createElement('div');
    tooltip.id = 'stat-tooltip';
    tooltip.style.cssText = `
        position: fixed; z-index: 9999; background: rgba(5,10,25,0.97);
        border: 1px solid #44cc88; border-radius: 8px; padding: 10px 14px;
        font-size: 12px; color: #c0e0c0; min-width: 200px; box-shadow: 0 4px 20px rgba(0,100,50,0.4);
        pointer-events: none;
    `;

    // Find dragonNum from context (crude but works)
    let dragonNum = 1;
    let parent = el.parentElement;
    for (let i = 0; i < 10; i++) {
        if (!parent) break;
        const onclick = parent.getAttribute && parent.getAttribute('onclick');
        if (onclick && onclick.includes('handleUnequip(2')) { dragonNum = 2; break; }
        if (onclick && onclick.includes('handleUnequip(3')) { dragonNum = 3; break; }
        parent = parent.parentElement;
    }

    const equipment = loadDragonEquipment(dragonNum);
    const label = STAT_LABELS[statKey] || statKey;
    let rows = `<div style="font-weight:bold; color:#66ff99; margin-bottom:6px; border-bottom:1px solid #1a3a2a; padding-bottom:4px;">${label}</div>`;
    rows += `<div style="display:flex; justify-content:space-between; gap:16px; margin:2px 0;"><span>Bazowa:</span><span style="color:#c0e0c0;">${baseValue}</span></div>`;

    let totalBonus = 0;
    Object.values(equipment).forEach(item => {
        if (!item || !item.stats || !item.stats[statKey]) return;
        const val = item.stats[statKey];
        totalBonus += val;
        rows += `<div style="display:flex; justify-content:space-between; gap:16px; margin:2px 0;"><span style="color:#9ab;">${item.name}:</span><span style="color:#66ff99;">+${val}</span></div>`;
    });

    rows += `<div style="display:flex; justify-content:space-between; gap:16px; margin-top:6px; border-top:1px solid #1a3a2a; padding-top:4px; font-weight:bold;"><span>Łącznie:</span><span style="color:#66ff99;">${baseValue + totalBonus}</span></div>`;
    tooltip.innerHTML = rows;

    const rect = el.getBoundingClientRect();
    tooltip.style.left = Math.min(rect.right + 8, window.innerWidth - 220) + 'px';
    tooltip.style.top = Math.max(8, rect.top - 10) + 'px';
    document.body.appendChild(tooltip);
    _tooltipEl = tooltip;

    if (_tooltipLocked) {
        // Click outside closes it
        setTimeout(() => {
            document.addEventListener('click', function closeTooltip(e) {
                if (!e.target.closest('#stat-tooltip') && !e.target.closest('[onmouseenter*="showStatTooltip"]')) {
                    if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
                    _tooltipLocked = false;
                    document.removeEventListener('click', closeTooltip);
                }
            });
        }, 10);
    }
}


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
                    { label: "💰 Sprzedaj zapasy", action: "sellAtFoodMerchant", desc: "Handlarka skupuje nadwyżki jedzenia i ziół." },
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
                    { label: "💰 Sprzedaj łupy", action: "sellAtSmith", desc: "Brag skupuje rudy, stare bronie i trofea z wypraw." },
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
                    { label: "❓ Zapytaj o pracę", action: "offerHelp", desc: "Może Straż potrzebuje kogoś do pomocy?" },
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
                    { label: "🎲 Zagraj w kości", action: "playDice", desc: "Zaproś kogoś do partyjki kości." },
                    { label: "🛡️ Zlecenia ochrony", action: "openOchronaFromTavern", desc: "Tablica z prywatnymi zleceniami dla ochroniarzy." },
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
                    { label: "❓ Zapytaj o niepokój w lesie", action: "startLasMgielQuest", desc: "Leśniczka wspominała, że coś jest nie tak." },
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
            },
            {
                id: "serce_lasu",
                label: "Serce Lasu — Mroczna Polana",
                icon: "🫀",
                lockedDesc: `Ścieżka między drzewami jest niemal niewidoczna — jakby las nie chciał cię tu przepuszczać. Mgła jest tutaj najgęstsza.\n\nMożesz wejść głębiej, ale nie wiesz po co. Coś tu jest — czujesz to. Ale jeszcze nie wiesz co.\n\nPorozmawiaj z Leśniczką, by dowiedzieć się więcej.`,
                desc: `Docierasz do miejsca, gdzie las zmienia swój charakter. Drzewa są tu starsze — grubsze, milczące, poprzerastane luminescencyjnym mchem. Mgła formuje się w kształty, które prawie przypominają twarze.\n\nPośrodku polany stoi kamienny ołtarz. Na nim — pulsujący ciemny kamień.\n\nTo jest Serce Lasu.`,
                requiresQuestStage: 'stage2',
                actions: [
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
    },

    pustynia: {
        label: 'Pustynia Halyaz',
        icon: '🏜️',
        firstVisitDesc: `Pustynia Halyaz rozciąga się przed tobą jak morze ognia. Czerwony piasek skrzy się w słońcu, a gorące powietrze drga nad wydmami. Starożytne ruiny sterczą z piasku jak kości zapomnianego olbrzyma. Mówią, że ta ziemia pamięta czasy, kiedy smoki i ludzie walczyli o każdą oazę.

Wiatr przynosi zapach przypraw i dymu z karawany gdzieś na horyzoncie. Dokąd się udasz?`,
        desc: 'Czerwony piasek Halyaz wita cię żarem i ciszą. Gdzieś w oddali drżą wydmy w upale. Dokąd tym razem?',
        locations: [
            {
                id: 'oboz_karawany',
                label: 'Obóz Karawany',
                icon: '⛺',
                desc: `Pośród wydm stoi niewielki obóz — kilka namiotów z grubego, barwionego płótna, stajnia z wielbłądami i ognisko. Kupcy karawany pochodzą z różnych stron — ich języki mieszają się z dymem i zapachem przypraw.\n\nPrzywódca karawany, stary mężczyzna o wypalonym słońcem obliczu, siada właśnie przy ogniu i wpatruje się w horyzont.`,
                actions: [
                    { label: 'Porozmawiaj z przywódcą', action: 'talkCaravanLeader' },
                    { label: 'Handluj z kupcami', action: 'tradeCaravan' },
                    { label: 'Odpoczni przy ognisku', action: 'restFire' },
                    { label: 'Zapytaj o pustynię', action: 'askDesert' },
                    { label: 'Zawróć', action: 'back' }
                ]
            },
            {
                id: 'ruiny_halyaz',
                label: 'Ruiny Halyaz',
                icon: '🏛️',
                desc: `Sterczące z piasku kolumny i połamane łuki — wszystko, co zostało z niegdyś wielkiego miasta. Kamienie mają dziwne zabarwienie, jakby przez wieki absorbowały żar. Wiatr w ruinach wydaje dźwięk przypominający głosy.\n\nNa jednej z ocalałych ścian widać wyrytą wielką mapę — ale połowa jest zakryta piaskiem.`,
                actions: [
                    { label: 'Zbadaj wyrytą mapę', action: 'studyMap' },
                    { label: 'Szukaj artefaktów', action: 'searchRuins' },
                    { label: 'Wejdź do podziemnego przejścia', action: 'enterPassage' },
                    { label: 'Posłuchaj wiatru w kolumnach', action: 'listenWind' },
                    { label: 'Zawróć', action: 'back' }
                ]
            },
            {
                id: 'oaza_halyaz',
                label: 'Oaza Halim',
                icon: '🌴',
                desc: `Zielona wyspa pośrodku czerwonego morza piasku. Palmy rzucają cień na małe jeziorko o wodzie tak przejrzystej, że widać dno — mozaikę kamieni w kolorach bursztynu i bieli. Przy brzegu siedzą kilka osób — pielgrzymi i wędrowcy.\n\nSzepczą, że oaza posiada moc — woda uzdrawia, ale tylko tych, którzy naprawdę potrzebują.`,
                actions: [
                    { label: 'Napij się wody', action: 'drinkOasis' },
                    { label: 'Porozmawiaj z pielgrzymami', action: 'talkPilgrims' },
                    { label: 'Odpoczni w cieniu', action: 'restOasis' },
                    { label: 'Szukaj skarbów pod wodą', action: 'searchOasis' },
                    { label: 'Zawróć', action: 'back' }
                ]
            },
            {
                id: 'pieklo_piasku',
                label: 'Pieśń Piasku',
                icon: '🌀',
                desc: `Ogromne pole wydm w sercu pustyni, gdzie piasek wieje przez cały czas — nawet gdy indziej jest zupełny bezwiatr. Tutejszy wiatr niesie dźwięki: melodie, szepty, rzadko — wyraźne słowa.\n\nMówią, że duchy dawnych mieszkańców Halyaz wciąż wędruję po tym miejscu, szukając drogi do spokoju.`,
                actions: [
                    { label: 'Wsłuchaj się w szepty', action: 'listenSands' },
                    { label: 'Próbuj odczytać dźwięki', action: 'decodeSands' },
                    { label: 'Idź dalej w wir', action: 'enterSandStorm' },
                    { label: 'Zawróć', action: 'back' }
                ]
            },
            {
                id: 'swiatynia_slonca',
                label: 'Świątynia Słońca',
                icon: '☀️',
                desc: `Na szczycie najwyższej wydmy stoi świątynia — pół zakopana, ale wciąż stojąca. Dach dawno runął, ale centralny ołtarz z kamienia przetrwał tysiąclecia. Na ołtarzu leży kamień tak gorący, że świeci nawet w dzień.\n\nStrażnik świątyni — stara kobieta o srebrnych oczach — siedzi przy wejściu i rzeźbi coś w piasku.`,
                actions: [
                    { label: 'Porozmawiaj ze Strażniczką', action: 'talkSunGuardian' },
                    { label: 'Dotknij gorącego kamienia', action: 'touchSunStone' },
                    { label: 'Złóż ofiarę na ołtarzu', action: 'makeOffering' },
                    { label: '❓ Zapytaj o tajemnicę pustyni', action: 'startHalyazQuest' },
                    { label: 'Zawróć', action: 'back' }
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

function openRegionOriginal(regionKey) {
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


/* ==========================================================
   DYNAMICZNE OPISY LOKACJI (zmieniają się po wykonaniu questów)
========================================================== */
function getDynamicLocationData(regionKey, locationId) {
    const lasStage = lasQuestStage();
    const runeStage = getRuneQuestStage();
    const lasQS = getLasQuestState();

    const BACK = [{ label: 'Zawróć', action: 'back' }];

    // ─────────────────────────────────────────────────────
    // LAS MGIEŁ
    // ─────────────────────────────────────────────────────

    if (regionKey === 'las') {

        // SIEDZIBA LEŚNIKA
        if (locationId === 'siedziba') {
            if (lasStage === 'done_light') {
                return {
                    desc: `Chata Leśniczki wygląda spokojniej niż kiedykolwiek. Na progu leżą świeże kwiaty — nie suszone, żywe. Leśniczka wita cię ciepłym spojrzeniem, jakby czekała właśnie na ciebie.\n\n— Las dziękuje — mówi po prostu. — I ja też.`,
                    actions: [
                        { label: 'Porozmawiaj o przyszłości lasu', action: 'talkForesterDoneLight' },
                        { label: 'Zapytaj o ścieżki', action: 'askPaths' },
                        { label: 'Kup zioła (8 miedzi)', action: 'buyHerbs' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow') {
                return {
                    desc: `Chata wygląda tak samo jak zawsze, ale Leśniczka siedzi inaczej — plecami do lasu, jakby nie chciała na niego patrzeć. Słyszysz ją dopiero gdy jesteś blisko.\n\n— Zrobiłeś co uważałeś za słuszne — mówi bez osądzania. — Las będzie żył dalej. Inaczej. Ale będzie żył.`,
                    actions: [
                        { label: 'Zapytaj jak się czuje', action: 'talkForesterDoneShadow' },
                        { label: 'Zapytaj o ścieżki', action: 'askPaths' },
                        { label: 'Kup zioła (8 miedzi)', action: 'buyHerbs' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'offered') {
                return {
                    desc: `Leśniczka stoi przy progu zamiast siedzieć. Ręce ma złożone, wzrok niespokojny. Kiedy cię widzi, coś w jej twarzy rozluźnia się — tylko trochę.\n\n— Wróciłeś. Dobrze. Powiedz, co postanowiłeś.`,
                    actions: [
                        { label: '📜 Odpowiedz w sprawie lasu (Quest)', action: 'startLasMgielQuest' },
                        { label: 'Zapytaj o ścieżki', action: 'askPaths' },
                        { label: 'Kup zioła (8 miedzi)', action: 'buyHerbs' },
                        ...BACK
                    ]
                };
            }
            // stage === 'none': show quest button only if dragon hatched
            if (lasStage === 'none') {
                const dragonReady = hasAnyHatchedDragon();
                return {
                    desc: `Pośród drzew stoi mała chata — solidna, choć omszała. Przy progu suszone zioła i pęki piór. Leśnik — stara kobieta o bystych oczach — siedzi przed domem i ceruje skórzane ubranie. Nie odwraca głowy, ale wie, że jesteś.`,
                    actions: [
                        { label: 'Porozmawiaj z Leśniczką', action: 'talkForester' },
                        ...(dragonReady ? [{ label: '❓ Zapytaj o niepokój w lesie', action: 'startLasMgielQuest' }] : []),
                        { label: 'Zapytaj o ścieżki', action: 'askPaths' },
                        { label: 'Kup zioła (8 miedzi)', action: 'buyHerbs' },
                        ...BACK
                    ]
                };
            }
            if (lasStage !== 'none') {
                // quest in progress
                return {
                    desc: `Leśniczka jest w środku — drzwi uchylone. Słyszysz jak przerzuca jakieś księgi. Kiedy wchodzisz, unosi głowę.\n\n— Wróciłeś. Jak sprawy?`,
                    actions: [
                        { label: '📋 Sprawdź postęp questu', action: 'startLasMgielQuest' },
                        { label: 'Zapytaj o ścieżki', action: 'askPaths' },
                        { label: 'Kup zioła (8 miedzi)', action: 'buyHerbs' },
                        ...BACK
                    ]
                };
            }
        }

        // JEZIORO SNU
        if (locationId === 'jezioro_snu') {
            if (lasStage === 'done_light' || (lasStage === 'stage5_light' && lasQS.visitedLake)) {
                return {
                    desc: `Jezioro Snu lśni dzisiaj inaczej — woda nie jest już czarna jak atrament, lecz głęboka i ciemnoniebieskawa, jak nocne niebo tuż przed świtem. Niebieskie kwiaty na brzegu są otwarte szerzej niż normalnie.\n\nMasz wrażenie, że jezioro cię zna. I że jest spokojne z tego powodu.`,
                    actions: [
                        { label: 'Napij się wody', action: 'drinkLake' },
                        { label: 'Posiedź w ciszy', action: 'sitLake' },
                        { label: 'Zbierz niebieskie kwiaty', action: 'pickFlowers' },
                        { label: '💧 Pomedytuj nad wodą', action: 'meditateByLake' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow' || (lasStage === 'stage5_shadow')) {
                return {
                    desc: `Jezioro Snu jest nieruchome jak lustro ze szkła. Woda jest jeszcze ciemniejsza niż przedtem — prawie nieprzezroczysta. Niebieskie kwiaty na brzegu pochyliły się ku powierzchni, jakby chciały zajrzeć w głąb.\n\nTwoje odbicie w wodzie nie uśmiecha się razem z tobą.`,
                    actions: [
                        { label: 'Wpatruj się w odbicie', action: 'throwStone' },
                        { label: 'Posiedź w ciszy', action: 'sitLake' },
                        { label: 'Zbierz niebieskie kwiaty', action: 'pickFlowers' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'stage4_light') {
                const allianceDone = lasQS.visitedLake;
                return {
                    desc: allianceDone
                        ? `Jezioro Snu lśni spokojnie. Woda przyjmuje cię jak kogoś znajomego — sojusz jest zawarty i czujesz to.`
                        : `Jezioro Snu leży ciche w zagłębieniu lasu. Ale dziś jest coś innego — na powierzchni wody pojawiają się i znikają delikatne kręgi, choć nic jej nie dotyka.\n\nCzujesz, że Serce Lasu chce żebyś tu był. To nie przypadek, że tu trafiłeś.`,
                    actions: allianceDone
                        ? [
                            { label: 'Napij się wody', action: 'drinkLake' },
                            { label: 'Posiedź w ciszy', action: 'sitLake' },
                            { label: 'Zbierz niebieskie kwiaty', action: 'pickFlowers' },
                            ...BACK
                          ]
                        : [
                            { label: '💧 Nawiąż sojusz z jeziorem (Quest)', action: 'allianceLake' },
                            { label: 'Posiedź w ciszy', action: 'sitLake' },
                            { label: 'Zbierz niebieskie kwiaty', action: 'pickFlowers' },
                            ...BACK
                          ]
                };
            }
        }

        // POLANA URODZAJU
        if (locationId === 'polana_urodzaju') {
            if (lasStage === 'done_light') {
                return {
                    desc: `Polana jest jaśniejsza niż kiedykolwiek. Trawa zdaje się rosnąć szybciej, kwiaty otwierają się szeroko, a stare drzewo w centrum wydaje się... wyższe. Jakby ulżono mu ciężaru.\n\nPowietrze ma smak po burzy — czyste, zelektryzowane, żywe.`,
                    actions: [
                        { label: 'Zbieraj jagody', action: 'gatherBerries' },
                        { label: 'Zbieraj zioła', action: 'gatherHerbs' },
                        { label: 'Usiądź pod drzewem', action: 'sitTree' },
                        { label: '🌿 Poczuj puls lasu', action: 'digDirt' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow') {
                return {
                    desc: `Polana jest nadal zielona, ale coś się tu zmieniło. Cień drzewa jest dłuższy niż powinien być o tej porze. Owady brzęczą ciszej. Kwiaty są otwarte, ale blade.\n\nLas żyje. Ale inaczej.`,
                    actions: [
                        { label: 'Zbieraj jagody', action: 'gatherBerries' },
                        { label: 'Zbieraj zioła', action: 'gatherHerbs' },
                        { label: 'Usiądź pod ciemnym drzewem', action: 'sitTree' },
                        ...BACK
                    ]
                };
            }
            if (lasStage !== 'none' && lasStage !== 'offered') {
                return {
                    desc: `Polana jest jasna i spokojna — ale wiesz już, że gdzieś głębiej w lesie nie jest tak dobrze. Drzewo pośrodku stoi nieruchomo. Czekasz, czy poczujesz coś więcej.\n\nNa razie — cisza.`,
                    actions: [
                        { label: 'Zbieraj jagody', action: 'gatherBerries' },
                        { label: 'Zbieraj zioła', action: 'gatherHerbs' },
                        { label: 'Usiądź pod drzewem', action: 'sitTree' },
                        { label: 'Baw się z robakami', action: 'digDirt' },
                        ...BACK
                    ]
                };
            }
        }

        // RUINY LEŚNEJ ŚWIĄTYNI
        if (locationId === 'ruiny_swiatyni') {
            if (lasStage === 'done_light') {
                return {
                    desc: `Ruiny wyglądają inaczej odkąd wszystko się rozstrzygnęło. Chwasty nadal oplatają kamienie, ale symbol na ołtarzu — ten skrzydlaty kształt — teraz delikatnie lśni zielonkawym blaskiem. Jakby coś tu wróciło do równowagi.\n\nJeszcze kilka dni temu powietrze tu było ciężkie. Teraz jest... spokojne.`,
                    actions: [
                        { label: 'Pomedytuj przy ołtarzu', action: 'examineAltar' },
                        { label: 'Zostaw ofiarę wdzięczności', action: 'leaveOffering' },
                        { label: 'Przeszukaj ruiny', action: 'searchRuins' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow') {
                return {
                    desc: `Ruiny są ciemniejsze niż pamiętasz. Symbol na ołtarzu — ten skrzydlaty kształt — pulsuje lekko fioletowym blaskiem, ledwo widocznym. Chwasty wokół kamieni zdają się gęstsze.\n\nMiejsce to zna twoją decyzję. I akceptuje ją.`,
                    actions: [
                        { label: 'Zbadaj ołtarz', action: 'examineAltar' },
                        { label: 'Przeszukaj ruiny', action: 'searchRuins' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'stage2' || lasStage === 'stage3_choice' || lasStage.startsWith('stage4') || lasStage.startsWith('stage5')) {
                return {
                    desc: `Kamienne kolumny stoją jak zawsze, ale teraz patrzysz na nie inaczej — wiedząc, że to starożytna świątynia Serca Lasu. Symbol na ołtarzu jest teraz dla ciebie czytelniejszy: skrzydlate stworzenie ma dwa oblicza — jedno obrócone ku słońcu, drugie ku cieniu.\n\nZrozumiałeś coś, czego nie wiedziałeś jeszcze tydzień temu.`,
                    actions: [
                        { label: 'Zbadaj ołtarz (ponownie)', action: 'examineAltar' },
                        { label: 'Zostaw ofiarę', action: 'leaveOffering' },
                        { label: 'Przeszukaj ruiny', action: 'searchRuins' },
                        ...BACK
                    ]
                };
            }
        }

        // GNIAZDO LEŚNEGO STRAŻNIKA
        if (locationId === 'gniazdo_straznika') {
            if (lasStage === 'done_light' || (lasQS.visitedNest && lasStage.startsWith('stage'))) {
                return {
                    desc: `Kiedy podchodzisz, z gniazda dobiega głęboki, spokojny krzyk — nie ostrzegawczy, raczej powitanie. Leśny Strażnik wyprostowuje się i patrzy na ciebie przez długą chwilę.\n\nPoznaje cię. Jesteście po tej samej stronie.`,
                    actions: [
                        { label: 'Obserwuj Strażnika', action: 'observeNest' },
                        { label: 'Zostaw pożywienie pod gniazdem', action: 'climbTree' },
                        { label: 'Odejdź spokojnie', action: 'sneakAway' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow') {
                return {
                    desc: `Gniazdo jest puste. Na gałęziach zostały tylko resztki traw i kilka piór. Leśny Strażnik odleciał — może czuł zmianę w lesie. Może po prostu wybrał inne miejsce.\n\nPusty konar kołysze się lekko.`,
                    actions: [
                        { label: 'Zbadaj puste gniazdo', action: 'observeNest' },
                        { label: 'Zbierz pióro', action: 'climbTree' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'stage4_light') {
                const allianceDone = lasQS.visitedNest;
                return {
                    desc: allianceDone
                        ? `Gniazdo Strażnika jest spokojne. Leśny Strażnik rozpoznaje twojego smoka i ciebie — sojusz jest zawarty.`
                        : `Odgłos skrzydeł w koronach jest bliższy niż zwykle. Coś czeka. Serce Lasu wskazało ci to miejsce — Leśny Strażnik może być kluczowym sojusznikiem.`,
                    actions: allianceDone
                        ? [
                            { label: 'Obserwuj Strażnika', action: 'observeNest' },
                            { label: 'Zostaw pożywienie', action: 'climbTree' },
                            { label: 'Odejdź spokojnie', action: 'sneakAway' },
                            ...BACK
                          ]
                        : [
                            { label: '🦅 Nawiąż sojusz ze Strażnikiem (Quest)', action: 'allianceNest' },
                            { label: 'Zostań w miejscu i obserwuj', action: 'observeNest' },
                            { label: 'Odejdź cicho', action: 'sneakAway' },
                            ...BACK
                          ]
                };
            }
            if (lasStage !== 'none' && lasStage !== 'offered') {
                return {
                    desc: `Odgłos skrzydeł w koronach jest bliższy niż zwykle. Gniazdo wydaje się... inne. Jakby ktoś je niedawno powiększył albo przemeblował.\n\nLeśny Strażnik patrzy na ciebie z dołu — spokojniej niż ostatnim razem.`,
                    actions: [
                        { label: 'Zostań w miejscu i obserwuj', action: 'observeNest' },
                        { label: 'Wspinaj się ostrożnie', action: 'climbTree' },
                        { label: 'Odejdź cicho', action: 'sneakAway' },
                        ...BACK
                    ]
                };
            }
        }

        // WODOSPAD MILCZENIA
        if (locationId === 'wodospad') {
            if (lasStage === 'done_light') {
                return {
                    desc: `Wodospad śpiewa dziś głośniej — rytmicznie, jakby w radości. Mgła nad wodą jest bielsza, niemal świetlista. Za kaskadą widzisz teraz wyraźniej rysunki na kamieniach — i rozpoznajesz wśród nich symbol podobny do tego z ołtarza w ruinach.\n\nMalowidła są pradawne, ale jedno z nich wygląda jakby ktoś je niedawno odświeżył.`,
                    actions: [
                        { label: 'Wejdź za wodospad', action: 'behindWaterfall' },
                        { label: 'Napełnij bukłak', action: 'fillFlask' },
                        { label: 'Zbadaj odnowione malowidła', action: 'examineDrawings' },
                        { label: 'Posłuchaj wodospadu', action: 'listenWaterfall' },
                        ...BACK
                    ]
                };
            }
            if (lasStage === 'done_shadow') {
                return {
                    desc: `Wodospad szumi przytłumiony, jakby opłakiwał coś. Mgła jest gęstsza niż zwykle i wyjątkowo zimna. Rysunki na kamieniach za kaskadą wyglądają inaczej — jedna ze scen wydaje się teraz przedstawiać stworzenie wchodzące w mrok, nie wychodzące z niego.\n\nCzy zawsze tak wyglądała?`,
                    actions: [
                        { label: 'Wejdź za wodospad', action: 'behindWaterfall' },
                        { label: 'Napełnij bukłak', action: 'fillFlask' },
                        { label: 'Zbadaj malowidła', action: 'examineDrawings' },
                        ...BACK
                    ]
                };
            }
        }
    } // end las

    // ─────────────────────────────────────────────────────
    // GÓRY SARAK — KSIĘŻYCOWA BRAMA
    // ─────────────────────────────────────────────────────

    if (regionKey === 'gory' && locationId === 'ksiezycowa_brama') {
        if (runeStage === 'sketch' || runeStage === 'readFirst') {
            return {
                desc: `Kamienna brama stoi tak samo jak zawsze — ale teraz masz przy sobie szkicownik. Wiesz już jak wyglądają runy z bliska. Bibliotekarz czeka na twój szkic.\n\nPatrzysz na symbole i próbujesz odtworzyć każdy detal. Jeden z nich — centralny — jest chyba najstarszy. Głębszy niż reszta.`,
                actions: [
                    { label: '📝 Naszkicuj runy (Quest)', action: 'examineRunes' },
                    { label: 'Dotknij bramy', action: 'touchGate' },
                    ...BACK
                ]
            };
        }
        if (runeStage === 'readBooks' || runeStage === 'delivered') {
            return {
                desc: `Stoisz przed bramą z nową wiedzą. Bibliotekarz badał twój szkic — może już wie coś więcej. Runy wyglądają teraz znajomiej, choć nadal są dla ciebie tajemnicą.\n\nŚrodkowy symbol. Ten o którym bibliotekarz pisał ostatnio.`,
                actions: [
                    { label: 'Wpatrz się w środkowy symbol', action: 'examineRunes' },
                    { label: 'Dotknij bramy', action: 'touchGate' },
                    { label: 'Przejdź przez bramę', action: 'enterGate' },
                    ...BACK
                ]
            };
        }
        if (runeStage === 'fragment_hunt') {
            return {
                desc: `Fragmenty dawnych ksiąg gdzieś tu są — ukryte między skałami wschodniej ściany. Bibliotekarz mówił o dwóch kawałkach pergaminu, które zaginęły wiele lat temu.\n\nPatrzysz na skały wokół bramy z nowym wzrokiem. Tym razem nie szukasz run — szukasz resztek stron.`,
                actions: [
                    { label: '🔍 Szukaj fragmentów wśród skał', action: 'examineRunes' },
                    { label: 'Zbadaj runy', action: 'touchGate' },
                    { label: 'Przejdź przez bramę', action: 'enterGate' },
                    ...BACK
                ]
            };
        }
        if (runeStage === 'translated' || runeStage === 'researchDone' || runeStage === 'researchAcknowledged') {
            const moonOpen = getMoonGateStatus().open;
            return {
                desc: `Stoisz przed bramą i — po raz pierwszy — rozumiesz co tu jest napisane. Lewa runa: <em>wejście</em>. Prawa: <em>powrót</em>. Środkowa: <em>warunek</em>.\n\n${moonOpen
                    ? 'Dziś pełnia. Runy drżą cicho, pulsując srebrnym blaskiem. Brama jest otwarta.'
                    : 'Nie jest pełnia. Runy są zimne i milczące. Brama czeka.'}`,
                actions: [
                    { label: 'Zbadaj runy (znasz już ich znaczenie)', action: 'examineRunes' },
                    { label: 'Dotknij bramy', action: 'touchGate' },
                    { label: 'Przejdź przez bramę', action: 'enterGate' },
                    ...BACK
                ]
            };
        }
        if (runeStage === 'done') {
            return {
                desc: `Brama. Już ją znasz — każdą runę, każdy rysunek. Środkowy symbol: <em>warunek</em>. Wiesz, że otwiera się tylko w pełni.\n\nBrama milczy dziś. Ale ty już wiesz jak mówić jej językiem.`,
                actions: [
                    { label: 'Przejdź przez bramę', action: 'enterGate' },
                    { label: 'Poobserwuj runy', action: 'examineRunes' },
                    ...BACK
                ]
            };
        }
    }

    // ─────────────────────────────────────────────────────
    // GÓRY SARAK — SZCZYT
    // ─────────────────────────────────────────────────────
    if (regionKey === 'gory' && locationId === 'szczyt') {
        const hasSketchbook = getRuneQuestStage() !== 'none';
        if (hasSketchbook) {
            return {
                desc: `Szczyt Sarak jest miejscem między niebem a ziemią. Stoisz nad chmurami. Poniżej widać całe Astorveil — małe jak model z drewna. Wiatr szarpie ubraniem.\n\nZ tej wysokości widzisz też coś, czego nie widać z dołu — po wschodnim zboczu, przy Księżycowej Bramie, gra dziwne, subtelne światło. Nawet w ciągu dnia.`,
                actions: [
                    { label: 'Medytuj na szczycie', action: 'meditateTop' },
                    { label: 'Obserwuj Księżycową Bramę z góry', action: 'watchHorizon' },
                    { label: 'Przeszukaj skalne szczeliny', action: 'searchCracks' },
                    { label: 'Przywołaj smoka', action: 'callDragon' },
                    ...BACK
                ]
            };
        }
    }

    // PUSTYNIA HALYAZ
    if (regionKey === 'pustynia') {
        const hqs = getHalyazQuestState();
        const hs = hqs.stage || 'none';

        if (locationId === 'swiatynia_slonca') {
            if (hs === 'none') {
                const hasDragon = hasAnyHatchedDragon();
                return {
                    desc: `Na szczycie najwyższej wydmy stoi świątynia — pół zakopana, ale wciąż stojąca. Centralny ołtarz z kamienia promieniuje żarem. Strażniczka o srebrnych oczach siedzi przy wejściu i rzeźbi w piasku.\n\nUnosi głowę gdy podchodzisz — i patrzy nie na ciebie, lecz na twojego smoka.`,
                    actions: [
                        { label: 'Porozmawiaj ze Strażniczką', action: 'talkSunGuardian' },
                        { label: 'Dotknij gorącego kamienia', action: 'touchSunStone' },
                        { label: 'Złóż ofiarę na ołtarzu', action: 'makeOffering' },
                        ...(hasDragon ? [{ label: '❓ Zapytaj o tajemnicę pustyni', action: 'startHalyazQuest' }] : []),
                        ...BACK
                    ]
                };
            }
            if (hs === 'offered') {
                return {
                    desc: `Strażniczka wstaje gdy cię widzi. W jej dłoni — kawałek bursztynowego kamienia.\n\n— Wróciłeś. Znaczy to, że pustynia cię przyjęła. Czy jesteś gotów dowiedzieć się co skrywa Halyaz?`,
                    actions: [
                        { label: '📜 Odpowiedz Strażniczce (Quest)', action: 'startHalyazQuest' },
                        { label: 'Dotknij gorącego kamienia', action: 'touchSunStone' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'stage2') {
                return {
                    desc: `Strażniczka kiwa głową gdy wracasz.\n\n— Ruiny przemawiają do tych, którzy umieją słuchać. Czy odnalazłeś trzy znaki na ścianach?`,
                    actions: [
                        { label: '📋 Sprawdź postęp questa', action: 'startHalyazQuest' },
                        { label: 'Dotknij gorącego kamienia', action: 'touchSunStone' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'stage3_choice') {
                return {
                    desc: `Strażniczka siedzi przy ołtarzu i czeka. Gdy wchodzisz, wstaje.\n\n— Przyszedł czas wyboru. Halyaz może mieć tylko jednego gospodarza — ogień który buduje, lub ogień który pochłania.`,
                    actions: [
                        { label: '🔆 Dokonaj wyboru (Quest)', action: 'startHalyazQuest' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'stage4_trials') {
                const t = hqs.trialsComplete || 0;
                return {
                    desc: `Strażniczka liczy palcami próby, które minąłeś.\n\n— ${t}/3 prób za tobą. Halyaz obserwuje każdy twój krok.`,
                    actions: [
                        { label: '📋 Sprawdź próby (Quest)', action: 'startHalyazQuest' },
                        { label: 'Dotknij gorącego kamienia', action: 'touchSunStone' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'stage5_finale') {
                return {
                    desc: `Ołtarz świeci intensywnie — gorący kamień pulsuje rytmicznie jak serce. Strażniczka stoi z boku.\n\n— Halyaz czeka na twój ostatni krok.`,
                    actions: [
                        { label: '✨ Wypełnij rytuał (Quest)', action: 'startHalyazQuest' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'done_ochrona') {
                return {
                    desc: `Świątynia lśni bursztynowym blaskiem. Gorący kamień na ołtarzu świeci spokojniej — jakby oddychał.\n\nStrażniczka patrzy na ciebie z uznaniem.\n\n— Halyaz będzie żył. Dzięki tobie.`,
                    actions: [
                        { label: 'Porozmawiaj ze Strażniczką', action: 'talkSunGuardianDone' },
                        { label: 'Medytuj przy ołtarzu', action: 'meditateAltar' },
                        ...BACK
                    ]
                };
            }
            if (hs === 'done_przemiana') {
                return {
                    desc: `Ołtarz jest inny niż przedtem — kamień zmienił kolor na głęboki karmazyn, ciemniejszy i zimniejszy niż wcześniej.\n\nStrażniczka siedzi z boku z oczami przymkniętymi.\n\n— Halyaz przemieniony. Nie ma powrotu — ale nowe Halyaz jest równie prawdziwe.`,
                    actions: [
                        { label: 'Porozmawiaj ze Strażniczką', action: 'talkSunGuardianDone' },
                        { label: 'Medytuj przy ołtarzu', action: 'meditateAltar' },
                        ...BACK
                    ]
                };
            }
        }

        if (locationId === 'ruiny_halyaz') {
            if (hs === 'stage2') {
                const signs = hqs.signsFound || 0;
                return {
                    desc: `Sterczące kolumny kryją więcej niż widać na pierwszy rzut oka. Na ścianach, na kamieniach, wyryte symbole — trzy z nich szczególnie się wyróżniają.\n\nOdnalazłeś już ${signs}/3 znaków Halyaz.`,
                    actions: [
                        { label: '🔍 Szukaj kolejnego znaku (Quest)', action: 'searchHalyazSign' },
                        { label: 'Zbadaj wyrytą mapę', action: 'studyMap' },
                        { label: 'Wejdź do podziemnego przejścia', action: 'enterPassage' },
                        ...BACK
                    ]
                };
            }
            if (hs !== 'none' && hs !== 'offered') {
                return {
                    desc: `Ruiny kryją wiele tajemnic — ale znaki Halyaz są już za tobą. Teraz jest tu spokojniej. Kolumny nie szumią już tak złowrogo.`,
                    actions: [
                        { label: 'Zbadaj wyrytą mapę', action: 'studyMap' },
                        { label: 'Szukaj artefaktów', action: 'searchRuins' },
                        { label: 'Wejdź do podziemnego przejścia', action: 'enterPassage' },
                        ...BACK
                    ]
                };
            }
        }

        if (locationId === 'pieklo_piasku') {
            if (hs === 'stage4_trials') {
                const t = hqs.trialsComplete || 0;
                const trialDone = hqs.trialSands || false;
                return {
                    desc: `Wir piasku jest intensywniejszy niż zwykle — jakby wiedział, że tu jesteś. Duchy Halyaz obserwują cię z każdej strony.\n\n${trialDone ? '✅ Próba Pieśni Piasku — ukończona.' : '⬜ Próba Pieśni Piasku czeka — musisz wsłuchać się w głos pustyni.'}`,
                    actions: [
                        ...(!trialDone ? [{ label: '🌀 Staw czoła Próbie Piasku (Quest)', action: 'trialSands' }] : []),
                        { label: 'Wsłuchaj się w szepty', action: 'listenSands' },
                        ...BACK
                    ]
                };
            }
        }

        if (locationId === 'oaza_halyaz') {
            if (hs === 'stage4_trials') {
                const trialDone = hqs.trialOasis || false;
                return {
                    desc: `Woda w oazie jest dziś niesamowicie spokojna — lustro. Odbija nie tylko niebo, ale też coś głębszego.\n\n${trialDone ? '✅ Próba Oazy — ukończona.' : '⬜ Próba Oazy czeka — musisz zajrzeć w swoje odbicie bez lęku.'}`,
                    actions: [
                        ...(!trialDone ? [{ label: '💧 Staw czoła Próbie Oazy (Quest)', action: 'trialOasis' }] : []),
                        { label: 'Napij się wody', action: 'drinkOasis' },
                        { label: 'Porozmawiaj z pielgrzymami', action: 'talkPilgrims' },
                        ...BACK
                    ]
                };
            }
        }

        if (locationId === 'oboz_karawany') {
            if (hs === 'stage4_trials') {
                const trialDone = hqs.trialCaravan || false;
                return {
                    desc: `Kupcy karawany są niespokojni. Przywódca patrzy na ciebie dziwnie — jakby wiedział, że tu nie chodzi tylko o handel.\n\n${trialDone ? '✅ Próba Karawany — ukończona.' : '⬜ Próba Karawany czeka — musisz udowodnić, że znasz cenę pustyni.'}`,
                    actions: [
                        ...(!trialDone ? [{ label: '⛺ Staw czoła Próbie Karawany (Quest)', action: 'trialCaravan' }] : []),
                        { label: 'Porozmawiaj z przywódcą', action: 'talkCaravanLeader' },
                        { label: 'Handluj z kupcami', action: 'tradeCaravan' },
                        ...BACK
                    ]
                };
            }
        }
    }

    return null; // no override — use static data
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

    // Check quest stage requirement (for serce_lasu)
    if (loc.requiresQuestStage) {
        const stage = lasQuestStage();
        const stageOrder = ['none','offered','stage2','stage3_choice','stage4_light','stage4_shadow','stage5_light','stage5_shadow','done_light','done_shadow'];
        const reqIdx = stageOrder.indexOf(loc.requiresQuestStage);
        const curIdx = stageOrder.indexOf(stage);
        if (curIdx < reqIdx) {
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
    }

    // Dynamic location override (quest-aware desc + actions)
    const dynOverride = getDynamicLocationData(regionKey, locationId);
    const activeDesc    = dynOverride ? dynOverride.desc    : loc.desc;
    const activeActions = dynOverride ? dynOverride.actions : loc.actions;

    // Special handling for moon gate
    let extraContent = '';
    let extraQuestActions = [];
    if (locationId === 'ksiezycowa_brama') {
        const moonStatus = getMoonGateStatus();
        if (!moonStatus.open) {
            extraContent = `<div style="margin: 10px 0; padding: 10px; background: rgba(40,30,60,0.6); border-left: 3px solid #9966cc; border-radius: 6px; color: #cc99ff; font-style: italic;">${moonStatus.msg}</div>`;
        } else {
            extraContent = `<div style="margin: 10px 0; padding: 10px; background: rgba(30,50,30,0.6); border-left: 3px solid #66cc99; border-radius: 6px; color: #99ffcc; font-style: italic;">Runy pulsują zimnym, srebrnym światłem. Brama drży jakby oddychała.</div>`;
        }
        const questContent = getMoonGateQuestContent(moonStatus.open);
        extraContent += questContent.extra;
        extraQuestActions = questContent.questActions;
    }

    // Special handling for Las Mgieł quest locations
    const lasInject = getLasQuestInjection(locationId);
    extraContent += lasInject.extra;
    extraQuestActions = extraQuestActions.concat(lasInject.questActions);

    // Special: serce_lasu renders the full quest interface in location-action-area
    const isSerceQuest = (locationId === 'serce_lasu');

    const area = document.getElementById("world-content-area");
    area.innerHTML = `
        <div class="dialog-window" style="margin-top:20px;">
            <div class="dialog-title">${loc.icon} ${loc.label}</div>
            <div class="dialog-text" style="white-space:pre-line;">${activeDesc}</div>
            ${extraContent}
            <div id="location-action-area">
                ${renderCourierSearchButton(regionKey, locationId)}
                ${(extraQuestActions||[]).map(a => `<div class="dialog-button" onclick="${a.onclick}">${a.label}</div>`).join('')}
                ${isSerceQuest ? '' : renderLocationActions(regionKey, locationId, activeActions)}
            </div>
        </div>
    `;

    // For serce_lasu: render the quest interface directly
    if (isSerceQuest) {
        renderLasMgielQuest();
    }
}

function renderLocationActions(regionKey, locationId, actions) {
    return actions.map(action => {
        if (action.action === 'back') {
            return `<div class="dialog-button" style="margin-top:15px; border-color:#778; color:#aab;" onclick="openRegion('${regionKey}')">← Zawróć</div>`;
        }
        return `<div class="dialog-button" onclick="handleLocationAction('${regionKey}', '${locationId}', '${action.action}')">${action.label}</div>`;
    }).join('');
}


function openRegion(regionKey) {
    if (regionKey === 'miasto') {
        openRegionMiasto(regionKey);
    } else {
        openRegionOriginal(regionKey);
    }
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
        updateInventoryTabFull();
        return "Handlarka zawija kawałek mięsa w pergamin i podaje ci go z uśmiechem. +1 Mięso.";
    },
    buyBerries: () => {
        if (!canAfford(5)) return "Nie masz wystarczająco miedzi (5 miedzi).";
        spendCurrency(5);
        foodItems.jagody = (foodItems.jagody || 0) + 1;
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
        updateInventoryTabFull();
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
    browseSmith: () => { renderSmithShopFull(); return null; },
    sellAtFoodMerchant: () => { renderSellPanel('food'); return null; },
    sellAtSmith: () => { renderSellPanel('smith'); return null; },
    openOchronaFromTavern: () => { openOchronaFromTavern(); return null; },

    // ŚWIĄTYNIA
    pray: () => {
        const blessings = [
            "Kapłanka prowadzi cię do ołtarza i szepcze modlitwę. Czujesz ciepłe drżenie w powietrzu. Astor słyszy.",
            "Klęczysz przed posągiem Smoczej Matki. Kamienna twarz wydaje się przez chwilę łagodna.",
            "Modlitwa płynie z ust spokojnie. Świece migoczą bez powodu. Może to znak, może tylko przeciąg."
        ];
        return blessings[Math.floor(Math.random() * blessings.length)];
    },
    healDragon: () => { renderTempleHeal(); return null; },
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
    offerHelp: () => { renderGuardMissionOrHostile(); return null; },

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
        updateInventoryTabFull();
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

    playDice: () => { openDiceGame(); return null; },

    // LAS - QUEST START
    startLasMgielQuest: () => {
        if (!hasAnyHatchedDragon()) {
            const box = document.getElementById('location-action-area');
            if (box) box.innerHTML = `
                <div style="padding:12px 16px; background:rgba(20,30,15,0.7); border-left:3px solid #446633; border-radius:6px; color:#99aa88; line-height:1.8; font-style:italic; margin-bottom:10px;">
                    Leśniczka patrzy na ciebie przez chwilę, potem na twoje ręce — puste.<br><br>
                    — Widzę, że chcesz pomóc — mówi powoli. — Ale las nie słucha samych ludzi. Potrzeba czegoś więcej — kogoś, kto rozumie zarówno żywioł jak i dziką naturę. Wróć, gdy będziesz miał smoka.
                </div>
                <div class="dialog-button" style="border-color:#446633;color:#88aa66;" onclick="openRegion('las')">← Zawróć</div>
            `;
            return null;
        }
        const stage = lasQuestStage();
        if (stage === 'none') {
            lasQuestTrigger();
        } else {
            renderLasMgielQuest();
        }
        return null;
    },

    // LAS - SOJUSZE STAGE4
    performLakeAlliance: () => {
        lasQuestMarkLightVisit('visitedLake');
        return null;
    },

    performNestAlliance: () => {
        lasQuestMarkLightVisit('visitedNest');
        return null;
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
        updateInventoryTabFull();
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
    allianceLake: () => {
        lasQuestMarkLightVisit('visitedLake');
        return null;
    },
    allianceNest: () => {
        lasQuestMarkLightVisit('visitedNest');
        return null;
    },
    allianceNest: () => {
        lasQuestMarkLightVisit('visitedNest');
        return null;
    },

    // ─── PUSTYNIA HALYAZ ──────────────────────────────────────
    startHalyazQuest: () => {
        if (!hasAnyHatchedDragon()) {
            const box = document.getElementById('location-action-area');
            if (box) box.innerHTML = `
                <div style="padding:12px 16px;background:rgba(40,20,5,0.75);border-left:3px solid #664422;border-radius:6px;color:#c09060;line-height:1.8;font-style:italic;margin-bottom:10px;">
                    Strażniczka patrzy na ciebie, potem na twoje puste ręce.<br><br>
                    — Halyaz mówi przez żywioły — mówi powoli. — Potrzebujesz smoka, żeby go słyszeć. Wróć gdy go będziesz miał.
                </div>
                <div class="dialog-button" style="border-color:#664422;color:#cc8844;" onclick="openRegion('pustynia')">← Wróć na pustynię</div>`;
            return null;
        }
        const stage = halyazQuestStage();
        if (stage === 'none') halyazQuestTrigger();
        else renderHalyazQuest();
        return null;
    },
    searchHalyazSign: () => { halyazSearchSign(); return null; },
    trialSands: () => {
        const qs = getHalyazQuestState();
        const path = qs.path || 'ochrona';
        const isOchrona = path === 'ochrona';
        const qt_trialSands = getHalyazQuestState();
        const el = qt_trialSands.missionDragon || getHatchedDragonElements()[0] || 'ogien';

        const scenes = {
            ogien:     isOchrona ? 'Smok ryczy pośrodku wiru — i wiatr go słucha. Szepty milkną jeden po drugim, uspokajane ogniem.' : 'Smok podpala sam wir. Duchy krzyczą i gasną. Wicher się wzmaga — i Halyaz budzi się w ogniu.',
            woda:      isOchrona ? 'Smok wzywaa deszcz w środku pustyni. Pada przez chwilę — duchy uciszają się, uspokojone wilgocią.' : 'Smok pochłania szepty jak woda pochłania kamień — po cichu, bez śladu.',
            ziemia:    isOchrona ? 'Smok tupie w piasek — grunt drży. Duchy rozumieją: tu jest gospodarz. Wycofują się z szacunkiem.' : 'Smok wbija się w ziemię i duchy wchłaniane są w głąb. Spokojna przemoc.',
            powietrze: isOchrona ? 'Smok wzlatuje w sam wir i krąży razem z piaskiem. Duchy czują, że rozumiesz ich naturę. Odpoczywają.' : 'Smok kradnie wir — przejmuje go dla siebie. Duchy gubią się w nowym wichurze i milkną.',
            swiatlo:   isOchrona ? 'Blask smoka rozświetla wirujący piasek. Duchy widzą drogę. Jeden po drugim idą dalej.' : 'Smok wybucha blaskiem tak silnym, że cień ginie. Duchy uciekają przed światłem.',
            cien:      isOchrona ? 'Smok wchodzi w cień między ziarnami piasku. Rozumie duchy — rozmawia z nimi w ich języku. Usypiają.' : 'Smok pożera cień i razem z nim — duchy. Cisza.',
            lod:       isOchrona ? 'Smok zamarza wir piasku na chwilę. Wszystko staje. Duchy, uśpione zimnem, spokojnie odpływają.' : 'Lodowy podmuch niszczy strukturę wiru. Duchy rozlatują się w piasek bez powrotu.',
            magma:     isOchrona ? 'Smok wgrzewa się w wirujący piasek — piasek topi się w szkło. Duchy widzą siebie i idą dalej.' : 'Smok topi piasek w lawę. Duchy krzyczą i gasną w żarze.',
        };
        const msg = scenes[el] || scenes['ogien'];
        halyazCompleteTrial('trialSands');
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:14px;background:rgba(40,25,10,0.8);border-left:3px solid #ffaa44;border-radius:8px;color:#e0c080;line-height:1.8;margin-bottom:12px;font-style:italic;">
                🌀 <b style="font-style:normal;color:#ffcc66;">Próba Pieśni Piasku — ukończona</b><br><br>${msg}
            </div>
            <div style="padding:8px 14px;background:rgba(20,10,5,0.6);border-left:3px solid #cc8833;border-radius:6px;color:#ffaa44;font-size:13px;margin-bottom:12px;">✅ Próba zaliczona</div>
            <div class="dialog-button" onclick="openLocation('pustynia','swiatynia_slonca')">📍 Sprawdź postęp u Strażniczki</div>`;
        return null;
    },
    trialOasis: () => {
        const qs = getHalyazQuestState();
        const path = qs.path || 'ochrona';
        const isOchrona = path === 'ochrona';
        const qt_trialOasis = getHalyazQuestState();
        const el = qt_trialOasis.missionDragon || getHatchedDragonElements()[0] || 'ogien';

        const scenes = {
            ogien:     isOchrona ? 'Smok pochyla się nad wodą. Jego odbicie w oazie jest spokojne — nie agresywne. Woda uznaje jego ogień.' : 'Smok patrzy w wodę bez lęku. Odbicie płonie. Oaza akceptuje to nowe, inne oblicze.',
            woda:      isOchrona ? 'Smok wchodzi do oazy i staje się z nią jednym. Woda i smok — jedno odbicie.' : 'Smok pochłania część oazy. Woda jest teraz jego częścią — oaza zmieniona.',
            ziemia:    isOchrona ? 'Smok kładzie łapę na dnie oazy. Woda staje się spokojniejsza — czuje ziemię pod sobą.' : 'Smok rozbija dno oazy łapą. Woda ucieka — i wraca inna, ze skałą w środku.',
            powietrze: isOchrona ? 'Smok lata tuż nad oazą — skrzydła muskają powierzchnię. Fale wyglądają jak liście.' : 'Smok tworzy wir nad oazą — woda wznosi się i opada. Oaza przemieniona.',
            swiatlo:   isOchrona ? 'Smok lśni nad oazą — odbicie jest podwójnie jasne. Coś w wodzie przyjmuje to spokojnie.' : 'Blask smoka wchodzi w wodę i zmienia jej kolor na złoty. Oaza przemieniona w lustro słońca.',
            cien:      isOchrona ? 'Smok kładzie się w cieniu przy oazie. Ciemność i woda — odbicie spokojne jak śmierć.' : 'Smok pochłania swoje odbicie. Woda staje się nieprzejrzysta, ciemna jak noc.',
            lod:       isOchrona ? 'Smok delikatnie zamarza powierzchnię oazy — na kryształ. W środku kryształu — twoje odbicie, spokojne.' : 'Oaza zamraża się do dna. Odbicie uwięzione w lodzie — permanentne, inne.',
            magma:     isOchrona ? 'Smok ogrzewa oazę oddechem — woda paruje lekko. Para formuje twoje odbicie w powietrzu.' : 'Smok topi krawędź oazy. Woda gotuje się na brzegu — oaza przemieniona w gorące źródło.',
        };
        const msg = scenes[el] || scenes['ogien'];
        halyazCompleteTrial('trialOasis');
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:14px;background:rgba(40,25,10,0.8);border-left:3px solid #ffaa44;border-radius:8px;color:#e0c080;line-height:1.8;margin-bottom:12px;font-style:italic;">
                💧 <b style="font-style:normal;color:#ffcc66;">Próba Oazy — ukończona</b><br><br>${msg}
            </div>
            <div style="padding:8px 14px;background:rgba(20,10,5,0.6);border-left:3px solid #cc8833;border-radius:6px;color:#ffaa44;font-size:13px;margin-bottom:12px;">✅ Próba zaliczona</div>
            <div class="dialog-button" onclick="openLocation('pustynia','swiatynia_slonca')">📍 Sprawdź postęp u Strażniczki</div>`;
        return null;
    },
    trialCaravan: () => {
        const qs = getHalyazQuestState();
        const path = qs.path || 'ochrona';
        const isOchrona = path === 'ochrona';
        const qt_trialCaravan = getHalyazQuestState();
        const el = qt_trialCaravan.missionDragon || getHatchedDragonElements()[0] || 'ogien';

        const scenes = {
            ogien:     isOchrona ? 'Przywódca karawany wstaje gdy widzisz twojego smoka. — Widziałem dużo smoków — mówi — ale ten niesie ogień bez złości. Zdajesz próbę.' : 'Smok siada przy ognisku i... przywódca kiwa głową. — Ogień, który płonie swobodnie — odpowiada na pytanie Halyaz.',
            woda:      isOchrona ? 'Smok przynosi wodę z oazy i stawia przy ognisku karawany. Przywódca patrzy i rozumie.' : 'Smok pije ze studni karawany bez pozwolenia. Przywódca śmieje się — Halyaz musi być silne.',
            ziemia:    isOchrona ? 'Smok kładzie się między namiotami jak część ziemi. Wielbłądy nie uciekają. Przywódca mówi: — Zdał.' : 'Smok uderza łapą w ziemię. Kurz unosi się i opada — i na ziemi widać znak Halyaz.',
            powietrze: isOchrona ? 'Smok kręci się wśród karawany jak wiatr wśród namiotów — nie szkodząc, bawiąc. Przywódca kiwa głową.' : 'Smok podrywa namiot do góry. Kupcy krzyczą, potem się śmieją. Próba zdana.',
            swiatlo:   isOchrona ? 'Smok lśni nad obozem — wszyscy widzą. Przywódca klęka — znak uznania.' : 'Smok oświetla całą karawanę. Kupcy widzą siebie nawzajem wyraźniej niż kiedykolwiek.',
            cien:      isOchrona ? 'Smok chowa się w cieniu namiotu i czeka cierpliwie. Przywódca siada obok — też w cieniu. Rozumie.' : 'Smok kradnie cień przywódcy na chwilę. Przywódca śmieje się — próba zdana.',
            lod:       isOchrona ? 'Smok chłodzi powietrze w obozie. Upał pustyni odpuszcza. Kupcy dziękują. Próba zdana.' : 'Smok zamarza połowę zapasów wody — ale na dłużej. Kupcy w końcu rozumieją wartość tego gestu.',
            magma:     isOchrona ? 'Smok rozgrzewa ognisko gdy prawie gasło. Noc pustyni jest cieplejsza. Przywódca kiwa głową.' : 'Smok wchodzi między kupców i staje jak kolumna lawy — nikt nie ucieka. Halyaz zadowolone.',
        };
        const msg = scenes[el] || scenes['ogien'];
        halyazCompleteTrial('trialCaravan');
        const box = document.getElementById('location-action-area');
        if (box) box.innerHTML = `
            <div style="padding:14px;background:rgba(40,25,10,0.8);border-left:3px solid #ffaa44;border-radius:8px;color:#e0c080;line-height:1.8;margin-bottom:12px;font-style:italic;">
                ⛺ <b style="font-style:normal;color:#ffcc66;">Próba Karawany — ukończona</b><br><br>${msg}
            </div>
            <div style="padding:8px 14px;background:rgba(20,10,5,0.6);border-left:3px solid #cc8833;border-radius:6px;color:#ffaa44;font-size:13px;margin-bottom:12px;">✅ Próba zaliczona</div>
            <div class="dialog-button" onclick="openLocation('pustynia','swiatynia_slonca')">📍 Sprawdź postęp u Strażniczki</div>`;
        return null;
    },

    // ogólne akcje pustyni
    talkCaravanLeader: () => {
        const tales = [
            '— Halyaz jest stara jak czas — mówi powoli, nie patrząc na ciebie. — Byłem tu trzy razy. Za każdym razem czuję, że pustynia mnie obserwuje. I za każdym razem wychodzę z czymś, czego nie miałem.',
            '— Nie wchódź w wir piasku bez smoka — mówi i wskazuje na pole wydm. — Widziałem ludzi którzy weszli i wyszli zmienieni. Nie wiem czy lepiej.',
            '— Oaza Halim ma wodę uzdrawiającą — mówi. — Ale nie każdego. Raz leczyła mojego towarzysza. Raz zabiła konia. Halyaz daje i bierze.',
        ];
        return tales[Math.floor(Math.random() * tales.length)];
    },
    tradeCaravan: () => {
        if (!canAfford(10)) return '— Mamy przyprawy, pigmenty i stare mapy — mówi kupiec. — Wszystko po dziesięć miedzi. Wróć gdy będziesz miał.';
        spendCurrency(10);
        const items = ['Przyprawy Halyaz', 'Mapa pustyni', 'Pigment czerwony', 'Kość wielblądzia'];
        const got = items[Math.floor(Math.random() * items.length)];
        inventory[got] = (inventory[got] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTabFull();
        return `Kupiec wygrzebuje z sakwy przedmiot. — Dobry wybór — mówi. — Halyaz szczodra dla tych co umieją handlować. +1 ${got}.`;
    },
    restFire: () => 'Siadasz przy ognisku. Kupcy nieśpiesznie gadają w swoim języku. Gwiazdy nad pustynią są wyraźniejsze niż gdziekolwiek indziej. Przez chwilę nic się nie dzieje — i jest to bardzo przyjemne.',
    askDesert: () => {
        const tips = [
            '— Nie idź na zachód po zmroku — mówi stary kupiec. — Tam jest Pieśń Piasku. Duchy nie śpią.',
            '— Ruiny mają dwa poziomy — mówi jeden z wędrowców. — Jeden na wierzchu. Jeden pod piaskiem. Nikt nie schodził głębiej i nie wrócił normalny.',
            '— Oaza Halim była tu zanim zbudowano Halyaz — mówi kobieta przy ogniu. — Ludzie jej pilnowali. Potem zniknęli. Oaza została.',
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    },
    studyMap: () => 'Na wyrytej mapie widać szkic całej pustyni — ale coś się nie zgadza. Kilka lokacji jest zaznaczonych w miejscach które teraz wyglądają inaczej. Kopiujesz wzrok na kawałku papieru.',
    searchRuins: () => {
        const found = ['Kawałek mozaiki', 'Stara moneta', 'Fragment kolumny', 'Gliniany amulet'];
        if (Math.random() < 0.5) {
            const item = found[Math.floor(Math.random() * found.length)];
            inventory[item] = (inventory[item] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTabFull();
            return `Wśród kamieni i piasku — coś błyska. Grzebiesz i wyciągasz ${item}. +1 ${item}.`;
        }
        return 'Szukasz wszędzie. Piasek jest głęboki — może za głęboki. Tym razem nic.';
    },
    enterPassage: () => 'Schody prowadzą w dół, ale po kilku metrach są zasypane. Powietrze z dołu jest dziwne — chłodniejsze i cięższe niż powinno być. Coś tam jest. Ale nie teraz.',
    listenWind: () => {
        const sounds = [
            'Wiatr w kolumnach tworzy dziwną melodię — nie przypadkową. Jakby ktoś zaprojektował ten instrument z kamienia.',
            'Słyszysz coś w wietrze — może słowo, może nie. Brzmienie jest starożytne i nieznane.',
            'Kolumny grają jak flety gdy wiatr jest odpowiedni. Stoisz przez chwilę i słuchasz. Coś w tym śpiewie jest smutne.',
        ];
        return sounds[Math.floor(Math.random() * sounds.length)];
    },
    drinkOasis: () => {
        if (Math.random() < 0.5) {
            return 'Woda jest chłodna i słodka — nic podobnego w całej pustyni. Czujesz się lepiej. Dużo lepiej.';
        }
        return 'Woda jest czysta, ale zwykła. Może nie byłeś wystarczająco spragniony — albo oaza oceniła, że nie potrzebujesz niczego więcej.';
    },
    talkPilgrims: () => {
        const tales = [
            '— Przyszłam tu żeby zapomnieć — mówi kobieta, nie patrząc na ciebie. — Oaza dała mi pamięć zamiast. Nie wiem co z nią zrobić.',
            '— Trzecia pielgrzymka — mówi starszy mężczyzna. — Za pierwszym razem oaza mnie wyleczyła. Za drugim — pokazała mi moją śmierć. Za trzecim... chcę sprawdzić co tym razem.',
            '— Mój smok jest chory — mówi młoda kobieta i wskazuje na mały, blade jajo przy jej boku. — Słyszałam że oaza leczy. Mam nadzieję.',
        ];
        return tales[Math.floor(Math.random() * tales.length)];
    },
    restOasis: () => 'Siadasz w cieniu palmy. Powietrze jest przyjemnie chłodne przy wodzie. Twój smok zwija się obok i zasypia prawie natychmiast. Siedzisz przez chwilę i słuchasz szumu liści.',
    searchOasis: () => {
        if (Math.random() < 0.35) {
            inventory['Bursztyn oazy'] = (inventory['Bursztyn oazy'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTabFull();
            return 'Na dnie oazy, między kamieniami, błyszczy kawałek bursztynu — głębokożółty, ciepły w dotyku. +1 Bursztyn oazy.';
        }
        return 'Woda jest przejrzysta jak szkło — widać każdy kamień. Tym razem nic cennego. Ale warto było spróbować.';
    },
    listenSands: () => {
        const whispers = [
            'Przez chwilę słyszysz coś wyraźnego: „— Wróciłeś." Potem wiatr zmienia kierunek i melodia znika.',
            'Szepty brzmią jak wiele głosów naraz — nie możesz wyróżnić żadnego. Ale jedno słowo powtarza się: „Halyaz".',
            'Cisza. A potem — jedno bardzo wyraźne słowo, po którym wiatr milknie: „— Czekamy."',
        ];
        return whispers[Math.floor(Math.random() * whispers.length)];
    },
    decodeSands: () => 'Próbujesz analizować dźwięki — zapisujesz fragmenty na kawałku papieru. Wzorzec istnieje — ale jest zbyt złożony by odczytać go bez klucza.',
    enterSandStorm: () => {
        if (Math.random() < 0.4) return 'Wchodzisz w wir. Przez chwilę nic nie widzisz — piasek jest wszędzie. Potem wychodzisz po drugiej stronie. Masz wrażenie, że straciłeś pięć minut albo pięć lat.';
        return 'Wchodzisz w wir i wylatuje szybko. Piasek jest zbyt gęsty — twój smok wyciąga cię z powrotem.';
    },
    talkSunGuardian: () => {
        const tales = [
            '— Kamień na ołtarzu to serce Halyaz — mówi strażniczka. — Nie dosłownie. Ale prawie.',
            '— Rzeźbię w piasku bo piasek znika — mówi, nie przerywając pracy. — Tylko rzeźba która znika ma znaczenie. Pozostałe — tylko dekoracja.',
            '— Byłam tu zanim zbudowano tę świątynię — mówi spokojnie. — I będę tu gdy ją znowu pochłonie pustynia. Halyaz jest cierpliwe.',
        ];
        return tales[Math.floor(Math.random() * tales.length)];
    },
    talkSunGuardianDone: () => '— Zrobiłeś co powinieneś — mówi strażniczka spokojnie. — Halyaz pamięta. I ja też.',
    touchSunStone: () => {
        if (Math.random() < 0.5) return 'Kładziesz rękę na kamieniu. Jest gorący — ale nie parzy. Czujesz wibrację, jakby coś głęboko pod pustynią odpowiadało na twój dotyk.';
        return 'Kamień jest dziś spokojniejszy niż zwykle. Ciepły jak chleb po wypiekach. Strażniczka zerka na ciebie kątem oka.';
    },
    makeOffering: () => {
        const options = [
            { item: 'Złoto', key: 'gold', amount: 1 },
            { item: 'Moneta', key: 'copper', amount: 50 },
        ];
        if (canAfford(50)) {
            spendCurrency(50);
            return 'Kładziesz monety na ołtarzu. Kamień na chwilę świeci jaśniej — a potem wraca do normalnego blasku. Strażniczka kiwa głową.';
        }
        return 'Chciałbyś złożyć ofiarę — ale twoje kieszenie są puste. Strażniczka nie komentuje.';
    },
    meditateAltar: () => 'Siadasz przy ołtarzu i zamykasz oczy. Ciepło kamienia otacza cię jak koc. Przez chwilę nie myślisz o niczym — a to uczucie jest bardziej wartościowe niż złoto.',
    sitLake: () => "Siedzisz przy brzegu przez długi czas. Woda jest nieruchoma. Niebieski kwiat obok ciebie otwiera się, choć słońca prawie nie ma. Czujesz się spokojniejszy — i trochę nieswojo z tym spokojem.",
    pickFlowers: () => {
        inventory['Niebieski kwiat'] = (inventory['Niebieski kwiat'] || 0) + 1;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryTabFull();
        return "Zrywasz jeden kwiat. Jest zimny w dotyku. Nie więdnie przez cały dzień. +1 Niebieski kwiat.";
    },

    // POLANA
    gatherBerries: () => {
        const success = Math.random() > 0.2;
        if (success) {
            const amount = Math.floor(Math.random() * 2) + 1;
            foodItems.jagody = (foodItems.jagody || 0) + amount;
            localStorage.setItem('foodItems', JSON.stringify(foodItems));
            updateInventoryTabFull();
            return `Zbierasz jagody przez chwilę. Są duże, syte i pachną jak magia. +${amount} Jagody.`;
        }
        return "Szukasz jagód, ale ptaki były przed tobą. Polana jest tego dnia pusta.";
    },
    gatherHerbs: () => {
        const success = Math.random() > 0.3;
        if (success) {
            inventory['Zioła leśne'] = (inventory['Zioła leśne'] || 0) + 1;
            localStorage.setItem('inventory', JSON.stringify(inventory));
            updateInventoryTabFull();
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
            updateInventoryTabFull();
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
            updateInventoryTabFull();
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
            updateInventoryTabFull();
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
            updateInventoryTabFull();
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
        updateInventoryTabFull();
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
            updateInventoryTabFull();
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
    if (['openWorkTab', 'openMerchantTab', 'browseSmith', 'magicLesson', 'watchFight', 'joinTournament', 'talkLibrarian', 'offerHelp', 'healDragon', 'sellAtFoodMerchant', 'sellAtSmith', 'openOchronaFromTavern', 'startLasMgielQuest', 'performLakeAlliance', 'performNestAlliance', 'allianceLake', 'allianceNest', 'startHalyazQuest', 'searchHalyazSign', 'trialSands', 'trialOasis', 'trialCaravan', 'playDice'].includes(actionName)) return;

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
let dragonLevel = dragonFeedings * 5;

let secondDragonFeedings = Number(localStorage.getItem("secondDragonFeedings")) || 0;
let secondDragonLevel = secondDragonFeedings * 5;

// odblokowanie trzeciego oraz stan handlarza
let thirdDragonUnlocked = localStorage.getItem("thirdDragonUnlocked") === "true";
let thirdDragonElement = localStorage.getItem("thirdDragonElement") || null;
let thirdEggHeats = Number(localStorage.getItem("thirdEggHeats")) || 0;
let thirdLastHeat = Number(localStorage.getItem("thirdLastHeat")) || 0;
let thirdDragonName = localStorage.getItem("thirdDragonName") || "Trzeci Smok";

let thirdDragonFeedings = Number(localStorage.getItem("thirdDragonFeedings")) || 0;
let thirdDragonLevel = thirdDragonFeedings * 5;

let merchantAfterSecondVisit = localStorage.getItem("merchantAfterSecondVisit") === "true";
let merchantAfterThirdVisit = localStorage.getItem("merchantAfterThirdVisit") === "true";
let merchantGreetingShown = localStorage.getItem("merchantGreetingShown") === "true";

// praca i waluty
let workUnlocked = localStorage.getItem("workUnlocked") === "true";
// First-time starter pack: 100 gold + 5 of each item
if (!localStorage.getItem("starterGiven")) {
    localStorage.setItem("copper", "0");
    localStorage.setItem("silver", "0");
    localStorage.setItem("gold", "100");
    // Give 5 of each food type
    const starterFood = { mięso: 5, jagody: 5 };
    localStorage.setItem("foodItems", JSON.stringify(starterFood));
    // Give 5 of each inventory item
    const starterInv = {
        'Świeża ryba': 5, 'Chleb': 5, 'Górski ser': 5,
        'Zioła lecznicze': 5, 'Stary miecz': 5, 'Torba złota': 5,
        'Kryształ krwi': 5, 'Nocny płaszcz': 5, 'Fragment golemowego kamienia': 5,
        'Ruda żelaza': 5, 'Piracka mapa': 5, 'Tajemnicza notatka': 1,
        'Szkicownik': 1,
    };
    localStorage.setItem("inventory", JSON.stringify(starterInv));
    // Give 1 of each gear from smith (to gearInventory)
    const starterGear = [];
    const allGear = [
        {id:'zelazny_helm',slot:'helm',name:'Żelazny Hełm',stats:{wytrzymalosc:2},source:'starter'},
        {id:'skorzany_pancerz',slot:'chest',name:'Skórzany Pancerz',stats:{wytrzymalosc:3},source:'starter'},
        {id:'skrzydla_skorzane',slot:'wings',name:'Skórzana Osłona Skrzydeł',stats:{wytrzymalosc:2,zrecznosc:1},source:'starter'},
        {id:'ogon_zelazny',slot:'tail',name:'Żelazna Osłona Ogona',stats:{sila:2,wytrzymalosc:1},source:'starter'},
    ];
    allGear.forEach((g,i) => { g.instanceId = Date.now() + i; starterGear.push(g); });
    localStorage.setItem("gearInventory", JSON.stringify(starterGear));
    localStorage.setItem("starterGiven", "true");
}
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
    updateInventoryTabFull();
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

function updateInventoryTab() { return updateInventoryTabFull(); }
function updateInventoryTab_legacy() {
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
            { text: "Podążam za wiatrem.", element: "powietrze" },
            { text: "Patrzę czy coś świeci w oddali — może sygnał, może magia.", element: "swiatlo" },
            { text: "Czekam aż zapadnie noc i zbliżam się po cichu.", element: "cien" },
            { text: "Oglądam obóz powoli — szukam śladów mrozu, lodu albo skrzynienia zimna.", element: "lod" },
            { text: "Kucam i dotykam ziemi — szukam śladu ciepła, gorących popiołów lub stopionej skały.", element: "magma" }
        ]
    },
    {
        text: "W ruinach świątyni słyszysz dźwięk. Co robisz?",
        answers: [
            { text: "Wchodzę bez wahania.", element: "ogien" },
            { text: "Szukam wilgoci — może woda prowadzi do źródła.", element: "woda" },
            { text: "Dotykam kamieni — historia zapisana w kamieniu.", element: "ziemia" },
            { text: "Słucham echa — wiatr mówi więcej niż oczy.", element: "powietrze" },
            { text: "Zapalam pochodnię i wchodzę — ciemność mnie nie zatrzyma.", element: "swiatlo" },
            { text: "Gaszę pochodnię i wchodzę w mroku. Tak mam przewagę.", element: "cien" },
            { text: "Zatrzymuję się przy wejściu — odczuwam chłód wydobywający się ze środka. To moje terytorium.", element: "lod" },
            { text: "Przykładam dłoń do kamienia — szukam wibracji ciepła z głębi.", element: "magma" }
        ]
    },
    {
        text: "Na rozdrożu spotykasz wędrowca. Co robisz?",
        answers: [
            { text: "Pytam o drogę — prosto do rzeczy.", element: "ogien" },
            { text: "Płynę z losem — pójdę w stronę, którą on wskaże.", element: "woda" },
            { text: "Słucham historii — każdy wędrowiec coś niesie.", element: "ziemia" },
            { text: "Idę za intuicją — coś czuję w tym spotkaniu.", element: "powietrze" },
            { text: "Uśmiecham się otwarcie i proponuję wspólną drogę.", element: "swiatlo" },
            { text: "Obserwuję z dystansu zanim zacznę mówić.", element: "cien" },
            { text: "Stoję spokojnie — moje zimne spojrzenie wystarczy.", element: "lod" },
            { text: "Podchodzę pewnie — płomień w środku daje mi odwagę.", element: "magma" }
        ]
    }
];

let currentQuestion = 0;
let elementScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0, swiatlo: 0, cien: 0, lod: 0, magma: 0 };

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
        elementScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0, swiatlo: 0, cien: 0, lod: 0, magma: 0 };
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
        powietrze: "delikatne pulsowanie przypominające powiew wiatru.",
        swiatlo: "łagodne, złociste ciepło — jak promień słońca przebijający się przez chmury.",
        cien: "dziwne chłodne drżenie, jakby jajo pochłaniało otaczające je światło.",
        lod: "intensywne zimno — jajo jest lodowate, a mimo to czujesz w nim żywy puls.",
        magma: "nieznośne gorąco przeplecione z rytmicznym drganiem — jak serce wulkanu."
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
    if (!workUnlocked) {
        unlockWork();
    }
    updateCurrencyDisplay();
    updateDragonsTab();
    updateHomeTab();
    updateMerchantTab();
    updateWorkTab();
    updateWorldTab();
    startDragonRegenLoop();
    updateSidebarTabs();
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
    eggHeats = Number(localStorage.getItem('eggHeats')) || 0;
    if (eggHeats >= 3) { updateHomeTab(); return; }
    eggHeats++;
    lastHeat = Date.now();
    localStorage.setItem('eggHeats', String(eggHeats));
    localStorage.setItem('lastHeat', String(lastHeat));
    updateHomeTab();
    updateDragonsTab();
}

function feedDragon1() {
    if (dragonLevel >= 15) return;
    dragonFeedings++;
    dragonLevel = dragonFeedings * 5;
    localStorage.setItem("dragonFeedings", dragonFeedings);
    localStorage.setItem("dragonLevel", dragonLevel);

    updateHomeTab();
    updateDragonsTab();
}

function feedDragon2() {
    if (secondDragonLevel >= 15) return;
    secondDragonFeedings++;
    secondDragonLevel = secondDragonFeedings * 5;
    localStorage.setItem("secondDragonFeedings", secondDragonFeedings);
    localStorage.setItem("secondDragonLevel", secondDragonLevel);

    updateHomeTab();
    updateDragonsTab();
}

function heatEgg2() {
    secondEggHeats = Number(localStorage.getItem('secondEggHeats')) || 0;
    if (secondEggHeats >= 3) { updateHomeTab(); return; }
    secondEggHeats++;
    secondLastHeat = Date.now();
    localStorage.setItem('secondEggHeats', String(secondEggHeats));
    localStorage.setItem('secondLastHeat', String(secondLastHeat));
    updateHomeTab();
    updateDragonsTab();
}

function heatEgg3() {
    thirdEggHeats = Number(localStorage.getItem('thirdEggHeats')) || 0;
    if (thirdEggHeats >= 3) { updateHomeTab(); return; }
    thirdEggHeats++;
    thirdLastHeat = Date.now();
    localStorage.setItem('thirdEggHeats', String(thirdEggHeats));
    localStorage.setItem('thirdLastHeat', String(thirdLastHeat));
    updateHomeTab();
    updateDragonsTab();
}

function feedDragon3() {
    if (thirdDragonLevel >= 15) return;
    thirdDragonFeedings++;
    thirdDragonLevel = thirdDragonFeedings * 5;
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
            { text: "Szukam run wypalonych ogniem — moc się czuje.", element: "ogien" },
            { text: "Sprawdzam czy woda spływa po ścianach — tu może być źródło.", element: "woda" },
            { text: "Badam skały i szukam śladów — ziemia pamięta wszystko.", element: "ziemia" },
            { text: "Nasłuchuję echa — powietrze przenosi ślady dawnych głosów.", element: "powietrze" },
            { text: "Dotykam najjaśniejszej runy — blask przyciąga mnie instynktownie.", element: "swiatlo" },
            { text: "Gaszę pochodnię i wchodzę głębiej — w ciemności runy świecą wyraźniej.", element: "cien" },
            { text: "Szukam śladów zamrożenia na ścianach — lód konserwuje starożytne sekrety.", element: "lod" },
            { text: "Dotykam najcieplejszego miejsca ściany — magma zostawia ślad nawet po tysiącleci.", element: "magma" }
        ]
    },
    {
        text: "Na pustkowiu widzisz wir energii. Co robisz?",
        answers: [
            { text: "Wchodzę w niego — płomień mnie nie zatrzyma.", element: "ogien" },
            { text: "Obserwuję jego ruch — jak woda, płynie po linii najmniejszego oporu.", element: "woda" },
            { text: "Dotykam ziemi, by poczuć drgania — ziemia wie co się kryje w środku.", element: "ziemia" },
            { text: "Pozwalam wiatrowi mnie poprowadzić — idę tam gdzie wieje.", element: "powietrze" },
            { text: "Patrzę czy w centrum wiruje coś jasnego — światło zawsze wskazuje cel.", element: "swiatlo" },
            { text: "Czekam aż ciemność odsłoni co jest w środku — pośpiech to błąd.", element: "cien" },
            { text: "Zatrzymuję się — wir mroźnego powietrza mówi mi co kryje w sobie.", element: "lod" },
            { text: "Wchodzę — coś wrze wewnątrz i czuję to w kościach.", element: "magma" }
        ]
    },
    {
        text: "Spotykasz ducha starożytnego smoka. Co robisz?",
        answers: [
            { text: "Patrzę mu prosto w oczy — ogień dla ognia.", element: "ogien" },
            { text: "Słucham jego szeptów — woda przepływa przez każdą historię.", element: "woda" },
            { text: "Kłaniam się i czekam — ziemia uczy pokory.", element: "ziemia" },
            { text: "Pozwalam mu przejść przez siebie — powietrze nie stawia oporu.", element: "powietrze" },
            { text: "Patrzę w miejsce skąd bije światło wokół niego.", element: "swiatlo" },
            { text: "Chowam się w jego cieniu i obserwuję zanim przemówię.", element: "cien" },
            { text: "Staje nieruchomo — zimna obecność promieniuje ze mnie spokój starszy niż czas.", element: "lod" },
            { text: "Wyciągam dłoń — chcę poczuć czy jest gorący jak ja.", element: "magma" }
        ]
    },
    {
        text: "Jesteś sam w nocy. Co czujesz?",
        answers: [
            { text: "Potrzebuję ognia — bez niego nie ma spokoju.", element: "ogien" },
            { text: "Szukam księżycowego odbicia w wodzie — noc to najlepsza chwila.", element: "woda" },
            { text: "Siadam na ziemi i czekam na świt — nocna cisza koi.", element: "ziemia" },
            { text: "Słucham — noc niesie dźwięki których w dzień nie słychać.", element: "powietrze" },
            { text: "Patrzę w gwiazdy — każda jest małym słońcem.", element: "swiatlo" },
            { text: "Ciemność jest znajoma — jak drugi dom.", element: "cien" },
            { text: "Noc jest moja — im zimniej, tym wyraźniej myślę.", element: "lod" },
            { text: "Siedzę przy żarze — żywy ogień jest moim towarzyszem.", element: "magma" }
        ]
    }
];

const merchantThirdQuestions = [
    {
        text: "W starym lesie odnajdujesz zrzucone łuski. Co robisz?",
        answers: [
            { text: "Patrzę czy iskrzą — może żar w nich tkwi.", element: "ogien" },
            { text: "Sprawdzam, czy są mokre — woda zostawia ślady.", element: "woda" },
            { text: "Zakopuję jedną — ziemia powinna ją mieć z powrotem.", element: "ziemia" },
            { text: "Podrzucam w górę i patrzę jak wiatr ją niesie.", element: "powietrze" },
            { text: "Trzymam w dłoni — czuję w nich dawne życie i ciepło.", element: "swiatlo" },
            { text: "Chowam do kieszeni — przyda się w ciemności.", element: "cien" }
        ]
    },
    {
        text: "Na brzegu jeziora widzisz odbicie nieba. Co czujesz?",
        answers: [
            { text: "Gorąco słońca na twarzy — ogień z góry i z dołu.", element: "ogien" },
            { text: "Chłód wody — chcę wejść do środka.", element: "woda" },
            { text: "Solidny grunt pod stopami — lustro to złudzenie, ziemia jest prawdziwsza.", element: "ziemia" },
            { text: "Lekkość — jakby odbicie było wejściem do powietrznego świata.", element: "powietrze" },
            { text: "Blask — coś we mnie budzi się na ten widok.", element: "swiatlo" },
            { text: "Ciekawość co kryje się pod powierzchnią w głębinie.", element: "cien" }
        ]
    },
    {
        text: "Słyszysz w oddali śpiew smoczych duchów. Jak reagujesz?",
        answers: [
            { text: "Odpowiadam ogniem — ogień to mój głos.", element: "ogien" },
            { text: "Pozwalam by śpiew przebrzmiał jak fala — woda jest cierpliwa.", element: "woda" },
            { text: "Siadam i słucham — ziemia uczy, żeby nie spieszyć.", element: "ziemia" },
            { text: "Śpiewam razem z wiatrem — dołączam do chóru.", element: "powietrze" },
            { text: "Odpowiadam blaskiem — niech wiedzą, że jestem.", element: "swiatlo" },
            { text: "Milczę i nasłuchuję — w ciszy słyszę więcej.", element: "cien" }
        ]
    },
    {
        text: "Ktoś mówi ci: musisz wybrać między jawnym a ukrytym. Co wybierasz?",
        answers: [
            { text: "Jawne — jak płomień, nie da się go ukryć.", element: "ogien" },
            { text: "Ukryte — jak głębina, tajemnicze i niezmierzone.", element: "woda" },
            { text: "Jawne — ziemia nie kłamie, stałość jest cnotą.", element: "ziemia" },
            { text: "Jawne — wiatr nie nosi sekretów, dość nie powiedzianych słów.", element: "powietrze" },
            { text: "Jawne, bo tylko światło buduje prawdziwe zaufanie.", element: "swiatlo" },
            { text: "Ukryte — wiedza i cień dają przewagę.", element: "cien" }
        ]
    }
];

function startThirdMerchant() {
    merchantThirdStep = 0;
    merchantThirdScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0, swiatlo: 0, cien: 0, lod: 0, magma: 0 };
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
        ogien: "ognistego", woda: "wodnego", ziemia: "ziemnego",
        powietrze: "powietrznego", swiatlo: "świetlistego", cien: "ciemnego", lod: "lodowego", magma: "magmowego"
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
let merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0, swiatlo: 0, cien: 0, lod: 0, magma: 0 };

// trzecia seria pytań
let merchantThirdStep = 0;
let merchantThirdScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };


function renderMerchantSellPanel() {
    const box = document.getElementById('merchant-content');
    if (!box) return;
    // The main merchant buys luxury / moon gate items
    const buyList = [
        'Księżycowy Kamień','Srebrny Pył Zza Bramy','Strzęp Zasłony Między Światami','Eter Księżycowy',
        'Kryształ krwi','Torba złota','Amulet smoczego pazura','Zbroja z łusek','Piracka mapa','Nocny płaszcz',
    ];
    const available = buyList.filter(name => (inventory[name] || 0) > 0);
    let html = `
        <div style="padding:10px; background:rgba(10,20,35,0.7); border-left:3px solid #9966cc; border-radius:6px; margin-bottom:10px; color:#c0aae0; font-style:italic;">
            Handlarz przegląda twoje rzeczy chłodnym wzrokiem.<br>— Skupuję rzadkie przedmioty. Resztę zabierz do kowala.
        </div>
    `;
    if (available.length === 0) {
        html += `<div style="color:#7080a0; font-style:italic; margin:10px 0;">Nie masz przy sobie niczego co mnie interesuje.</div>`;
    } else {
        available.forEach(name => {
            const qty   = inventory[name] || 0;
            const val   = getItemValue(name) || 0;
            const safeN = name.replace(/'/g, "\'");
            html += `
                <div style="margin:5px 0; padding:8px 12px; background:rgba(20,15,40,0.6); border-radius:6px; border-left:2px solid #553377;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <span style="color:#d0c0ff; font-weight:bold; flex:1;">${name}</span>
                        <span style="color:#aabb66; font-size:11px;">💰 ${formatValue(val)}/szt.</span>
                        <span style="color:#ffcc44;">×${qty}</span>
                    </div>
                    <div style="display:flex; gap:6px; margin-top:6px;">
                        <div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                             onclick="sellInventoryItem('${safeN}', 1); renderMerchantSellPanel()">Sprzedaj 1</div>
                        ${qty > 1 ? `<div class="dialog-button" style="flex:1; padding:4px 8px; font-size:12px; border-color:#557733; color:#aacc66;"
                             onclick="sellInventoryItem('${safeN}', ${qty}); renderMerchantSellPanel()">Wszystkie (${qty})</div>` : ''}
                    </div>
                </div>
            `;
        });
    }
    html += `<div class="dialog-button" style="margin-top:12px; border-color:#778; color:#aab;" onclick="updateMerchantTab()">← Wróć</div>`;
    box.innerHTML = html;
}

function updateMerchantTab() {
    const box = document.getElementById("merchant-content");

    // synchronise state in case storage was modified elsewhere
    thirdDragonUnlocked = localStorage.getItem("thirdDragonUnlocked") === "true";
    merchantAfterThirdVisit = localStorage.getItem("merchantAfterThirdVisit") === "true";
    merchantGreetingShown = localStorage.getItem("merchantGreetingShown") === "true";

    // ensure levels up-to-date
    dragonLevel = dragonFeedings * 5;
    secondDragonLevel = secondDragonFeedings * 5;

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
                <div class="dialog-button" onclick="renderMerchantSellPanel()">💰 Chcę coś sprzedać</div>
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
    merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0, swiatlo: 0, cien: 0, lod: 0, magma: 0 };

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
        ogien: "ognistego", woda: "wodnego", ziemia: "ziemnego",
        powietrze: "powietrznego", swiatlo: "świetlistego", cien: "ciemnego", lod: "lodowego", magma: "magmowego"
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
            <div class="dialog-button" onclick="openTab('world'); setTimeout(()=>openRegion('miasto'),80)">← Wróć do Astorveil</div>
            <div class="dialog-button" style="border-color:#556; color:#aab;" onclick="openTab('home')">🏠 Przejdź do Domu</div>
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
            <div class="dialog-button" onclick="openTab('world'); setTimeout(()=>openRegion('miasto'),80)">← Wróć do Astorveil</div>
            <div class="dialog-button" style="border-color:#556; color:#aab;" onclick="openTab('home')">🏠 Przejdź do Domu</div>
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
    if (name === "world") updateWorldTab();
    if (name === "dragons") {
        updateDragonsTab();
        let dragBtn = document.getElementById('tab-dragons-btn');
        if (!dragBtn) document.querySelectorAll('.tab').forEach(t => { if (t.textContent.trim() === 'Smoki') dragBtn = t; });
        if (dragBtn) { dragBtn.style.background=''; dragBtn.style.borderColor=''; dragBtn.style.color=''; dragBtn.style.boxShadow=''; dragBtn.removeAttribute('data-mission-complete'); }
    }
    if (name === "home") updateHomeTab();
    if (name === "work") updateWorkTab();
    if (name === "inventory") updateInventoryTabFull();
    if (name === "merchant") updateMerchantTab();
    if (name === "warta") updateWartaTab();
    if (name === "ochrona") updateOchronaTab();
    if (name === "szpiegowanie") updateSzpiegowanieTab();
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

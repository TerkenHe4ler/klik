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
   OPIS JAJKA PO WYBORZE ŻYWIOŁU
----------------------------------------- */
function finalizeDragon() {
    const intro = document.getElementById("intro");

    const chosen = Object.entries(elementScores).sort((a,b)=>b[1]-a[1])[0][0];
    chosenDragon = chosen;
    localStorage.setItem("chosenDragon", chosen);

    const descriptions = {
        ogien: "ciepło, które prawie parzy Cię w dłonie. Jesteś pewny, że wykluje się z niego wspaniały smok ognia.",
        woda: "chłód przypominający dotyk głębin oceanu. Czujesz, że narodzi się smok wody.",
        ziemia: "stabilne, kojące ciepło skał. Wiesz, że to jajo skrywa smoka ziemi.",
        powietrze: "delikatne pulsowanie przypominające powiew wiatru. To z pewnością będzie smok powietrza."
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
   START GRY — POKAZANIE ZAKŁADEK
----------------------------------------- */
function startGame() {
    document.getElementById("sidebar").style.display = "block";
    document.getElementById("intro").style.display = "none";

    updateDragonsTab();
    updateHomeTab();
    updateMerchantTab();
}

/* -----------------------------------------
   ZAKŁADKA SMOKI
----------------------------------------- */
function updateDragonsTab() {
    const list = document.getElementById("dragons-list");

    let html = "";

    html += `
        <div class="dragon-slot">
            <b>Smok 1:</b><br>
            Imię: ${dragonName}<br>
            Żywioł: ${chosenDragon}<br>
            Status: ${eggHeats < 3 ? "Jajko" : "Wykluty smok"}
        </div>
    `;

    html += `
        <div class="dragon-slot">
            <b>Smok 2:</b><br>
            ${secondDragonUnlocked ?
                `Imię: ${secondDragonName}<br>
                 Żywioł: ${secondDragonElement}<br>
                 Status: ${secondEggHeats < 3 ? "Jajko" : "Wykluty smok"}`
                :
                "🔒 Zablokowany — odwiedź Handlarza"
            }
        </div>
    `;

    html += `
        <div class="dragon-slot">
            <b>Smok 3:</b><br>
            🔒 Zablokowany
        </div>
    `;

    list.innerHTML = html;
}

/* -----------------------------------------
   ZAKŁADKA DOM
----------------------------------------- */
function updateHomeTab() {
    const home = document.getElementById("home-content");

    let html = "";

    /* Smok 1 */
    html += `
        <div class="dragon-slot">
            <b>Smok 1</b><br>
            Ogrzania: ${eggHeats}/3<br>
            ${eggHeats < 3 ?
                `<div class="button" onclick="heatEgg1()">Ogrzej jajko</div>`
                :
                `<div>Smok wykluty</div>
                 <input class="name-input" id="name1" placeholder="Nowe imię">
                 <div class="button" onclick="renameDragon1()">Zmień imię</div>`
            }
        </div>
    `;

    /* Smok 2 */
    if (secondDragonUnlocked) {
        html += `
            <div class="dragon-slot">
                <b>Smok 2</b><br>
                Ogrzania: ${secondEggHeats}/3<br>
                ${secondEggHeats < 3 ?
                    `<div class="button" onclick="heatEgg2()">Ogrzej jajko</div>`
                    :
                    `<div>Smok wykluty</div>
                     <input class="name-input" id="name2" placeholder="Nowe imię">
                     <div class="button" onclick="renameDragon2()">Zmień imię</div>`
                }
            </div>
        `;
    }

    home.innerHTML = html;
}

function heatEgg1() {
    const now = Date.now();
    if (now - lastHeat < 60000) return;

    eggHeats++;
    lastHeat = now;

    localStorage.setItem("eggHeats", eggHeats);
    localStorage.setItem("lastHeat", lastHeat);

    updateHomeTab();
    updateDragonsTab();
}

function heatEgg2() {
    const now = Date.now();
    if (now - secondLastHeat < 60000) return;

    secondEggHeats++;
    secondLastHeat = now;

    localStorage.setItem("secondEggHeats", secondEggHeats);
    localStorage.setItem("secondLastHeat", secondLastHeat);

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

/* -----------------------------------------
   HANDLARZ — PYTANIA
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

let merchantStep = 0;
let merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

function updateMerchantTab() {
    const box = document.getElementById("merchant-content");

    if (secondDragonUnlocked) {
        box.innerHTML = `
            <div class="dialog-window">
                <div class="dialog-title">Handlarz</div>
                <div class="dialog-text">Masz już drugiego smoka.</div>
            </div>
        `;
        return;
    }

    box.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-title">Handlarz</div>
            <div class="dialog-text">
                „Witaj, podróżniku. Widzę, że masz już jednego smoka.
                Jeśli chcesz kolejnego, muszę poznać twój żywioł.”
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
   ZMIANA ZAKŁADEK
----------------------------------------- */
function openTab(name) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.getElementById(name).style.display = "block";
}

/* -----------------------------------------
   START
----------------------------------------- */
showQuestion();

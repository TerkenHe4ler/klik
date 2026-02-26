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

let merchantAfterSecondVisit = localStorage.getItem("merchantAfterSecondVisit") === "true";

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

    updateDragonsTab();
    updateHomeTab();
    updateMerchantTab();
}

/* -----------------------------------------
   ZAKŁADKA SMOKI
----------------------------------------- */
function updateDragonsTab() {
    const list = document.getElementById("dragons-list");

    // poziomy muszą być obliczane za każdym razem, bo mogły się zmienić
    dragonLevel = Math.min(15, dragonFeedings * 5);
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);

    let html = "";

    html += `
        <div class="dragon-slot">
            <b>Smok 1:</b><br>
            Imię: ${dragonName}<br>
            Żywioł: ${chosenDragon}<br>
            Status: ${eggHeats < 3 ? "Jajko" : "Wykluty smok"}${eggHeats >= 3 ? `<br>Poziom: ${dragonLevel}` : ""}
        </div>
    `;

    html += `
        <div class="dragon-slot">
            <b>Smok 2:</b><br>
            ${secondDragonUnlocked ?
                `Imię: ${secondDragonName}<br>
                 Żywioł: ${secondDragonElement}<br>
                 Status: ${secondEggHeats < 3 ? "Jajko" : "Wykluty smok"}${secondEggHeats >= 3 ? `<br>Poziom: ${secondDragonLevel}` : ""}`
                :
                "🔒 Zablokowany — odwiedź Handlarza"
            }
        </div>
    `;

    html += `
        <div class="dragon-slot">
            <b>Smok 3:</b><br>
            ${thirdDragonUnlocked ?
                `Imię: ${thirdDragonName}<br>
                 Żywioł: ${thirdDragonElement}<br>
                 Status: ${thirdEggHeats < 3 ? "Jajko" : "Wykluty smok"}`
                :
                "🔒 Zablokowany"
            }
        </div>
    `;

    list.innerHTML = html;
}

/* -----------------------------------------
   ZAKŁADKA DOM
----------------------------------------- */
function updateHomeTab() {
    const home = document.getElementById("home-content");

    // aktualizuj poziomy na wypadek, gdyby się coś zmieniło
    dragonLevel = Math.min(15, dragonFeedings * 5);
    secondDragonLevel = Math.min(15, secondDragonFeedings * 5);

    let html = "";

    html += `
        <div class="dragon-slot">
            <b>Smok 1</b><br>
            Ogrzania: ${eggHeats}/3<br>
            ${eggHeats < 3 ?
                `<div class="dialog-button" onclick="heatEgg1()">Zadbaj o jajo</div>`
                :
                `<div>Smok wykluty</div>
                 Poziom: ${dragonLevel}<br>
                 ${dragonLevel < 15 ? `<div class="dialog-button" onclick="feedDragon1()">Nakarm smoka</div>` : ""}
                 <input class="name-input" id="name1" placeholder="Nowe imię">
                 <div class="dialog-button" onclick="renameDragon1()">Zmień imię</div>`
            }
        </div>
    `;

    if (secondDragonUnlocked) {
        html += `
            <div class="dragon-slot">
                <b>Smok 2</b><br>
                Ogrzania: ${secondEggHeats}/3<br>
                ${secondEggHeats < 3 ?
                    `<div class="dialog-button" onclick="heatEgg2()">Zadbaj o jajo</div>`
                    :
                    `<div>Smok wykluty</div>
                     Poziom: ${secondDragonLevel}<br>
                     ${secondDragonLevel < 15 ? `<div class="dialog-button" onclick="feedDragon2()">Nakarm smoka</div>` : ""}
                     <input class="name-input" id="name2" placeholder="Nowe imię">
                     <div class="dialog-button" onclick="renameDragon2()">Zmień imię</div>`
                }
            </div>
        `;
    }
    if (thirdDragonUnlocked) {
        html += `
            <div class="dragon-slot">
                <b>Smok 3</b><br>
                Ogrzania: ${thirdEggHeats}/3<br>
                ${thirdEggHeats < 3 ?
                    `<div class="dialog-button" onclick="heatEgg3()">Zadbaj o jajo</div>`
                    :
                    `<div>Smok wykluty</div>
                     <input class="name-input" id="name3" placeholder="Nowe imię">
                     <div class="dialog-button" onclick="renameDragon3()">Zmień imię</div>`
                }
            </div>
        `;
    }

    home.innerHTML = html;
}

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


let merchantStep = 0;
let merchantScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

// trzecia seria pytań
let merchantThirdStep = 0;
let merchantThirdScores = { ogien: 0, woda: 0, ziemia: 0, powietrze: 0 };

function updateMerchantTab() {
    const box = document.getElementById("merchant-content");

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
                „Widzę, że spełniłeś wymagania. Trzecie jajo jest teraz twoje – ale o tym później...”
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
    
    // Odśwież zawartość zakładki
    if (name === "dragons") updateDragonsTab();
    else if (name === "home") updateHomeTab();
    else if (name === "merchant") updateMerchantTab();
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

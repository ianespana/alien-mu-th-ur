## Alien MU/TH/UR 6000 — Komplett Veiledning

[English](../README.md) ·
[Español](README.es.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Italiano](README.it.md) ·
[Nederlands](README.nl.md) ·
[Norsk](README.no.md) ·
[Svenska](README.sv.md) ·
[Dansk](README.da.md)

MU/TH/UR 6000 for Foundry VTT (ALIEN RPG): retro‑terminal fullt synkronisert mellom Spiller, Tilskuer og SL: skrivemaskinvisning, CRT/scanline‑utseende, glitcher, lyd, SL‑styrt HACK og globalt CERBERUS‑protokoll.

### 1) Viktige funksjoner
- Retro‑grensesnitt: skrivemaskin, scanline, CRT‑tone, lette/kraftige glitcher
- Speilet tilskuermodus: tro kopi av spillerens visning (inkl. HACK/CERBERUS)
- Integrert lyd: tasting/retur/feil/svar med volum og begrensning
- HACK med SL‑avgjørelse: SUKSESS/FEIL via minidialog forankret til SL‑terminal
- Spesialordre: 754/899/931/937/939/966 etter vellykket hack
- CERBERUS‑protokoll: SL‑godkjenning, rød advarsel, spillerbekreftelse, global nedtelling, automatisk lukking
- Alarm: synkron på/av (rødt overlay + sirene), STOPP‑knapp i SL‑header
- Miljøkontroll: dører/lys/GAS/Cryo via spillerforespørsel → SL‑godkjenning → synkron utførelse
- Flytting av terminal (valgfritt): for SL og/eller spillere/tilskuere uten å blokkere input

### 2) Spillerkommandoer
- HELP: liste over tilgjengelige kommandoer
- STATUS: viser MU/TH/UR‑status (tekst konfigurerbar av SL)
- /M <melding>: direkte melding til MOTHER
- CLEAR: tømmer chatten (speiles til tilskuere)
- EXIT: lukker terminalen (speiles til tilskuere)
- HACK: starter hacking; SL bestemmer SUKSESS/FEIL; animasjoner/glitcher synkronisert
- ORDERS 754|899|931|937|939|966: viser Spesialordre (etter hack)
- CERBERUS: ber om SL‑godkjenning; ved godkjenning → rød advarsel + CONFIRM/CANCEL (kun spiller) → global nedtelling

### 3) Innstillinger
- enableTypingSounds (klient), typingSoundVolume (klient)
- enableScanline / scanlineSize (klient), enableTypewriter (klient)
- allowHack (verden)
- allowDragGM / allowDragPlayers (verden)
- currentStatusKey / customStatusText (verden)
- captainUserIds / allowCaptainSpecialOrders (verden)
- alarmSoundPath (verden)

### 4) HACK‑flyt (synkron)
1. Spiller skriver HACK → SL mottar avgjørelsesdialog (forankret til SL‑terminal)
2. SL klikker SUKSESS/FEIL → sendes tilbake til spiller
3. Tekstsekvenser, glitcher og lyd kjører i takt hos Spiller og Tilskuere
4. Ved suksess: nye ordre tilgjengelige; vises også for SL

### 5) CERBERUS‑protokoll
1. Spiller skriver CERBERUS → SL ser godkjenn/avslå + minutter
2. Hvis godkjent: Spiller ser rød advarsel; Tilskuere ser samme tekst uten knapper
3. Spiller bekrefter (CONFIRM) → global nedtelling (flytende timer + chat)
4. Ved 0: sluttsekvens, opprydding, automatisk lukking av grensesnitt

### 6) Alarm (global på/av)
- På: SL‑godkjenning → sirene + rødt overlay for alle
- Av: SL STOPP‑knapp → pålitelig AudioHelper‑stopp + tvungen stopp
- «Alarm deaktivert» sendes til alle, inkl. tilskuere

### 7) Miljøkontroller
- DØRER: LOCK/UNLOCK med SL‑valg/godkjenning, synkron tilbakemelding
- LYS: DIM/SHUTDOWN/RESTORE med SL‑godkjenning
- GAS: SL velger mål; effekt synkronisert
- CRYO POD / CRYO RELEASE: valg via dialoger forankret til SL‑terminal

### 8) Socket & Sync (hovedhendelser)
`muthurCommand`, `muthurResponse`, `updateSpectators`, `requestCurrentMessages`, `syncMessages`, `statusResponse`, `hackingAttempt/hackStream/hackGlitch/hackStopGlitch/hackComplete`, `alarmControl`, `showCerberusGlobal/stopCerberus`, `sessionStatus`, `closeMuthurChats`.

### 9) Installasjon & Oppstart
1. Installer og aktiver modulen
2. Spiller åpner MU/TH/UR (knapp i scenenotater/kontroller)
3. SL godkjenner og velger tilskuere
4. Skriv kommandoer i terminalen

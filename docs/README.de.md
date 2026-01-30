## Alien MU/TH/UR 6000 — Umfassender Leitfaden

[English](../README.md) ·
[Español](README.es.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Italiano](README.it.md) ·
[Nederlands](README.nl.md) ·
[Norsk](README.no.md) ·
[Svenska](README.sv.md) ·
[Dansk](README.da.md)

MU/TH/UR 6000 für Foundry VTT (ALIEN RPG) — Retro‑Terminal mit vollständiger Synchronisation zwischen Spieler, Zuschauer und SL: Schreibmaschinen‑Effekt, CRT/Scanline‑Look, Glitches, Audio‑Signale, SL‑gesteuertes HACK und globales CERBERUS‑Protokoll.

### 1) Hauptfunktionen
- Retro‑Interface: Schreibmaschine, Scanline, CRT‑Farblook, leichte/starke Glitches
- Spiegel‑Zuschauermodus: exakte Kopie der Spielerausgabe (inkl. HACK/CERBERUS)
- Integriertes Audio: Tippen/Return/Fehler/Antwort mit Lautstärke und Throttling
- HACK mit SL‑Entscheidung: ERFOLG/FEHLSCHLAG über Minifenster am SL‑Terminal
- Spezialbefehle: 754/899/931/937/939/966 nach erfolgreichem Hack
- CERBERUS‑Protokoll: SL‑Freigabe, rote Warnung, Spieler‑Bestätigung, globaler Countdown, Auto‑Schließen
- Alarmsteuerung: synchrones Aktivieren/Stoppen (rotes Overlay + Sirene), STOP‑Knopf im SL‑Header
- Umgebung: Türen/Lichter/GAS/Cryo via Spieleranfrage → SL‑Genehmigung → synchrone Ausführung
- Terminal‑Verschiebung (optional): für SL und/oder Spieler/Zuschauer, ohne Eingaben zu blockieren

### 2) Spielerbefehle
- HELP: listet verfügbare Befehle
- STATUS: zeigt MU/TH/UR‑Status (Text über SL konfigurierbar)
- /M <Nachricht>: Direktnachricht an MOTHER
- CLEAR: Verlauf leeren (spiegelt sich bei Zuschauern)
- EXIT: Terminal schließen (spiegelt sich bei Zuschauern)
- HACK: Start des Hacks; SL entscheidet ERFOLG/FEHLSCHLAG; Animationen/Glitches synchron
- ORDERS 754|899|931|937|939|966: zeigt Spezialbefehl (nach Hack)
- CERBERUS: SL‑Freigabe anfragen; bei Zustimmung → rote Warnung + CONFIRM/CANCEL (nur Spieler) → globaler Countdown

### 3) Einstellungen
- enableTypingSounds (Client), typingSoundVolume (Client)
- enableScanline / scanlineSize (Client), enableTypewriter (Client)
- allowHack (Welt)
- allowDragGM / allowDragPlayers (Welt)
- currentStatusKey / customStatusText (Welt)
- captainUserIds / allowCaptainSpecialOrders (Welt)
- alarmSoundPath (Welt)

### 4) HACK‑Ablauf (synchron)
1. Spieler tippt HACK → SL erhält Entscheidungsdialog (am SL‑Terminal verankert)
2. SL klickt ERFOLG/FEHLSCHLAG → zurück an Spieler
3. Textsequenzen, Glitches und Sounds laufen bei Spieler und Zuschauern synchron
4. Bei Erfolg: neue Befehle verfügbar; Anzeige auch beim SL

### 5) CERBERUS‑Protokoll
1. Spieler tippt CERBERUS → SL sieht Genehmigen/Ablehnen + Minuten
2. Wenn genehmigt: Spieler sieht rote Warnung; Zuschauer sehen denselben Text ohne Buttons
3. Spieler bestätigt (CONFIRM) → globaler Countdown (schwebender Timer + Chat)
4. Bei 0: Endsequenz, Aufräumen, automatisches Schließen der Interfaces

### 6) Alarm (global an/aus)
- An: SL‑Genehmigung → Sirene + rotes Overlay für alle
- Aus: SL‑STOP‑Knopf → zuverlässiges AudioHelper‑Stop + erzwungenes Stoppen
- „Alarm deaktiviert“ wird an alle gesendet, inkl. Zuschauer

### 7) Umgebungssteuerung
- TÜREN: LOCK/UNLOCK mit SL‑Auswahl/Genehmigung, synchrones Feedback
- LICHTER: DIM/SHUTDOWN/RESTORE mit SL‑Genehmigung
- GAS: SL wählt Ziele; Effekt synchron
- CRYO POD / CRYO RELEASE: Auswahl über Dialoge am SL‑Terminal

### 8) Sockets & Sync (wichtige Events)
`muthurCommand`, `muthurResponse`, `updateSpectators`, `requestCurrentMessages`, `syncMessages`, `statusResponse`, `hackingAttempt/hackStream/hackGlitch/hackStopGlitch/hackComplete`, `alarmControl`, `showCerberusGlobal/stopCerberus`, `sessionStatus`, `closeMuthurChats`.

### 9) Installation & Start
1. Modul installieren und aktivieren
2. Spieler öffnet MU/TH/UR (Button in den Szenen‑Notizen/Steuerungen)
3. SL genehmigt und wählt Zuschauer
4. Befehle im Terminal eingeben

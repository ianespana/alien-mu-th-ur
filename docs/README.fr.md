## Alien MU/TH/UR 6000 — Guide Complet

[English](../README.md) ·
[Español](README.es.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Italiano](README.it.md) ·
[Nederlands](README.nl.md) ·
[Norsk](README.no.md) ·
[Svenska](README.sv.md) ·
[Dansk](README.da.md)

MU/TH/UR 6000 pour Foundry VTT (ALIEN RPG) — Terminal rétro entièrement synchronisé (Joueur, Spectateur, MJ) avec affichage lettre‑par‑lettre, effets de glitch, sons, HACK piloté par le MJ et protocole CERBERUS global.

### 1) Fonctionnalités majeures
- Interface rétro: écriture progressive, scanline, teinte CRT, glitchs subtils/majeurs
- Mode Spectateur miroir: réplique fidèle de l’affichage joueur (y compris HACK/CERBERUS)
- Audio intégré: sons de frappe/retour/erreur/réponse avec volume et throttling
- HACK avec décision du MJ: succès/échec via mini‑fenêtre ancrée au terminal MJ
- Ordres spéciaux: 754/899/931/937/939/966 après hack réussi
- Protocole CERBERUS: approbation MJ, avertissement rouge, confirmation joueur, compte à rebours global, fermeture automatique
- Alarme: activation/arrêt synchronisés (overlay rouge + son), bouton STOP côté MJ
- Gestion portes/lumières/GAS/Cryo: requête joueur → approbation MJ → exécution synchrone
- Déplacement terminal (option): MJ et/ou joueurs/spectateurs, sans bloquer la saisie

### 2) Commandes Joueur (après ouverture du terminal)
- HELP: liste les commandes disponibles
- STATUS: renvoie l’état système (texte configurable par le MJ)
- /M <message>: envoie un message direct à MU/TH/UR
- CLEAR: efface l’historique (répercuté aux spectateurs)
- EXIT: ferme le terminal (répercuté aux spectateurs)
- HACK: lance le piratage; le MJ décide SUCCÈS/ÉCHEC; animations/glitchs synchronisés
- ORDERS 754|899|931|937|939|966: affichage de l’ordre spécial (post‑hack)
- CERBERUS: demande d’approbation MJ; si oui → avertissement rouge + boutons CONFIRM/CANCEL (joueur seulement) → compte à rebours global

### 3) Paramètres du module
- enableTypingSounds (client): active les sons de frappe
- typingSoundVolume (client): volume des sons de frappe (0..1)
- enableScanline / scanlineSize (client): effets visuels de scanline
- enableTypewriter (client): écriture lettre‑par‑lettre
- allowHack (monde): autorise la commande HACK
- allowDragGM / allowDragPlayers (monde): autorise le déplacement des terminaux pour MJ et/ou joueurs/spectateurs
- currentStatusKey / customStatusText (monde): statut renvoyé par STATUS
- captainUserIds / allowCaptainSpecialOrders (monde): rôles et privilèges de capitaine
- alarmSoundPath (monde): fichier audio utilisé pour l’alarme

### 4) Flux HACK (synchronisé)
1. Joueur tape HACK → requête au MJ (fenêtre ancrée au terminal MJ)
2. MJ clique SUCCÈS/ÉCHEC → renvoyé au joueur
3. Séquences de texte, glitchs et sons se déroulent en parallèle chez Joueur et Spectateurs
4. En cas de succès: nouveaux ordres disponibles; affichage aussi côté MJ

### 5) Protocole CERBERUS
1. Joueur tape CERBERUS → MJ reçoit une fenêtre (approuver/refuser + minutes)
2. Si approuvé: Joueur reçoit un avertissement rouge; Spectateurs voient le même texte sans boutons
3. Joueur confirme (CONFIRM) → compte à rebours global (minuteur flottant + chat)
4. À 0: séquence de fin, nettoyage, fermeture automatique des interfaces

### 6) Alarme (activation/arrêt global)
- Activation: approbation MJ → son + overlay rouge chez tous
- Arrêt: bouton STOP MJ → arrêt fiable via AudioHelper + arrêt forcé des instances
- Message “Alarme désactivée” diffusé à tous, y compris spectateurs

### 7) Contrôles d’environnement
- DOORS: LOCK/UNLOCK avec sélection/validation côté MJ et feedback synchronisé
- LIGHTS: DIM/SHUTDOWN/RESTORE avec validation MJ
- GAS: sélection des cibles par le MJ, application synchronisée
- CRYO POD / CRYO RELEASE: sélection via fenêtres ancrées au terminal MJ

### 8) Sockets & synchro (principaux événements)
`muthurCommand`, `muthurResponse`, `updateSpectators`, `requestCurrentMessages`, `syncMessages`, `statusResponse`, `hackingAttempt/hackStream/hackGlitch/hackStopGlitch/hackComplete`, `alarmControl`, `showCerberusGlobal/stopCerberus`, `sessionStatus`, `closeMuthurChats`.

### 9) Installation & démarrage
1. Installez et activez le module
2. Le joueur ouvre MU/TH/UR (bouton dans les notes/outils)
3. Le MJ autorise et sélectionne les spectateurs
4. Tapez les commandes dans le terminal

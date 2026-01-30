## Alien MU/TH/UR 6000 — Guía Completa

[English](../README.md) ·
[Español](README.es.md) ·
[Français](README.fr.md) ·
[Deutsch](README.de.md) ·
[Italiano](README.it.md) ·
[Nederlands](README.nl.md) ·
[Norsk](README.no.md) ·
[Svenska](README.sv.md) ·
[Dansk](README.da.md)

MU/TH/UR 6000 para Foundry VTT (ALIEN RPG): terminal retro totalmente sincronizado entre Jugador, Espectador y DJ: efecto de máquina de escribir, estética CRT/scanline, glitches, audio, HACK controlado por el DJ y protocolo CERBERUS global.

### 1) Funciones Principales
- Interfaz retro: máquina de escribir, scanline, tinte CRT, glitches sutiles/intensos
- Modo Espejo para Espectadores: copia fiel de la vista del Jugador (incluye HACK/CERBERUS)
- Audio integrado: tecleo/retorno/error/respuesta con volumen y limitación
- HACK con decisión del DJ: ÉXITO/FALLO mediante mini‑ventana anclada al terminal del DJ
- Órdenes Especiales: 754/899/931/937/939/966 tras hack exitoso
- Protocolo CERBERUS: aprobación del DJ, aviso rojo, confirmación del jugador, cuenta atrás global, cierre automático
- Alarma: activación/parada sincronizadas (overlay rojo + sirena), botón STOP en el encabezado del DJ
- Entorno: puertas/luces/GAS/Cryo mediante petición del jugador → aprobación del DJ → ejecución sincronizada
- Arrastre de terminal (opcional): para DJ y/o jugadores/espectadores, sin bloquear la entrada

### 2) Comandos del Jugador
- HELP: lista los comandos disponibles
- STATUS: muestra el estado de MU/TH/UR (texto configurable por el DJ)
- /M <mensaje>: mensaje directo a MOTHER
- CLEAR: limpia el chat (reflejado a espectadores)
- EXIT: cierra el terminal (reflejado a espectadores)
- HACK: inicia el hack; el DJ decide ÉXITO/FALLO; animaciones/glitches sincronizados
- ORDERS 754|899|931|937|939|966: muestra la Orden Especial (post‑hack)
- CERBERUS: solicita aprobación del DJ; si se aprueba → aviso rojo + CONFIRM/CANCEL (solo jugador) → cuenta atrás global

### 3) Ajustes
- enableTypingSounds (cliente), typingSoundVolume (cliente)
- enableScanline / scanlineSize (cliente), enableTypewriter (cliente)
- allowHack (mundo)
- allowDragGM / allowDragPlayers (mundo)
- currentStatusKey / customStatusText (mundo)
- captainUserIds / allowCaptainSpecialOrders (mundo)
- alarmSoundPath (mundo)

### 4) Flujo de HACK (sincronizado)
1. El jugador escribe HACK → el DJ recibe diálogo de decisión (anclado al terminal del DJ)
2. El DJ pulsa ÉXITO/FALLO → se devuelve al jugador
3. Secuencias de texto, glitches y sonidos corren en sincronía en Jugador y Espectadores
4. Con éxito: nuevas órdenes disponibles; también se muestran al DJ

### 5) Protocolo CERBERUS
1. El jugador escribe CERBERUS → el DJ ve aprobar/rechazar + minutos
2. Si se aprueba: el jugador ve aviso rojo; los espectadores ven el mismo texto sin botones
3. El jugador confirma (CONFIRM) → cuenta atrás global (temporizador flotante + chat)
4. En 0: secuencia final, limpieza, cierre automático de interfaces

### 6) Alarma (global on/off)
- On: aprobación del DJ → sirena + overlay rojo para todos
- Off: botón STOP del DJ → parada fiable con AudioHelper + parada forzada de instancias
- “Alarma desactivada” se difunde a todos, incluidos espectadores

### 7) Controles de Entorno
- PUERTAS: LOCK/UNLOCK con selección/aprobación del DJ, feedback sincronizado
- LUCES: DIM/SHUTDOWN/RESTORE con aprobación del DJ
- GAS: el DJ elige objetivos; efecto sincronizado
- CRYO POD / CRYO RELEASE: selección mediante diálogos anclados al terminal del DJ

### 8) Sockets y Sincronización (eventos principales)
`muthurCommand`, `muthurResponse`, `updateSpectators`, `requestCurrentMessages`, `syncMessages`, `statusResponse`, `hackingAttempt/hackStream/hackGlitch/hackStopGlitch/hackComplete`, `alarmControl`, `showCerberusGlobal/stopCerberus`, `sessionStatus`, `closeMuthurChats`.

### 9) Instalación y Arranque
1. Instala y activa el módulo
2. El jugador abre MU/TH/UR (botón en notas/controles de escena)
3. El DJ aprueba y selecciona espectadores
4. Teclea comandos en el terminal

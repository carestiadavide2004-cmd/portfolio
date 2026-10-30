# Carestia Web — decisioni di design

**Direzione:** "Insegne accese". Pescara di notte: ogni sito è l'insegna accesa dell'attività. Base scura viola-blu, colori neon per categoria.

**Font:** Archivo (titoli, larghezza 112–125%, peso 750–900) + Instrument Sans (testi, 400–600).

**Palette**
- `#0C0820` base "notte adriatica" (sfondo, testo su colori pieni)
- `#17112F` superfici di carte e moduli
- `#FF3B5C` rosso, ristoranti
- `#3E7BFF` blu, stabilimenti e bar
- `#9D5CFF` viola, bellezza
- `#C6FF3D` verde acido, palestre + WhatsApp/azioni
- `#F6F3FF` bianco luna, testo + negozi

**Firma:** scena 3D (Three.js) con pannelli di vetro coi veri screenshot che volano scorrendo e atterrano sulle carte; sfondo shader "liquido di luce" che cambia tinta per sezione e per filtro.

**Animazione:** livello 3 (GSAP + ScrollTrigger + Flip), scorrimento nativo, mai sezioni bloccate.

**Regole da non violare**
- Testo su colori pieni sempre in `#0C0820`; testo su sfondo scuro in bianco o `#CFC8EA`.
- Lo shader ha un tetto di luminosità (`uCap` in scene.js): non alzarlo, protegge il contrasto.
- Niente backdrop-filter (pesa con la scena 3D dietro).
- Hero: sfondo in WebGL (scene.js), pannelli come veri <img> in CSS 3D (panels.js), sempre dietro il piano dello schermo (mai ingranditi, mai sfocati); evitano titolo, sottotitolo e pulsanti.
- Puntatore "goccia di luce" (cursor.js) solo con mouse; il focus da tastiera resta quello del sito.
- Animare solo transform, opacity, clip-path.
- Dati dei lavori e contatti solo in config.js.

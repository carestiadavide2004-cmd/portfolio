/* =========================================================
   Carestia Web — config.js
   Tutti i dati del sito in un posto solo: contatti, social, modulo e lavori.
   Le istruzioni per aggiungere un nuovo sito sono in fondo al file.
   ========================================================= */

window.CW_CONFIG = {

  contatti: {
    nome: "Davide Carestia",
    brand: "Carestia Web",
    citta: "Pescara",
    telefono: "+393240806426",              // usato per "Chiama"
    telefonoVisibile: "+39 324 08 06 426",  // come viene scritto sul sito
    whatsapp: "393240806426",               // solo numeri, con prefisso 39
    messaggioWhatsapp: "Ciao Davide, ho visto il tuo portfolio e vorrei un sito per la mia attività.",
    email: "carestia.davide2004@gmail.com"
  },

  // Lascia "" per nasconderli. Esempio: instagram: "https://www.instagram.com/carestiaweb/"
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: ""
  },

  // Modulo contatti con Web3Forms (gratis): crea la chiave su https://web3forms.com
  // con la tua email e incollala qui. Finché resta questo segnaposto il modulo è in modalità demo
  // e propone di mandare lo stesso messaggio su WhatsApp. La chiave Web3Forms è pubblica per natura:
  // non è una password, ma lega il modulo solo alla tua email.
  modulo: {
    web3formsKey: "INSERISCI_LA_TUA_CHIAVE_WEB3FORMS",
    oggetto: "Nuova richiesta dal portfolio Carestia Web"
  },

  // Ogni categoria ha il suo colore neon: lo usano filtri, carte e sfondo 3D.
  categorie: [
    { id: "ristoranti",   nome: "Ristoranti",         colore: "#FF3B5C" },
    { id: "stabilimenti", nome: "Stabilimenti e bar", colore: "#3E7BFF" },
    { id: "bellezza",     nome: "Bellezza",           colore: "#9D5CFF" },
    { id: "negozi",       nome: "Negozi",             colore: "#F6F3FF" },
    { id: "palestre",     nome: "Palestre",           colore: "#C6FF3D" }
  ],

  lavori: [
    {
      id: "braciere",
      nome: "Braciere",
      categoria: "ristoranti",
      tipo: "Braceria",
      url: "https://carestiadavide2004-cmd.github.io/braciere/",
      descrizione: "Una braceria d'autore: braci che si muovono, carta dei vini e prenotazione con la scelta del tavolo sulla piantina.",
      punti: ["Scelta del tavolo", "Prenotazione online", "Carta dei vini"]
    },
    {
      id: "trattoria-da-mario",
      nome: "Trattoria da Mario",
      categoria: "ristoranti",
      tipo: "Trattoria",
      url: "https://carestiadavide2004-cmd.github.io/trattoria-da-mario/",
      descrizione: "Il mio primo sito: una trattoria di famiglia con menù completo, galleria dei piatti e richiesta del tavolo.",
      punti: ["Menù digitale", "Galleria piatti", "Richiesta tavolo"]
    },
    {
      id: "riva-bianca",
      nome: "Riva Bianca",
      categoria: "stabilimenti",
      tipo: "Stabilimento balneare",
      url: "https://carestiadavide2004-cmd.github.io/bozza-stabilimento-riva-bianca/",
      descrizione: "Uno stabilimento sul mare dove scegli l'ombrellone dalla mappa e sfogli il menù come un libro.",
      punti: ["Mappa ombrelloni", "Menù a libro", "Galleria spiaggia"]
    },
    {
      id: "il-pontile",
      nome: "Il Pontile",
      categoria: "stabilimenti",
      tipo: "Bar sul mare",
      url: "https://carestiadavide2004-cmd.github.io/bozza-bar-il-pontile/",
      descrizione: "Un bar in fondo alla passerella: le serate in programma, il menù e le richieste per feste ed eventi.",
      punti: ["Calendario serate", "Preventivo per feste", "Menù del bar"]
    },
    {
      id: "studio-riflesso",
      nome: "Studio Riflesso",
      categoria: "bellezza",
      tipo: "Parrucchiere donna e uomo",
      url: "https://carestiadavide2004-cmd.github.io/bozza-parrucchiere-studio-riflesso/",
      descrizione: "Un salone donna e uomo con prenotazioni online collegate ad Agendo, la mia web app per gli appuntamenti.",
      punti: ["Prenotazioni con Agendo", "Listino servizi", "Donna e uomo"]
    },
    {
      id: "maison-lumiere",
      nome: "Maison Lumière",
      categoria: "negozi",
      tipo: "Boutique",
      url: "https://carestiadavide2004-cmd.github.io/maison-lumiere/",
      descrizione: "Una boutique elegante con pannello admin privato: la titolare aggiunge e modifica i prodotti da sola.",
      punti: ["Pannello admin", "Catalogo prodotti", "Anteprime ed eventi"]
    },
    {
      id: "blackout-store",
      nome: "Blackout Store",
      categoria: "negozi",
      tipo: "Streetwear",
      url: "https://carestiadavide2004-cmd.github.io/blackout-store/",
      descrizione: "Un negozio streetwear dal carattere urbano: il drop della stagione, il lookbook e il carrello.",
      punti: ["Catalogo drop", "Lookbook", "Carrello e preferiti"]
    },
    {
      id: "titan-gym",
      nome: "Titan Gym",
      categoria: "palestre",
      tipo: "Palestra",
      url: "https://carestiadavide2004-cmd.github.io/titan-gym/",
      descrizione: "Una palestra con tanta energia: corsi, abbonamenti a confronto e un giro virtuale della sala.",
      punti: ["Abbonamenti", "Corsi", "Tour della sala"]
    }
  ]
};

/* ---------------------------------------------------------
   COME AGGIUNGERE UN NUOVO SITO (5 minuti)

   1. Scegli un id corto, minuscolo e senza spazi, per esempio "pizzeria-luna".
   2. Metti le immagini in assets/img/lavori/ con questi nomi:
        pizzeria-luna-computer.webp   (1200 × 750, la home vista da computer)
        pizzeria-luna-telefono.webp   ( 480 × 1040, la home vista da telefono)
   3. (Facoltativo) Metti i video di anteprima in assets/video/:
        pizzeria-luna-computer.mp4    (800 × 500, 5-6 secondi, muto, max 600 KB)
        pizzeria-luna-telefono.mp4    (360 × 780, 5-6 secondi, muto, max 600 KB)
      Se non hai i video aggiungi  video: false  nella scheda del lavoro.
   4. Copia una scheda qui sopra dentro "lavori", incollala dove vuoi che compaia
      e cambia id, nome, categoria (una di quelle in "categorie"), tipo, url,
      descrizione e i 3 punti forti.
   5. Salva e pubblica. Filtri, contatori, carte, anteprime 3D e schede si aggiornano da soli.

   Nuova categoria? Aggiungila in "categorie" con un id, il nome del filtro e un colore.
   Hai cambiato numero o email? Aggiornali in "contatti" e anche nei dati per Google
   in index.html (cerca "application/ld+json").
   --------------------------------------------------------- */

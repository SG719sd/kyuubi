# 📕 DOCUMENTAZIONE FUNZIONALE: KYUUBI HUB MANAGER & PIATTAFORMA EAZYHUBS

---

## 1. INTRODUZIONE E OBIETTIVI DI BUSINESS

**Kyuubi Hub Manager** è una piattaforma gestionale omnicomprensiva progettata per attività commerciali, centri estetici, saloni di bellezza, studi medici, ristoranti, pizzerie e retail multi-sede.

Il sistema consente a ciascun imprenditore o gestore di gestire uno o molteplici **Hub** (punti vendita o sedi aziendali), configurando autonomamente i moduli operativi desiderati, il proprio staff con permessi differenziati e l'integrazione con la vetrina pubblica **EazyHubs**.

---

## 2. MODELLO MULTI-TENANT E GERARCHIA DEI RUOLI

Ogni utente registrato può possedere o far parte di più Hub con ruoli differenti:

### 2.1 Ruoli e Permessi

| Ruolo | Poteri & Accessi | Visibilità |
| :--- | :--- | :--- |
| **Titolare / Admin** | Accesso completo: Dati fiscali e fatturazione, gestione membri dello staff, cancellazione hub, gestione listini, orari e agenda | Totale su tutti i moduli dell'Hub |
| **Responsabile** | Gestione operativa: Modifica cataloghi (servizi, piatti, prodotti), gestione orari e visualizzazione report | Tutti i moduli operativi (esclusa fatturazione e cancellazione hub) |
| **Collaboratore** | Operatività quotidiana: Visualizzazione della propria agenda, gestione appuntamenti e consultazione rubrica | Moduli operativi con permessi di scrittura limitati |
| **Lettore / Receptionist** | Consultazione dell'agenda, elenco servizi e prodotti | Sola lettura |

---

## 3. MODULI FUNZIONALI DELLA PIATTAFORMA

### 3.1 🏢 Anagrafica & Brand Identity Hub
- **Configurazione Brand**: Nome, Slug URL univoco (es. `eazyhubs.com/mio-locale`), Palette cromatica (Emerald, Indigo, Rose, Amber, Slate) e stile di visualizzazione.
- **Dati di Contatto**: Indirizzo fisico, CAP, Città, Provincia, Telefono, Email, Sito Web, Links Social.
- **Orari & Descrizione**: Testo orari di apertura al pubblico e presentazione aziendale.
- **Switch Moduli Dinamici**: Possibilità di attivare o disattivare a caldo:
  - 🛍️ *Modulo Prodotti* (Magazzino e vendita articoli)
  - 💆 *Modulo Servizi* (Listino trattamenti e prestazioni)
  - 🍕 *Modulo Piatti* (Menu digitale ristorazione)
  - 📅 *Modulo Prenotazioni & Agenda* (Booking online e calendario)

---

### 3.2 ⚖️ Dati Fiscali & Fatturazione Elettronica (`Billing`)
- Gestione dei dati per l'emissione e ricezione di fatture elettroniche:
  - Ragione Sociale e Indirizzo Legale
  - Partita IVA e Codice Fiscale
  - Codice Univoco Destinatario (SDI) a 7 caratteri
  - Indirizzo PEC certificato
- Accesso rigidamente protetto tramite policy RLS (riservato esclusivamente agli Admin dell'Hub).

---

### 3.3 ✂️ Modulo Servizi & Listini Prestazioni
- **Catalogazione**: Categorie personalizzabili (es. Capelli, Estetica, Massaggi, Consulenze).
- **Parametri Economici & Temporali**: Prezzo al pubblico (€), Costo interno (€), Aliquota IVA (0%, 4%, 10%, 22%), Durata stimata in minuti.
- **Richiesta Operatore**: Flag per indicare se il servizio necessita di uno specifico professionista assegnato.
- **Vetrina EazyHubs**: Switch per rendere il servizio visibile o nascosto al pubblico.
- **Immagini Ottimizzate**: Upload con compressione WebP automatica ad alta risoluzione.

---

### 3.4 📦 Modulo Prodotti, Magazzino & Inventario
- **Gestione Scorte**: Giacenza nuovo, giacenza usato, livello di scorta minima con alert automatico (`quantita_alert`).
- **Codici Identificativi**: Codice a barre (EAN/UPC) e codice SKU per lettura con lettori barcode e terminali cassa.
- **Listino Prezzi Multiplo**: Prezzo fornitore, prezzo di listino, prezzo di vendita al pubblico e prezzo usato.
- **Localizzazione**: Posizione fisica in magazzino (scaffale/cassetto).

---

### 3.5 🍽️ Modulo Ristorazione, Piatti & Menu Digitale
- **Catalogazione Gastronomica**: Antipasti, Primi, Secondi, Pizze, Dessert, Bevande e Vini.
- **Allergeni & Ingredienti**: Elenco dettagliato per conformità alle normative sanitarie e alimentari.
- **Filtri Dietetici**: Badge espliciti per preparazioni *Vegetariane*, *Vegane* e *Senza Glutine (Gluten-Free)*.
- **Disponibilità Giornaliera**: Flag rapido per indicare piatti esauriti o non disponibili in tempo reale nel menu digitale.

---

### 3.6 👥 Modulo Staff & Professionisti
- **Anagrafica Collaboratori**: Nome, ruolo aziendale, colore identificativo in agenda, foto profilo ottimizzata.
- **Abilitazioni e Prezzi Personalizzati**: Matrice che consente a ciascun professionista di erogare specifici servizi con tempi o prezzi differenti dal listino base dell'hub.
- **Pianificazione Orari**: Configurazione dei turni settimanali individuali con gestione doppio turno (mattina / pomeriggio) o giorni di riposo.

---

### 3.7 📖 Modulo Rubrica Clienti & Fornitori
- Anagrafica centralizzata dell'Hub con Nome, Cognome, Telefono, Email, Indirizzo e Note riservate.
- Collegamento immediato con lo storico degli appuntamenti e degli ordini.

---

### 3.8 🔒 Conformità Privacy & Firma Digitale (GDPR)
- Registro immutabile dei consensi prestati da ciascun utente in fase di registrazione o accettazione contratti.
- Memorizzazione automatica di:
  - Firma digitale (Nome e Cognome per esteso)
  - Versione della policy accettata
  - **Indirizzo IP certificato** estratto dagli header HTTP sicuri (`x-forwarded-for`, `x-real-ip`)
  - Timestamp esatto di consenso

# SportsHub ⚽

Web app per cercare squadre di calcio, salvarle tra i preferiti e consultare prossimi eventi, ultimi risultati e informazioni sullo stadio.

## Indice 📋

- [Funzionalità](#funzionalità-)
- [Tecnologie](#tecnologie-️)
- [Avvio del progetto](#avvio-del-progetto-)
- [Struttura del progetto](#struttura-del-progetto-)
- [API utilizzata](#api-utilizzata-)

## Funzionalità ✨

- 🔍 Ricerca squadra per nome ([searchteams.php](https://www.thesportsdb.com/free_sports_api))
- ⭐ Aggiunta/rimozione dai preferiti (massimo 4), salvati in `localStorage`
- 🔔 Toast di conferma su aggiunta, rimozione e cancellazione totale dei preferiti (con conferma via modale per l'azione distruttiva)
- 📅 Dettagli squadra: prossimi eventi, ultimi risultati (con badge vittoria/sconfitta/pareggio) e informazioni sullo stadio
- 🏆 Esplorazione rapida dei principali campionati europei dalla sidebar (Serie A, Premier League, Liga, Bundesliga, Ligue 1)
- ⏳ Spinner di caricamento e messaggi di errore durante le chiamate all'API
- ♿ Attenzione all'accessibilità: label e `aria-label` sui controlli, `aria-live` sui toast

## Tecnologie 🛠️

- HTML5 / CSS3 / JavaScript (vanilla, no framework)
- [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/) per layout e componenti
- [TheSportsDB API](https://www.thesportsdb.com/api.php) come fonte dati

## Avvio del progetto 🚀

Non richiede build né dipendenze da installare: è un sito statico.

1. Clona il repository:
   ```bash
   git clone https://github.com/sic9522/Settimana-7-Progetto-Finale.git
   ```
2. Apri [index.html](index.html) nel browser, oppure servilo con un server locale (es. estensione "Live Server" di VS Code).

## Struttura del progetto 📁

```
index.html
assets/
  css/
    style.css
  javascript/
    script.js
```

## API utilizzata 🌐

I dati sono forniti da [TheSportsDB](https://www.thesportsdb.com/) tramite la sua [API pubblica v1](https://www.thesportsdb.com/api.php), usando la chiave demo gratuita.

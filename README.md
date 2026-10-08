# Numeri casuali

App per il telefono che estrae numeri a caso in un intervallo, per esempio i numeri di registro, senza chiamare due volte lo stesso alunno.

## Come si usa

- **Intervallo:** tocca il numero sotto «DA» o sotto «A», scrivi il nuovo valore e premi Invio (o tocca altrove). Se avevi già estratto dei numeri, l'app chiede conferma perché li azzera.
- **Estrai:** il pulsante blu in basso a destra. Il numero compare grande al centro.
- **Contatore:**
  - Senza ripetizione: «12/26» significa 12 numeri estratti su 26 disponibili. Quando sono usciti tutti compare «Finiti!» e il pulsante si spegne.
  - Con «Consenti ripetizione» acceso: lo stesso numero può uscire più volte, e il contatore dice solo quante estrazioni hai fatto.
- **Menu ⋮** (nel riquadro):
  - *Storico estratti*: i numeri usciti, dal più recente.
  - *Escludi numeri*: tocca un numero per escluderlo (es. un assente) o riammetterlo; «Riammetti tutti» li reintegra tutti.
- **Resetta:** dopo una conferma azzera i numeri estratti. **I numeri esclusi restano esclusi.**

Tutto resta salvato nel telefono anche se chiudi l'app, fino a «Resetta». I dati non escono dal telefono: disinstallando l'app si perdono.

## Installarla sul telefono Android

1. Apri l'indirizzo dell'app in **Chrome** (serve un indirizzo `https://`).
2. Menu ⋮ di Chrome → **«Installa app»** (o «Aggiungi a schermata Home»).
3. Apri l'app dall'icona col dado: si apre a schermo intero e funziona anche senza internet.

## Pubblicare una modifica

1. Modifica i file nella cartella `src/`.
2. In `src/sw.js` alza il numero di versione: `random-picker-v1` → `random-picker-v2` (poi v3, v4…). **Se lo dimentichi, il telefono continua a usare la versione vecchia.**
3. Prova sul PC: dal terminale, nella cartella `src/`, `python -m http.server 8000`, poi apri `http://localhost:8000/` in Chrome.
4. Fai il commit e il push verso GitHub (`git push github main`): GitHub Pages pubblica da solo la cartella `src/` in un paio di minuti, all'indirizzo `https://teacheratwork.github.io/random-picker/`. Fai anche `git push origin main` per la copia su Forgejo.
5. Sul telefono apri l'app, chiudila e riaprila: alla seconda apertura usa la versione nuova.

## Icone

Sono generate da `tools/make_icons.py` (Python + Pillow): `python tools/make_icons.py` dalla cartella del progetto.

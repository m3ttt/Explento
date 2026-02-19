# 🥀 Explento

Explento è un'applicazione web full-stack progettata per valorizzare il territorio di Trento attraverso una distribuzione più equilibrata delle informazioni su luoghi di interesse, eventi e punti culturali.

L'obiettivo è ridurre la concentrazione dei flussi turistici nelle sole aree centrali e favorire la scoperta di luoghi meno conosciuti ma significativi per il patrimonio cittadino.

---

## Contesto del Progetto

La città di Trento possiede un ampio patrimonio storico, culturale e naturalistico. Tuttavia, l’attenzione di turisti e cittadini si concentra spesso su un numero limitato di attrazioni.

Explento nasce per:

- migliorare la valorizzazione del territorio  
- rendere le informazioni più accessibili e organizzate  
- supportare una distribuzione più equilibrata dei flussi  
- fornire una piattaforma moderna e centralizzata  

---

## Backend

Il backend è sviluppato con Node.js e TypeScript utilizzando Express.js.

La struttura segue una separazione chiara delle responsabilità:

- **routes/** → definizione degli endpoint e associazione delle rotte  
- **controllers/** → implementazione della logica delle richieste (handler Express)  
- **src/** → codice sorgente principale  
- **testing/** → test automatizzati  

### Tecnologie

- Node.js  
- Express.js  
- TypeScript  
- Jest  
- Mongoose  

### Avvio

```bash
cd backend
npm install
npm run dev
```

### Test

```bash
npm run test
```

---

## Frontend

Single Page Application sviluppata con:

- Vue.js  
- Vue Router  
- Vite  
- TypeScript  
- Shadcn-Vue  
- TailwindCSS  

### Avvio

```bash
cd frontend
npm install
npm run dev
```

---

## API

Documentazione definita in:

```
oas3.yaml
```

Compatibile con Swagger UI e disponibile anche al seguente link:

https://explento.docs.apiary.io

---

## CI/CD

Il progetto utilizza **GitHub Actions** per:

- eseguire automaticamente i test ad ogni push/pull request  
- verificare la stabilità del codice  
- effettuare il deploy automatico su Render  

Questo garantisce un flusso di integrazione e distribuzione continua (CI/CD).

---

## Architettura

Frontend (Vue SPA)  
⬇  
Backend (API REST TypeScript)  
⬇  
MongoDB  

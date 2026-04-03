# SpritPriceChecker

Eine statische Web-App für Spritpreise und E-Ladesäulen in deiner Nähe, gehostet auf GitHub Pages.

## 🚀 Live-App

👉 **[https://zeroks77.github.io/SpritPriceChecker/](https://zeroks77.github.io/SpritPriceChecker/)**

## 🏗️ Architektur

Die Anwendung ist als rein statische Web-App (Frontend-only) umgesetzt – ohne eigenes Backend.

```
[ GitHub Pages (statische Website) ]
                ↓
     [ React App im Browser ]
                ↓
   ┌────────────┴────────────┐
   ↓                         ↓
[ Tankerkönig API ]   [ OpenChargeMap ]
[ Routing API (ORS) ]
```

### Technologien

| Komponente | Technologie |
|---|---|
| Framework | React 19 |
| Build-Tool | Vite |
| Karten | Leaflet + react-leaflet |
| Styling | Tailwind CSS v4 |
| HTTP-Client | Axios |
| Deployment | GitHub Pages via GitHub Actions |

### APIs

| Funktion | API |
|---|---|
| Spritpreise | [Tankerkönig API](https://creativecommons.tankerkoenig.de/) |
| E-Ladesäulen | [Open Charge Map](https://openchargemap.org/site/develop/api) |
| Routing | [OpenRouteService](https://openrouteservice.org/) |
| Standort | Browser Geolocation API |

## ⚙️ Einrichtung

### Voraussetzungen

- Node.js 20+
- npm

### Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### API-Keys einrichten

Beim ersten Start die App öffnen und unter **⚙️ Einstellungen** folgende API-Keys eintragen:

1. **Tankerkönig API-Key** – kostenlos beantragen unter [creativecommons.tankerkoenig.de](https://creativecommons.tankerkoenig.de/)
2. **Open Charge Map API-Key** – kostenlos beantragen unter [openchargemap.org](https://openchargemap.org/site/develop/api)
3. **OpenRouteService API-Key** – kostenlos beantragen unter [openrouteservice.org](https://openrouteservice.org/dev/#/signup)

> ⚠️ API-Schlüssel werden ausschließlich lokal im Browser (LocalStorage) gespeichert.

## 🚢 Deployment

Der Build und das Deployment auf GitHub Pages erfolgt automatisch über GitHub Actions beim Push auf den `main`-Branch.

```bash
# Manueller Build
npm run build
```

Die App wird unter `https://zeroks77.github.io/SpritPriceChecker/` veröffentlicht.

## 📋 Features

- 📍 **Standortermittlung** via Browser Geolocation API (alternativ: manuell)
- ⛽ **Spritpreise** von Tankstellen in der Nähe (Tankerkönig API)
  - Super E5, E10, Diesel
  - Öffnungszeiten, Entfernung
  - Sortierung nach Distanz
- ⚡ **E-Ladesäulen** (Open Charge Map)
  - Anzahl der Anschlüsse
  - Betriebsstatus
- 🗺️ **Routenplanung** (OpenRouteService)
  - Auto, Fahrrad, zu Fuß
  - Distanz- und Zeitangabe
- 🗺️ **Interaktive Karte** (Leaflet + OpenStreetMap)

## ⚠️ Bekannte Einschränkungen

- **CORS**: Manche APIs blockieren direkte Browser-Zugriffe. Die verwendeten APIs unterstützen CORS.
- **API-Keys im Frontend**: Da kein Backend existiert, werden API-Keys im Browser verwendet. Diese sind für öffentliche APIs ausgelegt.
- **Kein serverseitiger Speicher**: Alle Einstellungen werden lokal im Browser gespeichert (LocalStorage).

# Stockholm Holiday Planner & SL Public Transport Database

A database-driven travel planning application that combines Stockholm tourism and SL public transport network information into a calm, Scandinavian editorial interface.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Leaflet**.

---

## 🇸🇪 Design Philosophy: Scandinavian Editorial Minimalism

### Core Principle: Clarity through Restraint
The interface embodies the discipline of minimalist monochrome design paired with the calm, functional aesthetic of Scandinavian travel systems.

* **Monochrome Palette with Nordic Blue Accents:**
  * Foreground: `#111111`
  * Background: `#FFFFFF`
  * Surfaces: `#F5F5F2` / `#EBEBE6`
  * Nordic Blue Accent: `#1E4D6B` / `#E8F0F4` (used selectively for transport lines, map markers, and interactive states)
  * Functional Status Indicators: `#315C45` (on-time), `#8A641C` (moderate delay), `#8A3333` (disruptions)
* **Typography Hierarchy:**
  * **Display / Hero:** *Playfair Display* (Editorial Serif)
  * **UI / Body:** *Inter* (Clean Scandinavian Sans-Serif)
  * **Technical / Transport:** *JetBrains Mono* (Punctuality, timers, codes)
* **Sharp Geometry:**
  * 2px–4px radius for cards and buttons
  * Precise hairline (`1px #D9D9D4`) and thin (`1px #111111`) borders
  * Generous negative space and architectural grid texture without gaudy SaaS gradients or heavy shadows.

---

## ⚡ Core Features

1. **Destination & Attraction Directory**
   * Curated Stockholm points of interest: Vasa Museum, Kungliga Slottet, Skansen, Moderna Museet, Stadshuset, ABBA The Museum, Monteliusvägen, Café Pascal, Pelikan, Grand Hôtel, etc.
   * Filter by category (Museums, Historic Sites, Dining, Fika, Hotels, Viewpoints, Parks), district, walking time (≤5 min), and high reliability (≥95%).
   * Detailed modal inspector with operational hours, admission fees, and direct SL transit stop metadata.

2. **Public Transport Network (SL) Hub**
   * Overview of SL trunk corridors: Blue Line (10/11), Red Line (13/14), Green Line (17/18/19), Spårvagn Tram 7, Djurgårdsfärjan Ferry 82, and Arlanda Pendeltåg 40.
   * Stop inspector displaying connected lines, departures, nearby sights, and historical punctuality ratings.

3. **Journey & Route Planner**
   * Origin & Destination calculation connecting any Stockholm venue, hotel, or transit station.
   * Vertical editorial timeline visualizing walking legs, transfer stations, platform changes, and intermediate stops.
   * Real-time timetable reliability rating for each route option.

4. **Historical Delay & Reliability Analytics**
   * 4 large numerical KPIs: System Average Delay (`2.1 min`), On-Time Rate (`95.1%`), Monitored Services (`51,700`), and Top Performing Route.
   * Minimalist SVG "Delay by Hour" curve displaying bottleneck rush hours (08:00 and 17:00) with interactive inspection.
   * Editorial route performance table with on-time percentages and disruption causes.

5. **Tourism + Transport Integration ("Accessible Stockholm")**
   * Proximity and punctuality strategies: Top Punctuality (≥96%), Station Access (≤3 min walk), Waterfront Scenic Transit (Ferry/Tram), and Fika Near Metro.
   * Transit accessibility index (0–100) computed for each destination.

6. **"Ask Stockholm" Natural Language Search**
   * Minimalist query interface translating everyday English/Swedish phrases (e.g. *"Find museums near central Stockholm that I can reach by public transport"*) into structured database queries.
   * Displays interpreted intent, matched criteria, logistical transit advice, and direct destination cards.

7. **Multi-Stop Trip Itinerary Builder**
   * Day-by-day scheduler (Day 01, Day 02, Day 03).
   * Reorder stops up/down, remove destinations, or add from directory.
   * Automatically calculates public transport links between consecutive items.
   * Saved in browser `localStorage` and ready for clean printing.

8. **Interactive Editorial Cartography**
   * Full-featured Leaflet map with CartoDB Positron minimalist grayscale tiles.
   * Monochrome pins for attractions, Nordic blue pins for SL stops, and color-coded SL line polylines.
   * Interactive popups with instant route calculation and itinerary triggers.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

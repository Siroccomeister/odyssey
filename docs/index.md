# Kenya Bike Odyssey - testride August 2026

A solo gravel weekend on part of the Trans-Kenya route: Bamboo Garden Lodge → Fisherman's Camp (Lake Naivasha) → Hell's Gate National Park → Eburru → Gilgil.

## The ride

<style>
  #trip-map { width: auto; height: 480px; margin: 0; border-radius: 8px; }
  #elevation-chart-wrap { height: 220px; margin: 0.75rem 0; }
  #trip-tabs { display: flex; gap: 0.5rem; margin: 1rem 0 0.75rem; }
  .trip-tab {
    padding: 0.4rem 1rem; border-radius: 999px; border: 2px solid var(--tab-color, #999);
    background: transparent; color: var(--tab-color, #333); font-weight: 600; cursor: pointer;
  }
  .trip-tab.active { background: var(--tab-color, #999); color: #fff; }
  #trip-stats { display: flex; gap: 1.5rem; margin: 0.75rem 0; flex-wrap: wrap; }
  .trip-stat { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
  .trip-stat-value { font-size: 1.4rem; font-weight: 700; }
  .trip-stat-label { font-size: 0.75rem; opacity: 0.7; }
  #photo-strip { display: flex; gap: 0.75rem; overflow-x: auto; padding: 0.5rem 0; margin-top: 0.75rem; }
  .trip-photo { margin: 0; flex: 0 0 auto; }
  .trip-photo img { height: 140px; border-radius: 6px; display: block; }
  .trip-photo figcaption { font-size: 0.75rem; opacity: 0.75; max-width: 160px; }
  .trip-popup .mapboxgl-popup-content { padding: 6px; }
</style>

<div id="trip-tabs"></div>
<div id="trip-stats"></div>
<div id="trip-map"></div>
<div id="elevation-chart-wrap"><canvas id="elevation-chart"></canvas></div>
<div id="photo-strip" hidden></div>

<link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist/css/glightbox.min.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist/js/glightbox.min.js"></script>
<script src="javascripts/trip.js?v=7"></script>

<p><small>Tracks are the actual recorded GPS traces from the ride (via Garmin → RideWithGPS), not the planned route. Hover the elevation chart to see the matching point on the map.</small></p>

## Recorded tracks

- [Saturday: Bamboo Garden Lodge → Fisherman's Camp](https://ridewithgps.com/trips/409139186) — 63.7 km, 984 m gain
- [Sunday: Fisherman's Camp → Hell's Gate → Eburru](https://ridewithgps.com/trips/409398249) — 64.0 km, 1095 m gain
- [Monday: Eburru Earth Camp → Gilgil](https://ridewithgps.com/trips/409786958) — 15.9 km, 108 m gain

## The route

| Day | Route | Distance |
|---|---|---|
| Friday | Nairobi → Bamboo Garden Lodge (by car) | — |
| Saturday | Bamboo Garden Lodge → Fisherman's Camp, via Kedong Ranch | 63.7 km |
| Sunday | Fisherman's Camp → Eburru Earth Camp, via Hell's Gate NP | 64.0 km |
| Monday | Eburru Earth Camp → Gilgil | 15.9 km |

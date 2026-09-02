document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken = "pk.eyJ1IjoiZmFuYXRpYzgiLCJhIjoiY210azFsbXpnMGVuNDMxcjJ2enhmaXl3aCJ9.ePvQndPXFjWEhf7MbaAk7A";

  const DAYS = [
    { key: "saturday", label: "Saturday", color: "#1d3557", file: "assets/tracks/saturday.json" },
    { key: "sunday", label: "Sunday", color: "#2a9d8f", file: "assets/tracks/sunday.json" },
    { key: "monday", label: "Monday", color: "#e76f51", file: "assets/tracks/monday.json" },
  ];
  const ALL_KEY = "all";
  const ALL_COLOR = "#495057";

  const map = new mapboxgl.Map({
    container: "trip-map",
    style: "mapbox://styles/mapbox/outdoors-v12",
    center: [36.4, -0.75],
    zoom: 9,
  });
  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  const hoverMarker = new mapboxgl.Marker({ color: "#e63946" });

  let chart = null;
  let lightbox = null;
  const trackData = {};
  let photosByDay = {};

  function fmtDuration(sec) {
    if (!sec) return "n/a";
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }

  function statsHtml(distance_km, elevation_gain_m, moving_time_s, avg_speed_kmh) {
    return `
      <div class="trip-stat"><span class="trip-stat-value">${distance_km}</span><span class="trip-stat-label">km</span></div>
      <div class="trip-stat"><span class="trip-stat-value">${elevation_gain_m}</span><span class="trip-stat-label">m gain</span></div>
      <div class="trip-stat"><span class="trip-stat-value">${fmtDuration(moving_time_s)}</span><span class="trip-stat-label">moving time</span></div>
      <div class="trip-stat"><span class="trip-stat-value">${avg_speed_kmh}</span><span class="trip-stat-label">avg km/h</span></div>
    `;
  }

  function ensureTrackLayer(day, data) {
    const sourceId = "track-" + day.key;
    if (map.getSource(sourceId)) return;
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "Feature", geometry: { type: "LineString", coordinates: data.coords } },
    });
    map.addLayer({
      id: "layer-" + day.key,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round", visibility: "none" },
      paint: { "line-color": day.color, "line-width": 5, "line-opacity": 0.9 },
    });
  }

  function setTracksVisible(keys) {
    DAYS.forEach((d) => {
      map.setLayoutProperty("layer-" + d.key, "visibility", keys.includes(d.key) ? "visible" : "none");
    });
  }

  function fitToKeys(keys) {
    let bounds = null;
    keys.forEach((k) => {
      trackData[k].coords.forEach((c) => {
        if (!bounds) bounds = new mapboxgl.LngLatBounds(c, c);
        else bounds.extend(c);
      });
    });
    if (bounds) map.fitBounds(bounds, { padding: 40, duration: 500 });
  }

  function drawSingleDayChart(data) {
    const ctx = document.getElementById("elevation-chart").getContext("2d");
    if (chart) chart.destroy();
    const minElev = Math.min(...data.elev_m);
    const maxElev = Math.max(...data.elev_m);
    const padding = Math.max(20, Math.round((maxElev - minElev) * 0.1));
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.dist_km,
        datasets: [
          {
            data: data.elev_m,
            borderColor: "#e63946",
            backgroundColor: "rgba(230,57,70,0.12)",
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: {
            title: { display: true, text: "distance (km)" },
            ticks: { maxTicksLimit: 8, callback: (v, i) => Number(data.dist_km[i]).toFixed(1) },
          },
          y: {
            title: { display: true, text: "elevation (m)" },
            min: Math.floor((minElev - padding) / 100) * 100,
            max: Math.ceil((maxElev + padding) / 100) * 100,
          },
        },
        onHover: (evt, elements, c) => {
          const points = c.getElementsAtEventForMode(evt, "index", { intersect: false }, false);
          if (points.length) {
            hoverMarker.setLngLat(data.coords[points[0].index]).addTo(map);
          }
        },
      },
    });
  }

  function drawCombinedChart() {
    const ctx = document.getElementById("elevation-chart").getContext("2d");
    if (chart) chart.destroy();

    let offset = 0;
    const datasets = DAYS.map((d) => {
      const data = trackData[d.key].dist_km.map((x, i) => ({ x: x + offset, y: trackData[d.key].elev_m[i] }));
      offset += trackData[d.key].distance_km;
      return {
        label: d.label,
        data,
        borderColor: d.color,
        backgroundColor: "transparent",
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.15,
      };
    });

    chart = new Chart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        plugins: { legend: { display: true, position: "top", labels: { boxWidth: 12 } } },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "distance (km)" },
            ticks: { maxTicksLimit: 8, callback: (v) => Number(v).toFixed(1) },
          },
          y: { title: { display: true, text: "elevation (m)" } },
        },
        onHover: (evt, elements, c) => {
          const points = c.getElementsAtEventForMode(evt, "nearest", { intersect: false }, false);
          if (points.length) {
            const { datasetIndex, index } = points[0];
            const day = DAYS[datasetIndex];
            hoverMarker.setLngLat(trackData[day.key].coords[index]).addTo(map);
          }
        },
      },
    });
  }

  function ensurePhotoLayer(day) {
    const sourceId = "photos-" + day.key;
    const photos = photosByDay[day.key] || [];
    if (map.getSource(sourceId) || !photos.length) return;
    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: photos.map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lon, p.lat] },
          properties: { thumb: p.thumb, caption: p.caption || "" },
        })),
      },
    });
    // Invisible, larger hit-area layer — the visible dot is only 6px, well under a
    // usable touch target, so taps are bound to this bigger transparent layer instead.
    map.addLayer({
      id: "photo-hitarea-" + day.key,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      paint: { "circle-radius": 18, "circle-color": "#000000", "circle-opacity": 0 },
    });
    map.addLayer({
      id: "photo-layer-" + day.key,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 6,
        "circle-color": "#f4a261",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    map.on("click", "photo-hitarea-" + day.key, (e) => {
      const f = e.features[0];
      new mapboxgl.Popup({ className: "trip-popup" })
        .setLngLat(f.geometry.coordinates)
        .setHTML(
          `<img src="assets/photos/${f.properties.thumb}" style="max-width:140px;max-height:140px;width:auto;height:auto;display:block;border-radius:4px;">`
        )
        .addTo(map);
    });
    map.on("mouseenter", "photo-hitarea-" + day.key, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", "photo-hitarea-" + day.key, () => (map.getCanvas().style.cursor = ""));
  }

  function setPhotoLayersVisible(keys) {
    DAYS.forEach((d) => {
      if (map.getLayer("photo-layer-" + d.key)) {
        const vis = keys.includes(d.key) ? "visible" : "none";
        map.setLayoutProperty("photo-layer-" + d.key, "visibility", vis);
        map.setLayoutProperty("photo-hitarea-" + d.key, "visibility", vis);
      }
    });
  }

  function renderPhotoStrip(photos, galleryId) {
    const container = document.getElementById("photo-strip");

    if (!photos.length) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }
    container.hidden = false;
    container.innerHTML = photos
      .map(
        (p) => `
      <figure class="trip-photo">
        <a href="assets/photos/${p.thumb}" class="glightbox" data-gallery="${galleryId}" data-description="${p.caption || ""}">
          <img src="assets/photos/${p.thumb}" loading="lazy" alt="${p.caption || ""}">
        </a>
        ${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}
      </figure>`
      )
      .join("");

    if (lightbox) lightbox.reload();
    else lightbox = GLightbox({ selector: ".glightbox" });
  }

  async function selectDay(key) {
    document.querySelectorAll(".trip-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.day === key);
    });

    if (key === ALL_KEY) {
      const keys = DAYS.map((d) => d.key);
      setTracksVisible(keys);
      setPhotoLayersVisible(keys);
      fitToKeys(keys);

      const totalDist = DAYS.reduce((s, d) => s + trackData[d.key].distance_km, 0);
      const totalGain = DAYS.reduce((s, d) => s + trackData[d.key].elevation_gain_m, 0);
      const totalMoving = DAYS.reduce((s, d) => s + (trackData[d.key].moving_time_s || 0), 0);
      const avgSpeed = totalMoving ? Math.round((totalDist / (totalMoving / 3600)) * 10) / 10 : 0;
      document.getElementById("trip-stats").innerHTML = statsHtml(
        Math.round(totalDist * 10) / 10,
        Math.round(totalGain),
        totalMoving,
        avgSpeed
      );

      drawCombinedChart();

      const allPhotos = DAYS.flatMap((d) => photosByDay[d.key] || []);
      renderPhotoStrip(allPhotos, ALL_KEY);
    } else {
      setTracksVisible([key]);
      setPhotoLayersVisible([key]);
      fitToKeys([key]);

      const data = trackData[key];
      document.getElementById("trip-stats").innerHTML = statsHtml(
        data.distance_km,
        data.elevation_gain_m,
        data.moving_time_s,
        data.avg_speed_kmh
      );

      drawSingleDayChart(data);
      renderPhotoStrip(photosByDay[key] || [], key);
    }
  }

  function buildTabs() {
    const tabBar = document.getElementById("trip-tabs");
    const allTab = `<button class="trip-tab" data-day="${ALL_KEY}" style="--tab-color:${ALL_COLOR}">All days</button>`;
    const dayTabs = DAYS.map(
      (d) => `<button class="trip-tab" data-day="${d.key}" style="--tab-color:${d.color}">${d.label}</button>`
    ).join("");
    tabBar.innerHTML = allTab + dayTabs;
    tabBar.querySelectorAll(".trip-tab").forEach((btn) => {
      btn.addEventListener("click", () => selectDay(btn.dataset.day));
    });
  }

  async function loadPhotoManifest() {
    try {
      const res = await fetch("assets/photos.json");
      if (!res.ok) return;
      const manifest = await res.json();
      photosByDay = manifest.reduce((acc, p) => {
        (acc[p.day] = acc[p.day] || []).push(p);
        return acc;
      }, {});
    } catch (e) {
      // no photo manifest yet — fine, map/elevation still work
    }
  }

  map.on("load", async () => {
    buildTabs();
    await loadPhotoManifest();

    await Promise.all(
      DAYS.map(async (d) => {
        const res = await fetch(d.file);
        trackData[d.key] = await res.json();
        ensureTrackLayer(d, trackData[d.key]);
        ensurePhotoLayer(d);
      })
    );

    await selectDay(ALL_KEY);
  });
});

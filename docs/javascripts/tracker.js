document.addEventListener("DOMContentLoaded", function () {
  const GARMIN_PROXY = "https://proxy-cors-azure.vercel.app/api/garmin-proxy";
  const REFRESH_MS = 3 * 60 * 1000;

  const map = L.map("map", { preferCanvas: true });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors, &copy; CARTO",
  }).addTo(map);

  const bounds = L.latLngBounds([]);

  async function loadGpxTrack(url, color, label) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      const pts = Array.from(xml.getElementsByTagName("trkpt")).map((p) => [
        parseFloat(p.getAttribute("lat")),
        parseFloat(p.getAttribute("lon")),
      ]);
      if (!pts.length) return;
      const line = L.polyline(pts, { color, weight: 6, opacity: 0.9, dashArray: "12 8", lineCap: "round" })
        .addTo(map)
        .bindPopup(label);
      bounds.extend(line.getBounds());
    } catch (e) {
      console.error("Failed to load planned track", url, e);
    }
  }

  const liveMarker = L.circleMarker([0, 0], {
    radius: 11,
    color: "#ffffff",
    fillColor: "#e63946",
    fillOpacity: 1,
    weight: 3,
  });
  const liveTrail = L.polyline([], { color: "#e63946", weight: 6, opacity: 0.95, lineCap: "round" });

  function extendedValue(placemark, name) {
    const datas = placemark.getElementsByTagName("Data");
    for (const d of datas) {
      if (d.getAttribute("name") === name) {
        const v = d.getElementsByTagName("value")[0];
        return v ? v.textContent : null;
      }
    }
    return null;
  }

  async function loadGarminPosition(fitView) {
    try {
      const res = await fetch(GARMIN_PROXY, { cache: "no-store" });
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      const placemarks = Array.from(xml.getElementsByTagName("Placemark"));

      let position = null;
      let timeStr = null;
      let elevStr = null;
      let velStr = null;
      let trailCoords = [];

      for (const pm of placemarks) {
        const point = pm.getElementsByTagName("Point")[0];
        const line = pm.getElementsByTagName("LineString")[0];

        if (point) {
          const coordText = point.getElementsByTagName("coordinates")[0].textContent.trim();
          const [lon, lat] = coordText.split(",").map(Number);
          position = [lat, lon];
          timeStr = extendedValue(pm, "Time");
          elevStr = extendedValue(pm, "Elevation");
          velStr = extendedValue(pm, "Velocity");
        }

        if (line) {
          const coordText = line.getElementsByTagName("coordinates")[0].textContent.trim();
          trailCoords = coordText
            .trim()
            .split(/\s+/)
            .map((c) => {
              const [lon, lat] = c.split(",").map(Number);
              return [lat, lon];
            });
        }
      }

      if (!position) return;

      liveMarker.setLatLng(position);
      liveMarker.bindPopup(
        `<b>Last position</b><br>${timeStr || ""}<br>Elevation: ${elevStr || "n/a"}<br>Speed: ${velStr || "n/a"}`
      );
      if (!map.hasLayer(liveMarker)) liveMarker.addTo(map);

      if (trailCoords.length) {
        liveTrail.setLatLngs(trailCoords);
        if (!map.hasLayer(liveTrail)) liveTrail.addTo(map);
      }

      document.getElementById("garmin-status").innerHTML =
        `Last update: <b>${timeStr || "unknown"}</b> — Elevation ${elevStr || "n/a"} — Speed ${velStr || "n/a"}`;

      if (fitView) {
        bounds.extend(position);
      }
    } catch (e) {
      console.error("Failed to load Garmin position", e);
      document.getElementById("garmin-status").innerHTML =
        "Could not load live position right now — will retry automatically.";
    }
  }

  async function init() {
    await Promise.all([
      loadGpxTrack("assets/gpx/KENYA1.gpx", "#1d3557", "Saturday: Bamboo Garden Lodge to Fisherman's Camp"),
      loadGpxTrack("assets/gpx/KENYA2.gpx", "#2a9d8f", "Sunday: Hell's Gate loop"),
    ]);
    await loadGarminPosition(true);

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15));
    } else {
      map.setView([-0.9, 36.4], 10);
    }

    setInterval(() => loadGarminPosition(false), REFRESH_MS);
  }

  init();
});

const fs = require("fs");
const path = require("path");
const geojsonvt = require("geojson-vt").default;
const vtpbf = require("vt-pbf");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "sample.geojson");
const outputDir = path.join(rootDir, "tiles");
const sourceLayer = "bandung";
const minZoom = 10;
const maxZoom = 15;
const maxLatitude = 85.0511287798066;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function longitudeToTileX(longitude, zoom) {
  const tileCount = 2 ** zoom;
  return clamp(
    Math.floor(((longitude + 180) / 360) * tileCount),
    0,
    tileCount - 1
  );
}

function latitudeToTileY(latitude, zoom) {
  const tileCount = 2 ** zoom;
  const clampedLatitude = clamp(latitude, -maxLatitude, maxLatitude);
  const latitudeRadians = (clampedLatitude * Math.PI) / 180;
  const mercatorY =
    (1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2;

  return clamp(Math.floor(mercatorY * tileCount), 0, tileCount - 1);
}

function getBounds(geojson) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];

  function visitCoordinates(coordinates) {
    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      bounds[0] = Math.min(bounds[0], coordinates[0]);
      bounds[1] = Math.min(bounds[1], coordinates[1]);
      bounds[2] = Math.max(bounds[2], coordinates[0]);
      bounds[3] = Math.max(bounds[3], coordinates[1]);
      return;
    }

    if (Array.isArray(coordinates)) {
      coordinates.forEach(visitCoordinates);
    }
  }

  geojson.features.forEach((feature) => {
    if (feature.geometry) {
      visitCoordinates(feature.geometry.coordinates);
    }
  });

  if (bounds.some((value) => !Number.isFinite(value))) {
    throw new Error("GeoJSON tidak memiliki koordinat yang valid.");
  }

  return bounds;
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`File input tidak ditemukan: ${inputPath}`);
  }

  const geojson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("Input harus berupa GeoJSON FeatureCollection.");
  }

  const [minLongitude, minLatitude, maxLongitude, maxLatitudeValue] =
    getBounds(geojson);
  const tileIndex = geojsonvt(geojson, {
    maxZoom,
    indexMaxZoom: maxZoom,
    indexMaxPoints: 100000
  });
  const createdTiles = [];

  for (let zoom = minZoom; zoom <= maxZoom; zoom += 1) {
    const minX = longitudeToTileX(minLongitude, zoom);
    const maxX = longitudeToTileX(maxLongitude, zoom);
    const minY = latitudeToTileY(maxLatitudeValue, zoom);
    const maxY = latitudeToTileY(minLatitude, zoom);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const tile = tileIndex.getTile(zoom, x, y);
        if (!tile || tile.features.length === 0) {
          continue;
        }

        const relativePath = [
          "tiles",
          String(zoom),
          String(x),
          `${y}.pbf`
        ].join("/");
        const outputPath = path.join(rootDir, relativePath);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        const buffer = Buffer.from(
          vtpbf.fromGeojsonVt({ [sourceLayer]: tile })
        );
        fs.writeFileSync(outputPath, buffer);
        createdTiles.push(relativePath);
      }
    }
  }

  if (createdTiles.length === 0) {
    throw new Error("Tidak ada tile berisi fitur yang berhasil dibuat.");
  }

  console.log("Tile MVT berhasil dibuat:");
  createdTiles.forEach((tilePath) => console.log(`- ${tilePath}`));
  console.log(`Total: ${createdTiles.length} file .pbf`);
}

try {
  main();
} catch (error) {
  console.error(`Gagal membuat tile: ${error.message}`);
  process.exitCode = 1;
}

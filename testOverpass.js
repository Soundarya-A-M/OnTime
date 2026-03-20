const fetch = require('node-fetch');

async function testQuery() {
    const rawQuery = "mysuru bus stand";
    const words = rawQuery.trim().split(/\s+/).filter(w => w.length > 0);
    // Build multiple name filters, e.g., ["name"~"mysuru",i]["name"~"bus",i]["name"~"stand",i]
    const nameFilters = words.map(w => `["name"~"${w}",i]`).join('');

    const overpassQuery = `
[out:json][timeout:5];
area["ISO3166-2"="IN-KA"][admin_level=4]->.searchArea;
(
  node["highway"="bus_stop"]${nameFilters}(area.searchArea);
  node["amenity"="bus_station"]${nameFilters}(area.searchArea);
);
out center 12;`;

    console.log(overpassQuery);

    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
        });
        const data = await res.json();
        console.log("Results found:", data.elements?.length || 0);
        if (data.elements?.length > 0) {
            console.log("First result:", data.elements[0].tags.name);
        }
    } catch (e) {
        console.error(e);
    }
}
testQuery();

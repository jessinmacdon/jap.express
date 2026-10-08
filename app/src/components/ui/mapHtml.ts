// A tiny Leaflet + OpenStreetMap page. The pin is drawn by React on top of the
// map centre, so the "pin" position is simply the map centre: dragging the map
// moves the spot, and the page reports the new centre to the app.
// TODO: OSM tiles are fine for development; use a tile provider with an SLA
// (Mapbox, MapTiler, Stadia) in production.
export function mapHtml(lat: number, lon: number, zoom: number, interactive: boolean) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{margin:0;height:100%;background:#E3E7ED}.leaflet-control-attribution{font-size:9px}</style></head>
<body><div id="m"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
var i=${interactive};
var map=L.map('m',{zoomControl:i,dragging:i,scrollWheelZoom:i,doubleClickZoom:i,touchZoom:i,boxZoom:false,keyboard:false,attributionControl:true}).setView([${lat},${lon}],${zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
function send(){var c=map.getCenter();var msg=JSON.stringify({type:'center',lat:c.lat,lon:c.lng});
 if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(msg);else if(window.parent)window.parent.postMessage(msg,'*');}
map.on('moveend',send);
window.addEventListener('message',function(e){try{var d=JSON.parse(e.data);if(d.type==='setView')map.setView([d.lat,d.lon],map.getZoom());}catch(_){}});
</script></body></html>`;
}

export interface MapProps {
  lat: number;
  lon: number;
  zoom?: number;
  height: number;
  interactive?: boolean;
  onCenterChange?: (c: { lat: number; lon: number }) => void;
}

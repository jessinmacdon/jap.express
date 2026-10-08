import { useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { MapFrame } from './MapPin';
import { mapHtml, type MapProps } from './mapHtml';

export function MapView({ lat, lon, zoom = 15, height, interactive = false, onCenterChange }: MapProps) {
  // Only build the page once per spot so dragging doesn't reload it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => mapHtml(lat, lon, zoom, interactive), [interactive]);
  return (
    <MapFrame height={height}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        pointerEvents={interactive ? 'auto' : 'none'}
        onMessage={(e) => {
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (d.type === 'center') onCenterChange?.({ lat: d.lat, lon: d.lon });
          } catch {}
        }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </MapFrame>
  );
}

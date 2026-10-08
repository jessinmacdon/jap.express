import { createElement, useEffect, useMemo, useRef } from 'react';
import { MapFrame } from './MapPin';
import { mapHtml, type MapProps } from './mapHtml';

export function MapView({ lat, lon, zoom = 15, height, interactive = false, onCenterChange }: MapProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => mapHtml(lat, lon, zoom, interactive), [interactive]);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const cb = useRef(onCenterChange);
  useEffect(() => {
    cb.current = onCenterChange;
  });
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'center') cb.current?.({ lat: d.lat, lon: d.lon });
      } catch {}
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);
  return (
    <MapFrame height={height}>
      {createElement('iframe', {
        ref: frame,
        srcDoc: html,
        title: 'map',
        style: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: interactive ? 'auto' : 'none' },
      })}
    </MapFrame>
  );
}

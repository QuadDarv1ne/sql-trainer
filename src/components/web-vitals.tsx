'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

function sendMetric(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    page: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/web-vitals', body);
  } else {
    fetch('/api/web-vitals', { body, method: 'POST', keepalive: true });
  }
}

export default function WebVitals() {
  useEffect(() => {
    onCLS(sendMetric);
    onFCP(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onTTFB(sendMetric);
  }, []);

  return null;
}

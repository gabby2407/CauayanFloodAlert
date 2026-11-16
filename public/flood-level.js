export function floodLevelLabel(value) {
  const level = Number(value) || 0;
  if (level === 0) return 'No flooding';
  if (level <= 25) return 'Street / Gutter Level';
  if (level < 50) return 'Ground Floor / Knee-to-Waist Deep';
  if (level < 80) return 'Second Floor Level';
  return 'Roof Level (Critical Evacuation)';
}

export function renderFloodLevel(value) {
  const level = Math.max(0, Math.min(100, Number(value) || 0));
  const severity = level >= 75 ? 'critical' : level >= 50 ? 'high' : level >= 25 ? 'moderate' : 'low';
  document.querySelectorAll('[data-level-visualizer]').forEach((visualizer) => {
    visualizer.style.setProperty('--water-level', `${level}%`);
    const water = visualizer.querySelector('.water-body');
    const wave = visualizer.querySelector('.wave-position');
    if (water) {
      water.style.height = `${level}%`;
      water.style.y = `${100 - level}%`;
    }
    if (wave) wave.setAttribute('transform', `translate(0 ${190 * (1 - level / 100)})`);
    visualizer.dataset.severity = severity;
  });
  document.querySelectorAll('[data-level-value]').forEach((element) => { element.textContent = `${level}%`; });
  document.querySelectorAll('[data-level-label]').forEach((element) => { element.textContent = floodLevelLabel(level); });
}

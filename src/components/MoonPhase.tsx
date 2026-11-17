import Svg, { Circle, ClipPath, Defs, Image, Path } from 'react-native-svg';

const MOON_TEXTURE = require('../../assets/images/moon-realistic.webp');

/** Représentation indicative de la partie éclairée, sans position géographique. */
export function MoonPhase({ fraction, waxing, size = 76 }: { fraction: number; waxing: boolean; size?: number }) {
  const lit = Math.max(0, Math.min(1, fraction));
  const direction = waxing ? 1 : -1;
  const controlX = 50 + direction * (1 - 2 * lit) * (200 / 3);
  const sweep = waxing ? 1 : 0;
  const path = `M 50 0 A 50 50 0 0 ${sweep} 50 100 C ${controlX} 100 ${controlX} 0 50 0 Z`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs><ClipPath id="moon-lit"><Path d={path} /></ClipPath><ClipPath id="moon-disk"><Circle cx="50" cy="50" r="50" /></ClipPath></Defs>
      <Circle cx="50" cy="50" r="50" fill="#252b3a" />
      <Image href={MOON_TEXTURE} x="-30.3" y="-3.4" width="160.6" height="106.8" preserveAspectRatio="none" opacity={0.2} clipPath="url(#moon-disk)" />
      <Image href={MOON_TEXTURE} x="-30.3" y="-3.4" width="160.6" height="106.8" preserveAspectRatio="none" clipPath="url(#moon-lit)" />
    </Svg>
  );
}

import React from 'react';
import { Svg, Path, Circle, Rect, G, Polygon, Line } from 'react-native-svg';

export default function Icon3({ size = 24, color = 'black', ...props }) {
  return (
    <Svg {...props} width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<Path d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z" fill={color}/>
</Svg>
  );
}

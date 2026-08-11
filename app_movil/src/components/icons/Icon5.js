import React from 'react';
import { Svg, Path, Circle, Rect, G, Polygon, Line } from 'react-native-svg';

export default function Icon5({ size = 24, color = 'black', ...props }) {
  return (
    <Svg {...props} width={size} height={size} viewBox="0 0 11 2" fill="none" xmlns="http://www.w3.org/2000/svg">
<Path d="M0 1.5V0H10.5V1.5H0Z" fill={color}/>
</Svg>
  );
}

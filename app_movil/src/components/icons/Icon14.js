import React from 'react';
import { Svg, Path, Circle, Rect, G, Polygon, Line } from 'react-native-svg';

export default function Icon14({ size = 24, color = 'black', ...props }) {
  return (
    <Svg {...props} width={size} height={size} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<Path d="M0 12V10H18V12H0ZM0 7V5H18V7H0ZM0 2V0H18V2H0Z" fill={color}/>
</Svg>
  );
}

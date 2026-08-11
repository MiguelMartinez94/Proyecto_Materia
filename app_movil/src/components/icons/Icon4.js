import React from 'react';
import { Svg, Path, Circle, Rect, G, Polygon, Line } from 'react-native-svg';

export default function Icon4({ size = 24, color = 'black', ...props }) {
  return (
    <Svg {...props} width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<Path d="M4.5 6H0V4.5H4.5V0H6V4.5H10.5V6H6V10.5H4.5V6Z" fill={color}/>
</Svg>
  );
}

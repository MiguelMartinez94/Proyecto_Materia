import React from 'react';
import { Svg, Path, Circle, Rect, G, Polygon, Line } from 'react-native-svg';

export default function Icon20({ size = 24, color = 'black', ...props }) {
  return (
    <Svg {...props} width={size} height={size} viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<Path d="M7 12V10H11V12H7ZM3 7V5H15V7H3ZM0 2V0H18V2H0Z" fill={color}/>
</Svg>
  );
}

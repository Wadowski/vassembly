import React from "react";
import { IconProps } from "./types";

export const CompassArrowIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M20.463,3.016a.75.75,0,0,1,.98.98L14.066,21.787a.75.75,0,0,1-1.428-.14L11,13.459,2.812,11.821a.75.75,0,0,1-.14-1.428Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

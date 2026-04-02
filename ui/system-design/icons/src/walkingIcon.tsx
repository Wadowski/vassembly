import React from "react";
import { IconProps } from "./types";

export const WalkingIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <g>
      <circle
        cx="11.1"
        cy="3.55"
        r="2.63"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
      <path
        d="M18.15,11.8A2.23,2.23,0,0,1,16.39,11a7.68,7.68,0,0,0-6-2.91,6,6,0,0,0-6,6,1.5,1.5,0,0,0,3,0,3,3,0,0,1,2.25-2.9,16.4,16.4,0,0,1-2.75,9.57,1.5,1.5,0,0,0,2.5,1.67A19.75,19.75,0,0,0,11.6,17.8,8,8,0,0,1,14.93,22a1.5,1.5,0,1,0,2.84-1,11,11,0,0,0-5.42-6.31,20.32,20.32,0,0,0,.25-3.15,4.81,4.81,0,0,1,1.45,1.21,5.2,5.2,0,0,0,4.1,2,1.5,1.5,0,0,0,0-3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

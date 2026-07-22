import React from "react";
import { IconProps } from "./types";

export const DiscountBubbleIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <g>
      <line
        x1="8.37"
        y1="16"
        x2="16.37"
        y2="8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <circle
        cx="9.12"
        cy="8.75"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
      <circle
        cx="15.62"
        cy="15.25"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
      <path
        d="M23.25,12a3.75,3.75,0,0,0-2.62-3.58,3.75,3.75,0,0,0-5-5,3.76,3.76,0,0,0-7.16,0,3.75,3.75,0,0,0-5,5.05,3.76,3.76,0,0,0,0,7.16,3.75,3.75,0,0,0,5.05,5,3.76,3.76,0,0,0,7.16,0,3.75,3.75,0,0,0,5-5A3.75,3.75,0,0,0,23.25,12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

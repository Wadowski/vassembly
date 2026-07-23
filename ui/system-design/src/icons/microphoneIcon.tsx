import React from "react";
import { IconProps } from "./types";

export const MicrophoneIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <g>
      <line
        x1="12"
        y1="19.5"
        x2="12"
        y2="23.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <rect
        x="7.5"
        y="0.75"
        width="9"
        height="15.25"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></rect>
      <path
        d="M4,9.75V12a7.5,7.5,0,0,0,7.5,7.5h1A7.5,7.5,0,0,0,20,12V9.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

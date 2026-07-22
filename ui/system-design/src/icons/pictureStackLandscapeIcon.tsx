import React from "react";
import { IconProps } from "./types";

export const PictureStackLandscapeIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <g>
      <rect
        x="1.5"
        y="0.75"
        width="16.5"
        height="18.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></rect>
      <path
        d="M22.5,6.25V22.5a.76.76,0,0,1-.75.75H7.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <line
        x1="18"
        y1="15.25"
        x2="1.5"
        y2="15.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <path
        d="M5,15.25l5.2-7.43a1.5,1.5,0,0,1,2.36-.13L18,14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M6,3.75a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,6,3.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

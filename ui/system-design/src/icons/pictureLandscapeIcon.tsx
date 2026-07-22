import React from "react";
import { IconProps } from "./types";

export const PictureLandscapeIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <defs></defs>
    <title>picture-landscape</title>
    <rect
      x="0.75"
      y="0.75"
      width="22.5"
      height="22.5"
      rx="1.5"
      ry="1.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></rect>
    <path
      d="M5.25,17.25l3.462-4.616a1.5,1.5,0,0,1,2.261-.161L12,13.5l3.3-4.4a1.5,1.5,0,0,1,2.4,0l2.67,3.56"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <circle
      cx="6.375"
      cy="6.375"
      r="1.875"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></circle>
    <line
      x1="0.75"
      y1="17.25"
      x2="23.25"
      y2="17.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></line>
  </svg>
);

import React from "react";
import { IconProps } from "./types";

export const MapsIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M16.307,2.838a1.5,1.5,0,0,0-1.114,0L8.807,5.393a1.5,1.5,0,0,1-1.114,0L1.779,3.027a.75.75,0,0,0-1.029.7V18.1a1.5,1.5,0,0,0,.943,1.393l6,2.4a1.5,1.5,0,0,0,1.114,0l6.386-2.555a1.5,1.5,0,0,1,1.114,0L22.221,21.7a.75.75,0,0,0,1.029-.7V6.631a1.5,1.5,0,0,0-.943-1.393Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.25 5.5L8.25 22"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.75 2.731L15.75 19.231"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

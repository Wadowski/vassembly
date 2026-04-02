import React from "react";
import { IconProps } from "./types";

export const ButtonStopIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.750 11.998 A11.250 11.250 0 1 0 23.250 11.998 A11.250 11.250 0 1 0 0.750 11.998 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.250 8.248 L15.750 8.248 L15.750 15.748 L8.250 15.748 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

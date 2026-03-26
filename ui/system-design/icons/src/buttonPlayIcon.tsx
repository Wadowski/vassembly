import React from "react";
import { IconProps } from "./types";

export const ButtonPlayIcon = ({ className, style }: IconProps) => (
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
      d="M9,15.613a1.636,1.636,0,0,0,2.712,1.231L17.25,12,11.712,7.153A1.635,1.635,0,0,0,9,8.384Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

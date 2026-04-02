import React from "react";
import { IconProps } from "./types";

export const MusicNoteIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.750 19.500 A3.750 3.750 0 1 0 8.250 19.500 A3.750 3.750 0 1 0 0.750 19.500 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.750 15.000 A3.750 3.750 0 1 0 23.250 15.000 A3.750 3.750 0 1 0 15.750 15.000 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.25,19.5V6.719A3,3,0,0,1,10.3,3.873L21.348.805a1.5,1.5,0,0,1,1.9,1.445V15"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.25 8.719L23.25 4.219"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

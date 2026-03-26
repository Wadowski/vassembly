import React from "react";
import { IconProps } from "./types";

export const AnalyticsBarsIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.75 21.75L23.25 21.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M6,11.25H3a.75.75,0,0,0-.75.75v9.75h4.5V12A.75.75,0,0,0,6,11.25Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M13.5,2.25h-3A.75.75,0,0,0,9.75,3V21.75h4.5V3A.75.75,0,0,0,13.5,2.25Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M21,6.75H18a.75.75,0,0,0-.75.75V21.75h4.5V7.5A.75.75,0,0,0,21,6.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

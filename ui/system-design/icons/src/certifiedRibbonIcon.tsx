import React from "react";
import { IconProps } from "./types";

export const CertifiedRibbonIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M4.807 13.042L0.75 18 4.5 18.75 6 23.25 9.944 16.992"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M19.193 13.042L23.25 18 19.5 18.75 18 23.25 14.056 16.992"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M20.25,9a8.246,8.246,0,1,1-4.5-7.35"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M18,5.25l-5.47,5.47a.749.749,0,0,1-1.06,0L9.75,9"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

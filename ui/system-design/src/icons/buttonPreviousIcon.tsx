import React from "react";
import { IconProps } from "./types";

export const ButtonPreviousIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M7.988,15.658a.855.855,0,0,1-1.238-.765V9.1a.855.855,0,0,1,1.238-.765l5.789,2.894a.856.856,0,0,1,0,1.531Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M0.750 11.998 A11.250 11.250 0 1 0 23.250 11.998 A11.250 11.250 0 1 0 0.750 11.998 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M17.25 8.248L17.25 15.748"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

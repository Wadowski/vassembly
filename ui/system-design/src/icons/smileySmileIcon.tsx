import React from "react";
import { IconProps } from "./types";

export const SmileySmileIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.750 12.000 A11.250 11.250 0 1 0 23.250 12.000 A11.250 11.250 0 1 0 0.750 12.000 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M18.75,13.5a6.75,6.75,0,0,1-13.5,0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M18.493,9.75a2.25,2.25,0,0,0-4.243,0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M9.75,9.75a2.25,2.25,0,0,0-4.243,0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

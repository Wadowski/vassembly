import React from "react";
import { IconProps } from "./types";

export const ShareIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M1.500 11.250 A3.750 3.750 0 1 0 9.000 11.250 A3.750 3.750 0 1 0 1.500 11.250 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.000 6.000 A3.750 3.750 0 1 0 22.500 6.000 A3.750 3.750 0 1 0 15.000 6.000 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.000 18.000 A3.750 3.750 0 1 0 22.500 18.000 A3.750 3.750 0 1 0 15.000 18.000 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.746 9.891L15.254 7.36"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.605 12.928L15.395 16.323"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

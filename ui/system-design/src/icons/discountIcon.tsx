import React from "react";
import { IconProps } from "./types";

export const DiscountIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M2.25,21.75l19.5-19.5Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.750 18.750 A3.000 3.000 0 1 0 21.750 18.750 A3.000 3.000 0 1 0 15.750 18.750 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M2.250 5.250 A3.000 3.000 0 1 0 8.250 5.250 A3.000 3.000 0 1 0 2.250 5.250 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

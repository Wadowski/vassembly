import React from "react";
import { IconProps } from "./types";

export const PinIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M8.250 8.250 A3.750 3.750 0 1 0 15.750 8.250 A3.750 3.750 0 1 0 8.250 8.250 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12,.75a7.5,7.5,0,0,1,7.5,7.5c0,3.407-5.074,11.95-6.875,14.665a.75.75,0,0,1-1.25,0C9.574,20.2,4.5,11.657,4.5,8.25A7.5,7.5,0,0,1,12,.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

import React from "react";
import { IconProps } from "./types";

export const ButtonRewindIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M12.75,9.969V9.1a.855.855,0,0,0-1.238-.765L5.723,11.233a.856.856,0,0,0,0,1.531l5.789,2.894a.855.855,0,0,0,1.238-.765v-.866l3.262,1.631a.855.855,0,0,0,1.238-.765V9.1a.855.855,0,0,0-1.238-.765Z"
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
  </svg>
);

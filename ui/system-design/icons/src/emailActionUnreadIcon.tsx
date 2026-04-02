import React from "react";
import { IconProps } from "./types";

export const EmailActionUnreadIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M1.500 4.750 L22.500 4.750 L22.500 19.750 L1.500 19.750 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M22.161,5.3l-8.144,6.264a3.308,3.308,0,0,1-4.034,0L1.839,5.3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

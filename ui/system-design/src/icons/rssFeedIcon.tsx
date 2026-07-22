import React from "react";
import { IconProps } from "./types";

export const RssFeedIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.750 19.497 A3.750 3.750 0 1 0 8.250 19.497 A3.750 3.750 0 1 0 0.750 19.497 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M.75,8.844a11.328,11.328,0,0,1,14.4,14.4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M.75,1.113A18.777,18.777,0,0,1,22.889,23.236"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

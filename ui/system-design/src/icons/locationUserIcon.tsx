import React from "react";
import { IconProps } from "./types";

export const LocationUserIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M18.736,13.8c2.74.957,4.514,2.484,4.514,4.205,0,2.9-5.037,5.25-11.25,5.25S.75,20.9.75,18c0-1.715,1.761-3.237,4.485-4.195"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M9.375 3.375 A2.625 2.625 0 1 0 14.625 3.375 A2.625 2.625 0 1 0 9.375 3.375 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.75,12.745V10.5a3.75,3.75,0,0,0-7.5,0v2.25h1.5l.75,6h3l.75-6Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

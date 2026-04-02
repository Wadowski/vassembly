import React from "react";
import { IconProps } from "./types";

export const ShopIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M21.75,12.75v9a1.5,1.5,0,0,1-1.5,1.5H3.75a1.5,1.5,0,0,1-1.5-1.5v-9"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M21.148.75H2.852a.751.751,0,0,0-.733.587L.75,7.5a2.25,2.25,0,0,0,4.5,0,2.25,2.25,0,0,0,4.5,0,2.25,2.25,0,0,0,4.5,0,2.25,2.25,0,0,0,4.5,0,2.25,2.25,0,0,0,4.5,0L21.88,1.337A.749.749,0,0,0,21.148.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M2.25 17.25L15 17.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15 23.25L15 12.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

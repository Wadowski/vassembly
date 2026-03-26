import React from "react";
import { IconProps } from "./types";

export const LoadingIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M22.394,16.31a11.281,11.281,0,0,0,0-8.621L17.1,10.766a5.284,5.284,0,0,1,0,2.467Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M6.75,12A5.283,5.283,0,0,1,6.9,10.766L1.606,7.689a11.281,11.281,0,0,0,0,8.621L6.9,13.233A5.281,5.281,0,0,1,6.75,12Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M13.5,6.968a5.236,5.236,0,0,1,2.094,1.205L20.883,5.1A11.238,11.238,0,0,0,13.5.849Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M15.594,15.826A5.238,5.238,0,0,1,13.5,17.032V23.15A11.238,11.238,0,0,0,20.883,18.9Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M8.406,8.173a5.236,5.236,0,0,1,2.094-1.2V.849A11.238,11.238,0,0,0,3.117,5.1Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M10.5,17.032a5.238,5.238,0,0,1-2.094-1.206L3.117,18.9A11.238,11.238,0,0,0,10.5,23.15Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

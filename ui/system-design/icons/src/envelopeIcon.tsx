import React from "react";
import { IconProps } from "./types";

export const EnvelopeIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <defs></defs>
    <title>envelope</title>
    <rect
      x="0.75"
      y="4.5"
      width="22.5"
      height="15"
      rx="1.5"
      ry="1.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></rect>
    <line
      x1="15.687"
      y1="9.975"
      x2="19.5"
      y2="13.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></line>
    <line
      x1="8.313"
      y1="9.975"
      x2="4.5"
      y2="13.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></line>
    <path
      d="M22.88,5.014l-9.513,6.56a2.406,2.406,0,0,1-2.734,0L1.12,5.014"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

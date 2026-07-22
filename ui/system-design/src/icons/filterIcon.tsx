import React from "react";
import { IconProps } from "./types";

export const FilterIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke-miterlimit="10"
      d="M14.8846 17.625V12L22.6731 4.21154C23.1058 3.77885 23.25 3.34615 23.25 2.76923C23.25 1.61538 22.3846 0.75 21.2308 0.75H2.76924C1.6154 0.75 0.75 1.61538 0.75 2.76923C0.75 3.34615 0.894244 3.77885 1.32694 4.21154L9.11539 12V23.25L14.8846 17.625Z"
    ></path>
  </svg>
);

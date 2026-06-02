import type { ImgHTMLAttributes } from "react";
import logoSrc from "../assets/logo.png";

type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export function Logo({ className = "", alt = "ORION Analytics", ...props }: LogoProps) {
  return <img src={logoSrc} alt={alt} className={`block object-contain ${className}`} {...props} />;
}

export { logoSrc };

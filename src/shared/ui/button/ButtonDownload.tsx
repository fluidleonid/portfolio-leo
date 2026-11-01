import React from "react";

export interface ButtonDownloadProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const downloadPath =
  "M0.000131207 29.3753C0.000326631 28.4235 0.771999 27.6515 1.72388 27.6515C2.67575 27.6515 3.44743 28.4235 3.44762 29.3753C3.44762 31.3229 3.46238 31.9591 3.59071 32.4382C3.97922 33.888 5.11189 35.0208 6.56181 35.4093C7.0409 35.5376 7.67703 35.5523 9.62466 35.5523H29.3753C31.3229 35.5523 31.9591 35.5376 32.4382 35.4093C33.888 35.0208 35.0208 33.888 35.4093 32.4382C35.5376 31.9591 35.5524 31.3227 35.5524 29.3753C35.5526 28.4235 36.3243 27.6516 37.2761 27.6515C38.228 27.6515 38.9997 28.4235 38.9999 29.3753C38.9999 31.1012 39.0143 32.3024 38.739 33.3303C38.0317 35.9698 35.9698 38.0316 33.3304 38.7389C32.3025 39.0142 31.1011 38.9998 29.3753 38.9998H9.62466C7.89888 38.9998 6.69752 39.0151 5.66964 38.7398C3.02995 38.0325 0.968335 35.9698 0.26105 33.3303C-0.0143532 32.3024 0.000131207 31.101 0.000131207 29.3753ZM17.7763 1.72375C17.7763 0.771756 18.548 1.0661e-05 19.5 0C20.452 0 21.2237 0.771749 21.2237 1.72375V24.2689C21.9559 23.5709 22.7501 22.7138 23.5207 21.8263C24.4591 20.7455 25.3309 19.6597 25.9699 18.8409C26.2887 18.4324 26.5477 18.0921 26.7266 17.8553C26.8159 17.7371 26.8855 17.6449 26.932 17.5826C26.9552 17.5515 26.9727 17.5274 26.9842 17.5119C26.9898 17.5043 26.9941 17.4987 26.9968 17.4951C26.9981 17.4932 27.0001 17.4908 27.0001 17.4908C27.5647 16.7243 28.6442 16.5602 29.4107 17.1247C30.177 17.6893 30.3405 18.768 29.776 19.5344L29.7743 19.537C29.7743 19.537 29.7719 19.5404 29.7701 19.5429C29.7665 19.5477 29.7616 19.5549 29.7549 19.5639C29.7415 19.582 29.7213 19.6082 29.696 19.6422C29.6454 19.71 29.5722 19.8088 29.478 19.9334C29.2898 20.1826 29.0192 20.5372 28.6877 20.9619C28.0262 21.8096 27.1146 22.9452 26.124 24.0862C25.1406 25.2188 24.0452 26.3965 23.0182 27.3039C22.5068 27.7558 21.9715 28.1771 21.4443 28.4949C20.9643 28.7843 20.2728 29.1245 19.5 29.1245C18.7272 29.1245 18.0357 28.7842 17.5557 28.4949C17.0285 28.177 16.4933 27.755 15.9818 27.3031C14.9549 26.3957 13.8593 25.2187 12.876 24.0862C11.8854 22.9452 10.9738 21.8095 10.3123 20.9619C9.98095 20.5373 9.71103 20.1826 9.52281 19.9334C9.42867 19.8087 9.35456 19.71 9.30398 19.6422C9.27874 19.6083 9.25931 19.582 9.2459 19.5639C9.23919 19.5548 9.23354 19.5478 9.22991 19.5429C9.22818 19.5405 9.22571 19.537 9.22571 19.537L9.22486 19.5353L9.22402 19.5344C8.65964 18.7679 8.82366 17.6892 9.59015 17.1247C10.3566 16.5603 11.4353 16.7237 11.9999 17.49L12.0007 17.4908C12.0007 17.4908 12.0019 17.4933 12.0032 17.4951C12.0059 17.4987 12.0102 17.5043 12.0158 17.5119C12.0273 17.5274 12.0448 17.5514 12.068 17.5826C12.1145 17.6449 12.1841 17.737 12.2734 17.8553C12.4523 18.0921 12.7113 18.4324 13.0301 18.8409C13.6691 19.6597 14.5409 20.7454 15.4793 21.8263C16.2497 22.7136 17.0443 23.5701 17.7763 24.268V1.72375Z";

/**
 * ButtonDownload (Tactile Download Button with Buttery Smooth Lamp Gradient)
 */
export const ButtonDownload = React.forwardRef<HTMLButtonElement, ButtonDownloadProps>(
  ({ className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={props["aria-label"] || "Download"}
        className={`group relative inline-flex h-[60px] w-[60px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[16px] bg-black/15 p-[4px] pt-[3px] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25),inset_0_-1px_1px_rgba(255,255,255,0.02)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:pointer-events-none disabled:opacity-40 ${className}`}
        {...props}
      >
        {/* Tactile Cap (52x52px, radius 12px) */}
        <span
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.20)] transition-all duration-150 ease-out group-hover:translate-y-[1px] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)]"
          style={{
            background: "linear-gradient(175deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
          }}
        >
          {/* Download Icon SVG with exact vector-contour glow filter */}
          <svg
            viewBox="0 0 39 39"
            className="h-[26px] w-[26px] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Incandescent gradient */}
              <linearGradient
                id="contourLampGradientSoft"
                x1="19.5"
                y1="0"
                x2="19.5"
                y2="39"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FFF8C4" />
                <stop offset="35%" stopColor="#FFDF64" />
                <stop offset="65%" stopColor="#FFC438" />
                <stop offset="85%" stopColor="#F59820" />
                <stop offset="100%" stopColor="#E57810" />
              </linearGradient>

              {/* Soft vector-contour glow filter */}
              <filter
                id="vectorOutlineGlowSoft"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
                filterUnits="userSpaceOnUse"
              >
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="contourBlur" />
                <feFlood floodColor="#E58E1A" floodOpacity="0.28" result="amberFlood" />
                <feComposite in="amberFlood" in2="contourBlur" operator="in" result="coloredOutline" />
                <feMerge>
                  <feMergeNode in="coloredOutline" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Inactive State: Bound to border-hardware token */}
            <path
              d={downloadPath}
              fill="var(--color-border-hardware, #383838)"
              className="transition-opacity duration-200 ease-out group-hover:opacity-0"
            />

            {/* Hover / Active State */}
            <path
              d={downloadPath}
              fill="url(#contourLampGradientSoft)"
              filter="url(#vectorOutlineGlowSoft)"
              className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100"
            />
          </svg>
        </span>
      </button>
    );
  }
);

ButtonDownload.displayName = "ButtonDownload";

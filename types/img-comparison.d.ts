/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    "img-comparison-slider": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { style?: React.CSSProperties };
  }
}

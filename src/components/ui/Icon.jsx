const paths = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  diagonal: (
    <>
      <path d="M6 18 18 6M6 6h12v12" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-40 12 12)" />
    </>
  ),
  galaxy: (
    <>
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v5m0 10v5M2 12h5m10 0h5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  wallet: (
    <>
      <path d="M20 8V5H5a2 2 0 0 0-2 2v12h18V8H5a1 1 0 0 1 0-3" />
      <path d="M21 11h-6v5h6M17 13.5h.1" />
    </>
  ),
  map: (
    <>
      <path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2V5ZM9 3v15m6-12v15" />
    </>
  ),
  token: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7z" />
      <path d="m8 16 8-8M8 8v8h8V8z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-5 2h10m-8-2h6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.1" />
    </>
  ),
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  muted: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-.5 3-2 1.2L3.7 6l-2 3.4L4 11v2l-2.3 1.6 2 3.4 2.8-1.2 2 1.2.5 3h4l.5-3 2-1.2 2.8 1.2 2-3.4L18 13v-2l2.3-1.6-2-3.4-2.8 1.2-2-1.2L13 3H9Z" />
      <circle cx="11" cy="12" r="3" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  shield: (
    <>
      <path d="m12 2 8 4v7c0 4-8 9-8 9S4 17 4 13V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
  check: <path d="m5 12 4 4L19 6" />,
  pause: <path d="M8 4v16M16 4v16" />,
  play: <path d="m7 3 14 9-14 9z" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3" />
    </>
  ),
  signal: (
    <>
      <path d="M3 17v4m6-9v9m6-14v14m6-19v19" />
    </>
  ),
  mouse: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="6" />
      <path d="M12 6v4" />
    </>
  ),
  pilot: (
    <>
      <path d="M5 13V9a7 7 0 0 1 14 0v4m-14-1h14v6l-4 4H9l-4-4v-6Z" />
      <path d="M8 10h8v5H8zM3 12v6m18-6v6" />
    </>
  ),
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.orbit}
    </svg>
  );
}

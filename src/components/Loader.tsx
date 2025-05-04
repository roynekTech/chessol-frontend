export function LoaderWithInnerLoader({
  style,
  text,
}: {
  style?: string;
  text?: string;
}) {
  return (
    <div
      className={`backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center ${style}`}
    >
      <svg
        className="animate-spin h-10 w-10 text-amber-400 mb-4"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {text && (
        <span className="text-lg font-semibold text-white/90">{text}</span>
      )}
    </div>
  );
}

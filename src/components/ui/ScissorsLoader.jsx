export default function ScissorsLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Scissors */}
      <div className="relative w-24 h-24">
        <style>
          {`
            @keyframes scissor-snap {
              0%, 100% {
                transform: rotate(165deg);
              }
              50% {
                transform: rotate(195deg);
              }
            }

            @keyframes scissor-snap-reverse {
              0%, 100% {
                transform: rotate(195deg) scaleX(-1);
              }
              50% {
                transform: rotate(165deg) scaleX(-1);
              }
            }

            .scissor-left {
              animation: scissor-snap 0.8s ease-in-out infinite;
              transform-origin: center center;
            }

            .scissor-right {
              animation: scissor-snap-reverse 0.8s ease-in-out infinite;
              transform-origin: center center;
            }

            @keyframes pulse-glow {
              0%, 100% {
                opacity: 0.5;
              }
              50% {
                opacity: 1;
              }
            }

            .glow-circle {
              animation: pulse-glow 1.6s ease-in-out infinite;
            }
          `}
        </style>

        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl glow-circle"></div>
        </div>

        {/* Left Scissor Blade */}
        <svg
          className="scissor-left absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 4C6.34315 4 5 5.34315 5 7C5 8.65685 6.34315 10 8 10C9.65685 10 11 8.65685 11 7C11 5.34315 9.65685 4 8 4Z"
            fill="url(#gradient1)"
          />
          <path
            d="M8 10L17 20"
            stroke="url(#gradient1)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Right Scissor Blade */}
        <svg
          className="scissor-right absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 4C6.34315 4 5 5.34315 5 7C5 8.65685 6.34315 10 8 10C9.65685 10 11 8.65685 11 7C11 5.34315 9.65685 4 8 4Z"
            fill="url(#gradient2)"
          />
          <path
            d="M8 10L17 20"
            stroke="url(#gradient2)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center pivot point */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-purple-500/50"></div>
      </div>

      {/* Loading Text */}
      <div className="flex items-center gap-2">
        <span className="text-white font-medium text-sm">Styling your data</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        </div>
      </div>
    </div>
  )
}

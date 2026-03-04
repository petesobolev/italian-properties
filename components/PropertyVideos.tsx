"use client";

/**
 * Property Videos Component
 *
 * Displays property videos including uploaded videos and YouTube embeds.
 */

import { useState } from "react";

interface PropertyVideosProps {
  videos: string[];
}

/**
 * Check if URL is a YouTube embed
 */
function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com/embed/") || url.includes("youtu.be");
}

/**
 * Extract YouTube video ID from embed URL
 */
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:embed\/|youtu\.be\/)([^?&]+)/);
  return match ? match[1] : null;
}

export function PropertyVideos({ videos }: PropertyVideosProps) {
  const [activeVideo, setActiveVideo] = useState(0);

  if (!videos || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[activeVideo];
  const isYouTube = isYouTubeUrl(currentVideo);

  return (
    <section className="bg-[var(--color-cream)] dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-[var(--color-sand)] dark:border-gray-700">
      <h2 className="font-display text-2xl text-[var(--color-text)] dark:text-gray-200 mb-4 flex items-center gap-3">
        <span className="w-8 h-0.5 bg-[var(--color-terracotta)]" />
        Videos
      </h2>

      {/* Main Video Player */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
        {isYouTube ? (
          <iframe
            src={`${currentVideo}?rel=0`}
            title="Property video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={`${currentVideo}#t=0.1`}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Video Thumbnails (if multiple) */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {videos.map((video, index) => {
            const isYT = isYouTubeUrl(video);
            const ytId = isYT ? getYouTubeId(video) : null;
            const isActive = index === activeVideo;

            return (
              <button
                key={index}
                onClick={() => setActiveVideo(index)}
                className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? "border-[var(--color-terracotta)] ring-2 ring-[var(--color-terracotta)]/30"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {isYT && ytId ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={`Video ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={`${video}#t=0.1`}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                )}
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {/* YouTube badge */}
                {isYT && (
                  <div className="absolute bottom-1 left-1 bg-red-600 text-white text-[8px] px-1 rounded">
                    YT
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

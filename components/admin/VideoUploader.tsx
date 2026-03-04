"use client";

/**
 * Video Uploader Component
 *
 * Allows agents to upload videos or add YouTube embed URLs.
 * Supports both direct file uploads (to Vercel Blob) and YouTube links.
 */

import { useState, useRef } from "react";

interface VideoUploaderProps {
  videos: string[];
  onChange: (videos: string[]) => void;
  token: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check if URL is a YouTube video
 */
function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be") || extractYouTubeId(url) !== null;
}

/**
 * Get YouTube thumbnail URL
 */
function getYouTubeThumbnail(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "";
}

/**
 * Convert YouTube URL to embed URL
 */
function toYouTubeEmbedUrl(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export default function VideoUploader({ videos, onChange, token }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter for video files
    const videoFiles = files.filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length === 0) {
      alert("Please select video files only.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      videoFiles.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/upload?type=video", {
        method: "POST",
        headers: {
          "X-Admin-Token": token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { urls } = await response.json();
      onChange([...videos, ...urls]);
    } catch (error) {
      console.error("Video upload error:", error);
      alert("Failed to upload videos. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddYouTube = () => {
    const input = youtubeInput.trim();
    if (!input) return;

    const id = extractYouTubeId(input);
    if (!id) {
      alert("Please enter a valid YouTube URL or video ID.");
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${id}`;

    // Check for duplicates
    if (videos.includes(embedUrl)) {
      alert("This video has already been added.");
      return;
    }

    onChange([...videos, embedUrl]);
    setYoutubeInput("");
    setShowYoutubeInput(false);
  };

  const handleRemove = (index: number) => {
    onChange(videos.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
    onChange(newVideos);
  };

  const handleMoveDown = (index: number) => {
    if (index === videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
    onChange(newVideos);
  };

  return (
    <div className="space-y-4">
      {/* Video List */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((url, index) => {
            const isYouTube = isYouTubeUrl(url);
            const thumbnail = isYouTube ? getYouTubeThumbnail(url) : null;

            // Extract filename from URL for uploaded videos
            const filename = !isYouTube ? url.split('/').pop()?.split('?')[0] || 'Video' : null;

            return (
              <div
                key={index}
                className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group"
              >
                {/* Thumbnail / Preview */}
                <div className="aspect-video bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  {isYouTube && thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Video ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  )}
                  {/* Play icon overlay - only for YouTube */}
                  {isYouTube && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* YouTube badge */}
                  {isYouTube && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                      YouTube
                    </div>
                  )}
                  {/* Uploaded video badge */}
                  {!isYouTube && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                      Uploaded
                    </div>
                  )}
                </div>

                {/* Filename for uploaded videos */}
                {!isYouTube && filename && (
                  <div className="px-2 py-1.5 bg-gray-200 dark:bg-gray-600 text-xs text-gray-600 dark:text-gray-300 truncate">
                    {filename}
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      className="p-1 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {index < videos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      className="p-1 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Video Buttons */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? "Uploading..." : "Upload Video"}
        </button>

        <button
          type="button"
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Add YouTube Video
        </button>
      </div>

      {/* YouTube URL Input */}
      {showYoutubeInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
            placeholder="Paste YouTube URL or video ID"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddYouTube();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddYouTube}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowYoutubeInput(false);
              setYoutubeInput("");
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Upload video files directly or add YouTube videos by pasting the URL.
      </p>
    </div>
  );
}

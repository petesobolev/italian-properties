import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * Configures image optimization to allow external images from
 * property listing sources.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.gestionaleimmobiliare.it",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.vittoriserviziimmobiliari.it",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

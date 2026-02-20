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
      {
        protocol: "https",
        hostname: "casaamola.it",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.professioneimmobiliareitalia.it",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gesticasaimmobiliare.it",
        pathname: "/**",
      },
      // Vercel Blob storage for admin-uploaded images and logos
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;

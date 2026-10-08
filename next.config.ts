import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The call screen used to live at /call.
  async redirects() {
    return [{ source: "/call", destination: "/", permanent: true }];
  },
};

export default nextConfig;

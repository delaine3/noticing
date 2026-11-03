import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/capture",
      headers: [{
        key: "Content-Security-Policy",
        // Model downloads and Supabase are the only authorized destinations
        // for browser fetch / XHR on the local capture page. No AI inference
        // provider endpoint is permitted. Model shards may redirect through
        // Hugging Face's documented distribution hosts.
        value: [
          "connect-src 'self' https://*.supabase.co https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.xethub.hf.co https://raw.githubusercontent.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      }],
    }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const withSentry = (config: NextConfig): NextConfig => ({
  ...config,
});

export default withSentry;


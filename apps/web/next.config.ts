import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  redirects() {
    return [
      {
        source: "/company/aapl/profit",
        destination: "/learn/company-analysis/profit",
        permanent: true,
      },
      {
        source: "/company/aapl/profit-margin",
        destination: "/learn/company-analysis/net-profit-margin",
        permanent: true,
      },
      {
        source: "/company/aapl/operating-cash-flow",
        destination: "/learn/company-analysis/operating-cash-flow",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

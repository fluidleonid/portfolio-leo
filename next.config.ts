import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/Leo_Dmitriev_Product_Designer.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="Leo_Dmitriev_Product_Designer.pdf"',
          },
        ],
      },
      {
        source: "/cv.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'attachment; filename="Leo_Dmitriev_Product_Designer.pdf"',
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

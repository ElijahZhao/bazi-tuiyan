import { ImageResponse } from "next/og";

/**
 * 浏览器标签页图标（favicon）
 *
 * 太极图 — 黑红双色，呼应「八字推演」的东方命理主题
 * 朱红(vermilion) + 墨黑(ink) 配色，与站点整体视觉一致
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ed",
          borderRadius: "6px",
        }}
      >
        {/* 太极图 SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          style={{ display: "block" }}
        >
          {/* 外圆 */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2"
          />
          {/* 左半（黑） */}
          <path
            d="M 50 2 A 48 48 0 0 1 50 98 A 24 24 0 0 1 50 50 A 24 24 0 0 0 50 2 Z"
            fill="#1c1917"
          />
          {/* 右半（红） */}
          <path
            d="M 50 2 A 48 48 0 0 0 50 98 A 24 24 0 0 0 50 50 A 24 24 0 0 1 50 2 Z"
            fill="#b91c1c"
          />
          {/* 黑中白点（上方红半中的黑点） */}
          <circle cx="50" cy="26" r="7" fill="#1c1917" />
          {/* 白中黑点 — 用红色替代以保持配色（下方黑半中的红点） */}
          <circle cx="50" cy="74" r="7" fill="#f7f3ed" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

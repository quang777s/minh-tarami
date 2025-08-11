import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./tailwind.css";
import { Toaster } from "~/components/ui/toaster";
import "~/styles/rich-text-editor.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "icon", type: "image/png", href: "/favicon-32x32.png" },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ResearchProject",
              "name": "Hệ thống 999",
              "description": "Mô hình phân tích EQ dựa trên khoa học thần kinh",
              "url": "https://taramind.vn/he-thong-999",
              "citation": [{
                "@type": "ScholarlyArticle",
                "name": "Thinking, Fast and Slow",
                "author": "Daniel Kahneman"
              }]
            })
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

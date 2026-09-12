"use client";

import dynamic from "next/dynamic";

const Playground = dynamic(
  () => import("./Playground").then((m) => m.Playground),
  { ssr: false },
);

export function PlaygroundClient() {
  return <Playground />;
}
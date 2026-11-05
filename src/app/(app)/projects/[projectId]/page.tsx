"use client";

import { Board } from "./board";
import { useWorkspace } from "./workspace-provider";

export default function BoardPage() {
  const { openIssue } = useWorkspace();
  return <Board onOpenIssue={openIssue} />;
}

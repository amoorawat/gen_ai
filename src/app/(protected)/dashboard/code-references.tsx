"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  filesReferences: { fileName: string; sourceCode: string; summary: string }[];
};

const CodeReference = ({ filesReferences }: Props) => {
  const [tab, setTab] = useState(filesReferences[0]?.fileName);
  if (filesReferences.length === 0) return null;
  return (
    <div className="max-w-[75vw]">
      <Tabs value={tab} onValueChange={setTab}>
        {/* Tabs header */}
        <div className="bg-muted no-scrollbar flex gap-2 overflow-x-auto rounded-md p-1">
          {filesReferences.map((file) => (
            <button
              key={file.fileName}
              onClick={() => setTab(file.fileName)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                tab === file.fileName
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {file.fileName}
            </button>
          ))}
        </div>

        {/* Code panels */}
        {filesReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="no-scrollbar mt-2 max-h-[20vh] overflow-auto rounded-md border bg-black p-2"
          >
            <SyntaxHighlighter
              language="typescript"
              style={lucario}
              customStyle={{
                margin: 0,
                background: "transparent",
                fontSize: "0.8rem",
              }}
            >
              {file.sourceCode}
            </SyntaxHighlighter>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReference;

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/hooks/use-project";
import { DialogTitle } from "@radix-ui/react-dialog";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";
import React, { useState } from "react";
import { askQuestion } from "./action";
import { readStreamableValue } from "ai/rsc";
import CodeReference from "./code-references";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [filesReferences, setfilesReferences] = useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setfilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);

    const { output, filesReferences } = await askQuestion(question, project.id);
    setOpen(true);

    setfilesReferences(filesReferences);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden sm:max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image
                className="rounded-md"
                src="/logo.png"
                alt="genAi"
                height={40}
                width={40}
              />
              <span>GenAI Answer</span>
            </DialogTitle>
          </DialogHeader>

          {/* AI Answer */}
          <MDEditor.Markdown
            source={answer}
            className="bg-muted prose prose-sm no-scrollbar max-h-[55vh] max-w-[75vw] overflow-y-auto rounded-md p-4"
          />

          <div className="h-4" />

          {/* Code references */}
          <CodeReference filesReferences={filesReferences} />

          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="which file should  i edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={loading}>
              Ask GenAi
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;

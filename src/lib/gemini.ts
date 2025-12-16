import { OpenRouter } from "@openrouter/sdk";
import { Document } from "@langchain/core/documents";

import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
})

export const openrouter = new OpenRouter({
  apiKey: process.env.GEN_AI_API!,
});

export async function aiSummariseCommit(diff: string){
  const response = await model.generateContent([
    `
You are an expert programmer, and you are trying to summarize a git diff.

Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.

Then there is a specifier of the lines that were modified:
- A line starting with \`+\` means it was added.
- A line starting with \`-\` means it was deleted.
- A line that starts with neither \`+\` nor \`-\` is context and not part of the diff.

[ ... ]

EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the GitHub action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/ootokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`

Most commits will have fewer comments than this example list.
Do NOT include any of the example comments in your summary.

Now summarise the following diff:

\`\`\`diff
${diff}
\`\`\`

Provide 2–6 bullet points describing the real changes.
  `
  ])

  return response.response.text();
}


// 1️⃣ Commit Summary
function extractContent(res: any) {
  return (
    res?.choices?.[0]?.message?.content ||
    res?.choices?.[0]?.content ||
    ""
  );
}


// 2️⃣ File Summary
export async function summariseCode(doc: Document) {
  console.log("getting summary for", doc.metadata.source);

  const code = doc.pageContent.slice(0, 10000);

  const prompt = `
You are a senior software engineer onboarding a junior engineer.
Explain the purpose of the file: ${doc.metadata.source}.

Code:
---
${code}
---

Give a concise explanation (max 50 words).
`;

  try {
    const completion = await openrouter.chat.send({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = extractContent(completion);
    console.log("SUMMARY FOR:", doc.metadata.source, "=>", summary);
    return summary;
  } catch (e) {
    console.error("SUMMARY ERROR:", e);
    return "";
  }
}

// 3️⃣ Embedding

export async function generateEmbedding(summary: string) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(summary);
  const embedding = result.embedding;
  return embedding.values;
}

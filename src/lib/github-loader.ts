import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { generateEmbedding, summariseCode } from './gemini'
import { db } from '@/server/db'

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  try {
    const loader = new GithubRepoLoader(githubUrl, {
      accessToken: githubToken || process.env.GITHUB_TOKEN!,
      branch: "main",
      ignoreFiles: ["package-lock.json", "yarn.lock"],
      recursive: true,
      unknown: "warn",
      maxConcurrency: 5,
    });

    const docs = await loader.load();
    return docs;

  } catch (err) {
    console.error("GITHUB LOADER ERROR:", err);
    throw new Error("Unable to fetch repository files: " + err);
  }
};


export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken)
    const allEmbeddings = await genrateEmbaddings(docs)
    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        if(!embedding) return

        const sourceCodeEmbedding = await db.sourceCodeEmbading.create({
            data: {
                summary: embedding.summary,
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                
                projectId
            }
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbading"
        SET "summaryEmbading" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `
    }))
}

const genrateEmbaddings = async(docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc)
        const embedding = await generateEmbedding(summary)

        return {
            summary,
            embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source
        }
    }))
}
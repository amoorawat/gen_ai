import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";
import { string } from "zod";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// const githubUrl = "https://github.com/amoorawat/next-dashboard-ui";

type Response = {
  commitMessage: string;
  commitHash: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error("Invalid github Url");
  }
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommit = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime(),
  ) as any[];

  return sortedCommit.slice(0, 10).map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.commit?.author?.name ?? "",
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitDate: commit.commit.author.date ?? "",
  }));
};

export const pullCommit = async (projectId: string) => {
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommit = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );


  const summaryResponse = await Promise.allSettled(
    unprocessedCommit.map((commit) => {
      return summariseCommit(githubUrl, commit.commitHash as string);
    }),
  );

  const summaries = summaryResponse.map((response) => {
    if (response.status === "fulfilled") {
      return response.value as string;
    }
    return;
  });

  const commits = await db.commit.createMany({
    data: summaries.map((summary, index) => {
      return {
        projectId,
        commitHash: unprocessedCommit[index]!.commitHash,
        commitMessage: unprocessedCommit[index]!.commitMessage ?? "",
        commitAuthorName: unprocessedCommit[index]!.commitAuthorName ?? "",
        commitAuthorAvatar: unprocessedCommit[index]!.commitAuthorAvatar ?? "",
        commitDate: new Date(unprocessedCommit[index]!.commitDate),
        summary: summary || "",
      };
    }),
  });
  return commits;
};

async function summariseCommit(githubUrl: string, commitHash: string) {
  try {
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
      headers: {
        Accept: `application/vnd.github.v3.diff`,
      },
    });

    const summary = await aiSummariseCommit(data);

    return summary || "";
  } catch (error) {
    console.error("SUMMARISE ERROR:", error);
    return "";
  }
}

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      githubUrl: true,
    },
  });

  if (!project?.githubUrl) {
    throw new Error("Project has no gitHub URL");
  }
  return { project, githubUrl: project.githubUrl };
}

async function filterUnprocessedCommits(
  projectId: string,
  commitHash: Response[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
  });

  const unprocessedCommit = commitHash.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );

  return unprocessedCommit;
}

import z from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { pullCommit } from "@/lib/github"
import { indexGithubRepo } from "@/lib/github-loader"
export const projectRouter = createTRPCRouter({

    //createProject function

    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional()
        })
    ).mutation( async({ctx, input}) => {
        
        const project =  await ctx.db.project.create({
            data: {
                githubUrl: input.githubUrl,
                name: input.name,
                userToProjects: {
                    create: {
                        userId: ctx.user.userId as string
                    }
                }
            }
        })
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
        await pullCommit(project.id)
        return project
    }),

    getProject: protectedProcedure.query( async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId as string
                    }
                },
                deletedAt: null
            }
        })
    }),

    getCommit: protectedProcedure.input(
        z.object({
            projectId: z.string()
        })
    ).query(async ({ctx, input}) => {
        pullCommit(input.projectId).then().catch(console.error)
        return await ctx.db.commit.findMany({
            where: {
                projectId: input.projectId
            }
        })
    })


})
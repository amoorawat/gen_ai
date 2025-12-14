import z from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { pullCommit } from "@/lib/github"
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
    })


})
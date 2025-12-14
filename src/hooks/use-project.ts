import { api } from "@/trpc/react"
import {useLocalStorage} from 'usehooks-ts'

export const useProject = () => {
    const {data: projects} = api.project.getProject.useQuery()
    const [projectId, setProjectId] = useLocalStorage('gen_ai-projectId', ' ')
    const project = projects?.find(project => project.id === projectId)
    return { projects, project, projectId, setProjectId }
}
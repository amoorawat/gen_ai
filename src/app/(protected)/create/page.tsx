'use client'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRefetch } from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form'
import { toast } from 'sonner';

type FormInput = {
    repoUrl: string,
    projectName: string,
    githubToken?: string,
}

const CreatePage = () => {

    const { register, handleSubmit, reset } = useForm<FormInput>();
    const createProject = api.project.createProject.useMutation()
    const refetch = useRefetch()

    function onSubmit(data: FormInput){
        
        createProject.mutate({
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken
        }, {
            onSuccess: () => {
                toast.success('project created successfully')
                refetch()
                reset()
            }, 
            onError: () => {
                toast.error("Failed to create project")
            }
        })
        return true
    }

  return (
    <div className='flex items-center gap-12 h-full justify-center'>
        <img src="/img01.jpg" alt="img01" className='h-56 w-auto rounded-lg' />
        <div>
            <div>
                <h1 className='font-semibold text-2xl'>
                    Link your GitHub repository
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Enter the URL of your repository to link it to gen_ai
                </p>
            </div>
            <div className='h-4'></div>
            <div >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input  {...register('projectName', {required: true})} placeholder='Project name' required  />

                    <div className='h-2'></div>
                        <Input {...register("repoUrl", {required: true})} type='url' placeholder='Github URL' required />
                        
                    <div className='h-2'></div>
                        <Input {...register("githubToken" )} placeholder='Github Token (Optional)'   />
                    
                    <div className='h-2'></div>
                    <Button className='' type='submit' disabled={createProject.isPending}>
                        Create Project
                    </Button>
                   
                </form>
            </div>
        </div>

    </div>
  )
}

export default CreatePage
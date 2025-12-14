'use client'

import React from 'react'
import { useProject } from '@/hooks/use-project'
import { api } from '@/trpc/react'

const CommitLog = () => {

    const {projectId} = useProject()
    const {data: commits} = api.project.getCommit.useQuery({ projectId })

  return (
    <>
        <ul className='space-y-6'>
            {commits?.map((commit, commitIndex) => (
                <li key={commit.id}>

                </li>
            ))}

        </ul>
    </>
  )
}

export default CommitLog
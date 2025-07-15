'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { PlusCircle } from 'lucide-react'

type Repository = {
  id: number
  name: string
  html_url: string
  full_name: string
}

export default function RepositoriesPage() {
  const [search, setSearch] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch('/api/repositories')
        const data = await res.json()
        if (data.repositories) {
          setRepositories(data.repositories)
        }
      } catch (error) {
        console.error('Error fetching repositories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  const handleInstallClick = () => {
    window.location.href = 'https://github.com/apps/platyfend-bot/installations/new'
  }

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
        <p className="text-slate-600 mt-1">
          List of repositories accessible to Platyfend AI.
        </p>
      </div>

      {/* Search Bar */}
      <div>
        <Input
          placeholder="Repo not found? Search here..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Repositories List or Empty State */}
      {loading ? (
        <p className="text-gray-500">Loading repositories...</p>
      ) : filteredRepos.length > 0 ? (
        <ul className="grid gap-4">
          {filteredRepos.map((repo) => (
            <li
              key={repo.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4"
            >
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium hover:underline"
              >
                {repo.full_name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Platyfend-bot currently doesn't have access to repositories for this account.
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto"> 
            Install Platyfend-bot on your GitHub account and grant access to the repositories you want to work with.
          </p>

          <Button
            onClick={handleInstallClick}
            className="bg-[#00748c] hover:bg-[#006578] text-white text-sm px-5 py-2 rounded"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Repositories
          </Button>

          <p className="text-sm text-gray-500 mt-6">
            Not seeing the right organization or account? You can switch by selecting a different one from the dropdown in the top-left corner.
          </p>
        </div>
      )}
    </div>
  )
}
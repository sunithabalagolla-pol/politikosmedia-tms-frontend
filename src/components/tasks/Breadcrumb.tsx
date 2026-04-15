import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  items: { label: string; href?: string }[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
          {item.href ? (
            <button
              onClick={() => navigate(item.href!)}
              className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 dark:text-white font-semibold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

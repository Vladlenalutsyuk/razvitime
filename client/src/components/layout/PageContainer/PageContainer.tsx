//D:\Data USER\Desktop\razvitime\client\src\components\layout\PageContainer\PageContainer.tsx
import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
}

function PageContainer({ children }: PageContainerProps) {
  return <div className="container">{children}</div>
}

export default PageContainer
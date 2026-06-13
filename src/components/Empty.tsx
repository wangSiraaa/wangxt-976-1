import { classNames } from '@/lib/utils'

export default function Empty({ text = '暂无数据' }: { text?: string }) {
  return (
    <div className={classNames('flex h-full min-h-[200px] items-center justify-center text-gray-400')}>
      <div className="text-center">
        <svg className="mx-auto h-16 w-16 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="mt-3 text-sm">{text}</p>
      </div>
    </div>
  )
}

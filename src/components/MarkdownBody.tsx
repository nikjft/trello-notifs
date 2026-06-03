import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownBody({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`prose prose-sm prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
          code: ({ children, className: cls }) => {
            const isBlock = cls?.startsWith('language-');
            return isBlock ? (
              <pre className="bg-gray-800 rounded p-3 overflow-x-auto text-xs">
                <code>{children}</code>
              </pre>
            ) : (
              <code className="bg-gray-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gray-600 pl-3 text-gray-400 italic">{children}</blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

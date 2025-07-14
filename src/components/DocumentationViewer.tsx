import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface DocumentationViewerProps {
  filePath: string;
  className?: string;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ filePath, className }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert the docs path to a public URL
        const publicPath = filePath.replace(/^\/docs/, '/docs');
        const response = await fetch(publicPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn("prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for better rendering
          img: ({ src, alt }) => {
            // Handle relative image paths
            const imageSrc = src?.startsWith('../images/') 
              ? src.replace('../images/', '/docs/orca-slicer/images/')
              : src;
            
            return (
              <img
                src={imageSrc}
                alt={alt || ''}
                className="rounded-lg shadow-md max-w-full h-auto"
                loading="lazy"
              />
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm">{children}</td>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={cn("block p-4 rounded-lg bg-muted overflow-x-auto", className)} {...props}>
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getArticleBySlug } from '../../content/articles';
import BlogLayout from './BlogLayout';

// Dynamically import MDX files
// Vite's glob import for lazy loading MDX files
const mdxModules = import.meta.glob('../../content/*.mdx');

const BlogArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [MDXContent, setMDXContent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const article = slug ? getArticleBySlug(slug) : null;

  useEffect(() => {
    if (!slug || !article) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadMDX = async () => {
      try {
        const modulePath = `../../content/${slug}.mdx`;
        const loader = mdxModules[modulePath];

        if (!loader) {
          console.error(`MDX file not found: ${modulePath}`);
          setError(true);
          setLoading(false);
          return;
        }

        const module = await loader() as { default: React.ComponentType };
        setMDXContent(() => module.default);
        setLoading(false);
      } catch (err) {
        console.error('Error loading MDX:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadMDX();
  }, [slug, article]);

  // Article not found
  if (!article || error) {
    return <Navigate to="/learn" replace />;
  }

  // Loading state
  if (loading || !MDXContent) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--accent-color)]/20 border-t-[var(--accent-color)] rounded-full animate-spin mb-4" />
          <p className="text-[var(--text-secondary)]">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <BlogLayout meta={article}>
      <MDXContent />
    </BlogLayout>
  );
};

export default BlogArticle;

import BlogNavigation from '../../components/blog/BlogNavigation';
import BlogAnalytics from '../../components/blog/BlogAnalytics';
import styles from '../../styles/blog-prose.module.css';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.blogBody}>
      <BlogNavigation />
      {children}
      <BlogAnalytics />
    </div>
  );
}

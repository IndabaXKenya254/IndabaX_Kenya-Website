// ═══════════════════════════════════════════════════════════════════════
// SERVER COMPONENT - Phase 3 SSR Conversion (November 29, 2025)
// ═══════════════════════════════════════════════════════════════════════
// BEFORE: Client-side fetch with React Query (slow, waterfall requests)
// AFTER: Server-side data fetching (fast, parallel with page load)
// Expected Impact: 40-70% faster initial render
// ═══════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/types/api";
import { createPublicClient } from "@/lib/supabase";
import { getOptimizedImageUrl, getBlurDataURL } from "@/lib/image-utils";

async function getLatestPosts(): Promise<Post[]> {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, featured_image, category, published_at')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const LatestNews: React.FC = async () => {
  const posts = await getLatestPosts();

  return (
    <>
      <div className="blog-area ptb-120 bg-image">
        <div className="container">
          <div className="section-title">
            <span>News & Updates</span>
            <h2>
              Latest From Our <b>Blog</b>
            </h2>
            <div className="bar"></div>
            <p className="section-description">
              Stay updated with the latest news, announcements, and stories from IndabaX Kenya. Follow our journey as we build Africa&apos;s premier AI community.
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="row justify-content-center">
              {posts.map((post, index) => (
                <div
                  className="col-lg-4 col-md-6"
                  key={post.id}
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={index * 100}
                >
                  <div className="single-blog-post">
                    <div className="blog-image">
                      <Link href={`/news/${post.slug}`}>
                        <Image
                          src={getOptimizedImageUrl(post.featured_image, { width: 600, height: 400, quality: 80 }) || "/images/posts/default-post.jpg"}
                          alt={post.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index === 0}
                          placeholder="blur"
                          blurDataURL={getBlurDataURL(10, 7)}
                        />
                      </Link>
                      {post.category && (
                        <div className="post-tag">
                          <Link href={`/news?category=${post.category}`}>
                            {post.category}
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="blog-post-content">
                      <div className="post-meta">
                        <ul>
                          <li>
                            <i className="icofont-calendar"></i> {post.published_at && formatDate(post.published_at)}
                          </li>
                        </ul>
                      </div>
                      <h3>
                        <Link href={`/news/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p>{post.excerpt || "Read more to learn about this post"}</p>
                      <Link
                        href={`/news/${post.slug}`}
                        className="read-more-btn"
                        aria-label={`Read more about ${post.title}`}
                      >
                        Read More <i className="icofont-double-right" aria-hidden="true"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <p>No posts available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-5">
            <Link href="/news" className="btn btn-primary btn-lg">
              View All News
              <i className="icofont-double-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LatestNews;

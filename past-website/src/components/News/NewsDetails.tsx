// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEWS/POST DETAILS COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Detailed view for individual news articles and blog posts
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostContent from "@/components/Common/PostContent";
import AuthorInfo from "@/components/AuthorInfo";
import type { PostDetail, Post, ApiSuccessResponse } from "@/types/api";

// Extended PostDetail with Sauti Yetu fields
interface ExtendedPostDetail extends PostDetail {
  post_type?: 'normal' | 'sauti_yetu';
  external_url?: string | null;
  og_image?: string | null;
  source_name?: string | null;
}

interface NewsDetailsProps {
  postId: string;
}

const NewsDetails: React.FC<NewsDetailsProps> = ({ postId }) => {
  const router = useRouter();
  const [post, setPost] = useState<ExtendedPostDetail | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [redirecting, setRedirecting] = useState(false);

  // Get current URL only on client side
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else {
            throw new Error('Failed to fetch post');
          }
          return;
        }

        const result: ApiSuccessResponse<ExtendedPostDetail> = await response.json();
        const fetchedPost = result.data;

        // If this is a Sauti Yetu post with external URL, redirect immediately
        if (fetchedPost.post_type === 'sauti_yetu' && fetchedPost.external_url) {
          setRedirecting(true);
          window.location.href = fetchedPost.external_url;
          return;
        }

        setPost(fetchedPost);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Fetch recent posts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch('/api/posts?limit=5');
        if (response.ok) {
          const result: ApiSuccessResponse<Post[]> = await response.json();
          // Filter out the current post
          const filtered = result.data.filter((p) => p.slug !== postId);
          setRecentPosts(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching recent posts:', err);
      }
    };

    if (postId) {
      fetchRecentPosts();
    }
  }, [postId]);

  // Show redirecting message for Sauti Yetu posts
  if (redirecting) {
    return (
      <div className="news-details-area ptb-120">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Redirecting...</span>
            </div>
            <p className="mt-3">
              <i className="icofont-external-link me-2"></i>
              Redirecting to external article...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="news-details-area ptb-120">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading post...</span>
            </div>
            <p className="mt-3">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="news-details-area ptb-120">
        <div className="container">
          <div className="post-not-found">
            <i className="icofont-file-document"></i>
            <h2>Post Not Found</h2>
            <p>The article you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/news" className="btn btn-primary">
              <i className="icofont-arrow-left"></i> Back to News
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="news-details-area ptb-120">
      <div className="container">
        {/* Breadcrumb */}
        <div className="news-breadcrumb" data-aos="fade-up">
          <Link href="/news">
            <i className="icofont-arrow-left"></i> Back to News
          </Link>
        </div>

        <div className="row">
          {/* Post Content */}
          <div className="col-lg-8">
            {/* Post Header */}
            <article className="post-content" data-aos="fade-up">
              <div className="post-header">
                {post.category && (
                  <div className="post-category-badge">{post.category}</div>
                )}
                <h1>{post.title}</h1>

                <div className="post-meta">
                  <AuthorInfo
                    authorName={post.author_name}
                    authorImage={post.author_image}
                    publishedAt={post.published_at}
                    size="md"
                    showDate={true}
                    className="mb-3"
                  />
                  <div className="author-info" style={{ display: 'none' }}>
                    <div className="author-details">
                      {post.author && <strong>{post.author.email}</strong>}
                      <span className="post-date">
                        <i className="icofont-calendar"></i>{" "}
                        {post.published_at && formatDate(post.published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Image */}
              {post.featured_image && (
                <div className="post-image-wrapper">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    width={1200}
                    height={600}
                    className="post-image"
                  />
                </div>
              )}

              {/* Post Body */}
              <div className="post-body">
                {post.excerpt && <div className="post-excerpt">{post.excerpt}</div>}
                <PostContent htmlContent={post.content || ""} />
              </div>

              {/* Post Footer - Social sharing and related content can go here */}
            </article>

            {/* Related Posts */}
            {/* Related Posts - TODO: Add separate API call for related posts by category */}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="news-sidebar" data-aos="fade-up">
              {/* Share Widget */}
              <div className="sidebar-widget share-widget">
                <h4>Share Article</h4>
                <div className="share-buttons">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn twitter"
                    aria-label="Share on Twitter"
                  >
                    <i className="icofont-twitter" aria-hidden="true"></i>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn facebook"
                    aria-label="Share on Facebook"
                  >
                    <i className="icofont-facebook" aria-hidden="true"></i>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn linkedin"
                    aria-label="Share on LinkedIn"
                  >
                    <i className="icofont-linkedin" aria-hidden="true"></i>
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(currentUrl)}`}
                    className="share-btn email"
                    aria-label="Share via Email"
                  >
                    <i className="icofont-envelope" aria-hidden="true"></i>
                  </a>
                </div>
              </div>

              {/* Categories Widget */}
              {post.category && (
                <div className="sidebar-widget categories-widget">
                  <h4>Category</h4>
                  <ul className="category-list">
                    <li>
                      <Link href={`/news?category=${post.category}`}>
                        <i className="icofont-folder"></i> {post.category}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              {/* Recent Posts Widget */}
              {recentPosts.length > 0 && (
                <div className="sidebar-widget recent-posts-widget">
                  <h4>Recent Posts</h4>
                  <ul className="recent-posts-list">
                    {recentPosts.map((recentPost: any) => {
                      const isSautiYetu = recentPost.post_type === 'sauti_yetu';
                      const postUrl = isSautiYetu && recentPost.external_url
                        ? recentPost.external_url
                        : `/news/${recentPost.slug}`;
                      const imageUrl = recentPost.og_image || recentPost.featured_image;

                      return (
                        <li key={recentPost.id}>
                          {isSautiYetu ? (
                            <a href={postUrl} target="_blank" rel="noopener noreferrer">
                              <div className="recent-post-item">
                                {imageUrl && (
                                  <Image
                                    src={imageUrl}
                                    alt={recentPost.title}
                                    width={80}
                                    height={80}
                                    className="recent-post-thumb"
                                  />
                                )}
                                <div className="recent-post-info">
                                  <h6>
                                    {recentPost.title}
                                    <i className="icofont-external-link ms-1" style={{ fontSize: '0.7em' }}></i>
                                  </h6>
                                  <span className="recent-post-date">
                                    <i className="icofont-globe"></i>{" "}
                                    {recentPost.source_name || 'External'}
                                  </span>
                                </div>
                              </div>
                            </a>
                          ) : (
                            <Link href={postUrl}>
                              <div className="recent-post-item">
                                {imageUrl && (
                                  <Image
                                    src={imageUrl}
                                    alt={recentPost.title}
                                    width={80}
                                    height={80}
                                    className="recent-post-thumb"
                                  />
                                )}
                                <div className="recent-post-info">
                                  <h6>{recentPost.title}</h6>
                                  <span className="recent-post-date">
                                    <i className="icofont-calendar"></i>{" "}
                                    {recentPost.published_at ? new Date(recentPost.published_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'Recently'}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Newsletter Widget */}
              <div className="sidebar-widget newsletter-widget">
                <h4>Subscribe to Newsletter</h4>
                <p>Get the latest IndabaX Kenya updates delivered to your inbox.</p>
                <form className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="form-control"
                    required
                  />
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="icofont-envelope"></i> Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetails;

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEWS/BLOG GRID WITH FILTERS
// ═══════════════════════════════════════════════════════════════════════
// News and blog posts listing with category filters
// ═══════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post, ApiSuccessResponse } from "@/types/api";
import { getOptimizedImageUrl, getBlurDataURL, shouldLazyLoad } from "@/lib/image-utils";

// Extended Post type with Sauti Yetu fields
interface ExtendedPost extends Post {
  post_type?: 'normal' | 'sauti_yetu';
  external_url?: string | null;
  og_image?: string | null;
  source_name?: string | null;
}

const NewsGrid: React.FC = () => {
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPostType, setSelectedPostType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/posts?limit=100');

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const result: ApiSuccessResponse<ExtendedPost[]> = await response.json();
        setPosts(result.data as ExtendedPost[]);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Extract unique categories
  const allCategories = useMemo(() => {
    const categories = Array.from(new Set(posts.map((p) => p.category).filter((c): c is NonNullable<typeof c> => c !== null))).sort();
    return ["All", ...categories];
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;

      const matchesPostType =
        selectedPostType === "All" ||
        (selectedPostType === "normal" && (!post.post_type || post.post_type === "normal")) ||
        (selectedPostType === "sauti_yetu" && post.post_type === "sauti_yetu");

      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesPostType && matchesSearch;
    });
  }, [posts, selectedCategory, selectedPostType, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="news-grid-area ptb-120">
      <div className="container">
        <div className="section-title">
          <span>Latest Updates</span>
          <h2>
            News & <b>Blog</b>
          </h2>
          <div className="bar"></div>
          </div>

        {/* Filters */}
        <div className="news-filters" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-4 col-md-12">
              <div className="filter-group">
                <label htmlFor="search">
                  <i className="icofont-search-1"></i> Search Posts
                </label>
                <input
                  type="text"
                  id="search"
                  className="form-control"
                  placeholder="Search by title, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="filter-group">
                <label htmlFor="category">
                  <i className="icofont-folder"></i> Category
                </label>
                <select
                  id="category"
                  className="form-control"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="filter-group">
                <label htmlFor="postType">
                  <i className="icofont-link"></i> Post Type
                </label>
                <select
                  id="postType"
                  className="form-control"
                  value={selectedPostType}
                  onChange={(e) => setSelectedPostType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="normal">IndabaX Kenya Articles</option>
                  <option value="sauti_yetu">Sauti Yetu (External Links)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="filter-results">
            <p>
              Showing <strong>{filteredPosts.length}</strong> of{" "}
              <strong>{posts.length}</strong> posts
            </p>
            {(selectedCategory !== "All" || selectedPostType !== "All" || searchQuery !== "") && (
              <button
                className="btn btn-text"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedPostType("All");
                  setSearchQuery("");
                }}
              >
                <i className="icofont-close-circled"></i> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5" data-aos="fade-up">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading posts...</span>
            </div>
            <p className="mt-3">Loading posts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" data-aos="fade-up">
            <i className="icofont-warning"></i> {error}
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && filteredPosts.length > 0 ? (
          <div className="row">
            {filteredPosts.map((post, index) => {
              const isSautiYetu = post.post_type === 'sauti_yetu';
              const postUrl = isSautiYetu && post.external_url ? post.external_url : `/news/${post.slug}`;
              const imageUrl = post.og_image || post.featured_image || "/images/posts/default-post.jpg";

              return (
                <div
                  key={post.id}
                  className="col-lg-4 col-md-6"
                  data-aos="fade-up"
                  data-aos-duration="1000"
                  data-aos-delay={index * 50}
                >
                  <article className={`news-card ${isSautiYetu ? 'sauti-yetu-card' : ''}`}>
                    <div className="news-image-wrapper">
                      {isSautiYetu ? (
                        <a href={postUrl} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={getOptimizedImageUrl(imageUrl, { width: 600, quality: 80 }) || "/images/posts/default-post.jpg"}
                            alt={post.title}
                            width={600}
                            height={400}
                            loading={shouldLazyLoad(index, 6) ? "lazy" : "eager"}
                            placeholder="blur"
                            blurDataURL={getBlurDataURL(10, 7)}
                            className="news-image"
                          />
                        </a>
                      ) : (
                        <Link href={postUrl}>
                          <Image
                            src={getOptimizedImageUrl(imageUrl, { width: 600, quality: 80 }) || "/images/posts/default-post.jpg"}
                            alt={post.title}
                            width={600}
                            height={400}
                            loading={shouldLazyLoad(index, 6) ? "lazy" : "eager"}
                            placeholder="blur"
                            blurDataURL={getBlurDataURL(10, 7)}
                            className="news-image"
                          />
                        </Link>
                      )}
                      <div className="news-badges">
                        {post.category && (
                          <div className="news-category-badge">{post.category}</div>
                        )}
                        {isSautiYetu && (
                          <div className="news-external-badge" title="Opens external link">
                            <i className="icofont-external-link"></i> External
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="news-content">
                      <div className="news-meta">
                        <div className="meta-item date">
                          <i className="icofont-calendar"></i>
                          <span>{post.published_at ? formatDate(post.published_at) : 'Draft'}</span>
                        </div>
                        {isSautiYetu && post.source_name && (
                          <div className="meta-item source">
                            <i className="icofont-globe"></i>
                            <span>{post.source_name}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="news-title">
                        {isSautiYetu ? (
                          <a href={postUrl} target="_blank" rel="noopener noreferrer">
                            {post.title}
                            <i className="icofont-external-link ms-2" style={{ fontSize: '0.7em' }}></i>
                          </a>
                        ) : (
                          <Link href={postUrl}>{post.title}</Link>
                        )}
                      </h3>

                      <p className="news-excerpt">{post.excerpt || post.content?.substring(0, 150)}</p>

                      <div className="news-footer">
                        {isSautiYetu ? (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link"
                            aria-label={`Read ${post.title} on ${post.source_name || 'External Site'}`}
                          >
                            Read on {post.source_name || 'External Site'} <i className="icofont-external-link" aria-hidden="true"></i>
                          </a>
                        ) : (
                          <Link
                            href={postUrl}
                            className="btn-link"
                            aria-label={`Read more about ${post.title}`}
                          >
                            Read More <i className="icofont-arrow-right" aria-hidden="true"></i>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results" data-aos="fade-up">
            <i className="icofont-file-document"></i>
            <h3>No posts found</h3>
            <p>Try adjusting your filters or search query to find posts.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedPostType("All");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsGrid;

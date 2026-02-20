import React from "react";
import Link from "next/link";

interface Props {
  pageTitle: string;
  shortText: string;
  homePageUrl?: string;
  homePageText?: string;
  activePageText: string;
  bgImg: string;
  compact?: boolean;
  showBreadcrumb?: boolean; // Issue #43: Option to hide breadcrumb home link
}

// Issue #43: Simplified breadcrumb per client request - removed Home link
const PageBanner: React.FC<Props> = ({
  pageTitle,
  shortText,
  homePageUrl,
  homePageText,
  activePageText,
  bgImg,
  compact = false,
  showBreadcrumb = false, // Default to simplified (no Home link)
}) => {
  return (
    <>
      <div className={`page-title-area ${compact ? 'page-title-area-compact' : ''}`} style={{
        backgroundImage: `url(${bgImg})`
      }}>
        <div className="container">
          <div className="page-title-content">
            <h1>{pageTitle}</h1>
            <span>{shortText}</span>
            <ul>
              {showBreadcrumb && homePageUrl && homePageText && (
                <li>
                  <Link href={homePageUrl}>{homePageText}</Link>
                </li>
              )}
              <li className="active-page">{activePageText}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageBanner;

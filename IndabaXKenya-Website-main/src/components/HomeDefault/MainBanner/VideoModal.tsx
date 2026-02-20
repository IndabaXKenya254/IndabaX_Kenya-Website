"use client";

import React, { useState } from "react";
import FsLightbox from "fslightbox-react";

interface VideoModalProps {
  videoUrl: string;
  showVideo: boolean;
}

const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, showVideo }) => {
  const [toggler, setToggler] = useState(false);

  if (!showVideo) return null;

  return (
    <>
      <FsLightbox
        toggler={toggler}
        sources={[`https://www.youtube.com/embed/${videoUrl}`]}
      />
      <div
        onClick={() => setToggler(!toggler)}
        className="video-btn d-sm-inline"
      >
        <i className="icofont-ui-play"></i> Watch Video
      </div>
    </>
  );
};

export default VideoModal;

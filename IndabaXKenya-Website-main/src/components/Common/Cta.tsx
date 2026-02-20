"use client";

import React from "react";
import Link from "next/link";

const Cta: React.FC = () => {
  return (
    <>
      <div className="cta-area">
        <div className="container">
          <div className="row h-100 align-items-center">
            <div className="col-lg-8">
              <h3>Be Part of the AI Revolution in Africa</h3>
              <span>
                Join hundreds of researchers, students, and industry professionals at IndabaX Kenya 2026
              </span>
            </div>

            <div className="col-lg-4 text-right">
              <Link href="/register" className="btn btn-secondary">
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cta;

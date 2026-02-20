"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const AboutUsContent: React.FC = () => {
  return (
    <>
      <div className="about-area ptb-120 bg-image">
        <div className="container">
          <div className="row h-100 align-items-center">
            <div className="col-lg-6">
              <div className="about-content">
                <span>About Deep Learning IndabaX Kenya</span>
                <h2>
                  Strengthening <b>AI</b> & Machine Learning in Africa
                </h2>

                <p>
                  Deep Learning Indaba is a non-profit organisation whose aim and mission
                  is to strengthen Artificial Intelligence and Machine Learning in Africa.
                  The organisation has representatives located in different countries within
                  Africa who organise small Machine Learning seminars/workshops on yearly
                  basis in their respective countries.
                </p>

                <p>
                  Deep Learning Indaba is responsible for funding and supporting the
                  representatives in organising the small conferences. We also work to
                  convene a yearly global conference where all chapters attend and bring
                  together companies, expertise in Deep learning as well as researchers
                  and students to present their research work. The annual Deep Learning
                  Indaba conference for this year has just concluded in August. Learn more
                  at{" "}
                  <a
                    href="https://deeplearningindaba.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ff5722', textDecoration: 'underline' }}
                  >
                    deeplearningindaba.com
                  </a>.
                </p>

                <p>
                  The Kenyan chapter is named <strong>Deep Learning IndabaX Kenya</strong>.
                  Our chapter was launched in the year 2019, where we have managed to host
                  the summit at various universities such as Strathmore University, Dedan
                  Kimathi University, Maseno University amongst others. The aim of the summit
                  is to support and expose students to AI, linking them with Tech companies
                  where possible.
                </p>

                <Link href="/register" className="btn btn-secondary">
                  Join Us for IndabaX Kenya 2026
                </Link>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="about-image">
                <Image
                  src="/images/about1.jpg"
                  className="about-img1"
                  alt="IndabaX Kenya Event"
                  width={1600}
                  height={1066}
                  priority
                />

                <Image
                  src="/images/about2.jpg"
                  className="about-img2"
                  alt="IndabaX Kenya Community"
                  width={1280}
                  height={853}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsContent;

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SpeakersMember {
  image: string;
  name: string;
  designation: string;
  socialLinks: SocialLink[];
}

interface SocialLink {
  iconName: string;
  url: string;
}

const SpeakersMemberData: SpeakersMember[] = [
  {
    image: "/images/speakers1.jpg",
    name: "James Anderson",
    designation: "Founder & CEO",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
  {
    image: "/images/speakers2.jpg",
    name: "Steven Smith",
    designation: "Lead Designer",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
  {
    image: "/images/speakers3.jpg",
    name: "Lucy Mandana",
    designation: "Developer Expert",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
  {
    image: "/images/speakers4.jpg",
    name: "David Warner",
    designation: "Senio Visual Designer",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
  {
    image: "/images/speakers5.jpg",
    name: "Alberta Amelia",
    designation: "Lead Designer",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
  {
    image: "/images/speakers6.jpg",
    name: "Abbie Edie",
    designation: "Lead Designer",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
      },
    ],
  },
];

const SpeakersThree: React.FC = () => {
  return (
    <>
      <div className="speakers-area-two ptb-120">
        <div className="container">
          <div className="row">
            {SpeakersMemberData &&
              SpeakersMemberData.slice(0, 6).map((value, i) => (
                <div className="col-lg-4 col-sm-6" key={i}>
                  <div className="single-speakers-box">
                    <div className="speakers-image">
                      <Image
                        src={value.image}
                        alt="speaker"
                        width={800}
                        height={800}
                      />
                    </div>

                    <div className="speakers-content">
                      <h3>{value.name}</h3>
                      <span>{value.designation}</span>

                      <ul className="social">
                        {value.socialLinks.map((value, i) => (
                          <li key={i}>
                            <a href={value.url} target="_blank">
                              <i className={value.iconName}></i>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SpeakersThree;

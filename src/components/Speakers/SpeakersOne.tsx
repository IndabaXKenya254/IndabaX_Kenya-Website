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
  bgColor: string;
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
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
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
      },
    ],
  },
  {
    image: "/images/speakers7.jpg",
    name: "Steven Garrad",
    designation: "Developer Expert",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
      },
    ],
  },
  {
    image: "/images/speakers8.jpg",
    name: "David Wiley",
    designation: "Senio Visual Designer",
    socialLinks: [
      {
        iconName: "icofont-facebook",
        url: "https://facebook.com/",
        bgColor: "#4267b2",
      },
      {
        iconName: "icofont-twitter",
        url: "https://twitter.com/",
        bgColor: "#38A1F3",
      },
      {
        iconName: "icofont-instagram",
        url: "https://instagram.com/",
        bgColor:
          "radial-gradient(circle farthest-corner at 35% 90%, #fec564, transparent 50%), radial-gradient(circle farthest-corner at 0 140%, #fec564, transparent 50%), radial-gradient(ellipse farthest-corner at 0 -25%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 20% -50%, #5258cf, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 0, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 60% -20%, #893dc2, transparent 50%), radial-gradient(ellipse farthest-corner at 100% 100%, #d9317a, transparent), linear-gradient(#6559ca, #bc318f 30%, #e33f5f 50%, #f77638 70%, #fec66d 100%)",
      },
      {
        iconName: "icofont-linkedin",
        url: "https://linkedin.com/",
        bgColor: "#0077B5",
      },
    ],
  },
];

const SpeakersOne: React.FC = () => {
  return (
    <>
      <div className="speakers-area ptb-120">
        <div className="row m-0">
          {SpeakersMemberData &&
            SpeakersMemberData.slice(0, 8).map((value, i) => (
              <div className="col-lg-3 col-sm-6 p-0" key={i}>
                <div className="single-speakers">
                  <Image
                    src={value.image}
                    alt="Speaker"
                    width={800}
                    height={800}
                  />

                  <div className="speakers-content">
                    <h3>{value.name}</h3>
                    <span>{value.designation}</span>
                  </div>

                  <ul>
                    {value.socialLinks.map((value, i) => (
                      <li key={i}>
                        <a
                          href={value.url}
                          target="_blank"
                          style={{
                            background: `${value.bgColor}`,
                          }}
                        >
                          <i className={value.iconName}></i>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default SpeakersOne;

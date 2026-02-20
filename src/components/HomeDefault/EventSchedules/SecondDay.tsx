"use client";

import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
import Image from "next/image";

const SecondDay: React.FC = () => {
  return (
    <>
      <Accordion>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              <div className="author">
                <Image
                  src="/images/author1.jpg"
                  title="Steven Smith"
                  alt="Author"
                  width={150}
                  height={150}
                />
              </div>

              <div className="schedule-info">
                <h3>
                  Introduction to prejudice, stereotyping, microaggressions
                </h3>

                <ul>
                  <li>
                    <i className="icofont-user-suited"></i> By{" "}
                    <span>Tom Hanks</span> CEO of EnvyTheme
                  </li>
                  <li>
                    <i className="icofont-wall-clock"></i> 13:00AM - 20:00PM
                  </li>
                </ul>
              </div>
            </AccordionItemButton>
          </AccordionItemHeading>

          <AccordionItemPanel>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry standard dummy text
              ever since the 1500s, when an unknown printer took Link galley of
              type and scrambled it to make Link type specimen book.
            </p>

            <div className="row h-100 align-items-center">
              <div className="col-lg-6 col-md-7">
                <div className="location">
                  <b>Location:</b> Hall 431, Building C , King Street ,{" "}
                  <span>USA</span>
                </div>
              </div>

              <div className="col-lg-6 col-md-5 text-right">
                <Link href="#" className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          </AccordionItemPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              <div className="author author-multi">
                <Image
                  src="/images/author5.jpg"
                  title="Steven Lucy"
                  alt="Author"
                  width={150}
                  height={150}
                />
                <Image
                  src="/images/author2.jpg"
                  title="Jonaton Smith"
                  alt="Author"
                  width={150}
                  height={150}
                />
                <Image
                  src="/images/author3.jpg"
                  title="John Smith"
                  alt="Author"
                  width={150}
                  height={150}
                />
                <Image
                  src="/images/author4.jpg"
                  title="John Doe"
                  alt="Author"
                  width={150}
                  height={150}
                />
              </div>

              <div className="schedule-info">
                <h3>Mental health within various cultures and identities</h3>

                <ul>
                  <li>
                    <i className="icofont-user-suited"></i> By{" "}
                    <span>Matt Damon</span> of USA Inc
                  </li>
                  <li>
                    <i className="icofont-wall-clock"></i> 13:00AM - 20:00PM
                  </li>
                </ul>
              </div>
            </AccordionItemButton>
          </AccordionItemHeading>

          <AccordionItemPanel>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry standard dummy text
              ever since the 1500s, when an unknown printer took Link galley of
              type and scrambled it to make Link type specimen book. Lorem Ipsum
              is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry standard dummy text ever since
              the 1500s, when an unknown printer took Link galley of type and
              scrambled it to make Link type specimen book.
            </p>

            <div className="row h-100 align-items-center">
              <div className="col-lg-6 col-md-7">
                <div className="location">
                  <b>Location:</b> Hall 1c2, Building C , King Street ,{" "}
                  <span>USA</span>
                </div>
              </div>

              <div className="col-lg-6 col-md-5 text-right">
                <Link href="#" className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          </AccordionItemPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              <div className="author author-multi">
                <Image
                  src="/images/author6.jpg"
                  title="Steven Lucy"
                  alt="Author"
                  width={150}
                  height={150}
                />
                <Image
                  src="/images/author7.jpg"
                  title="Jonaton Smith"
                  alt="Author"
                  width={150}
                  height={150}
                />
              </div>

              <div className="schedule-info">
                <h3>Working with Distressed Students</h3>

                <ul>
                  <li>
                    <i className="icofont-user-suited"></i> By{" "}
                    <span>Johnny Depp</span> of USA Inc
                  </li>
                  <li>
                    <i className="icofont-wall-clock"></i> 13:00AM - 20:00PM
                  </li>
                </ul>
              </div>
            </AccordionItemButton>
          </AccordionItemHeading>

          <AccordionItemPanel>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry standard dummy text
              ever since the 1500s, when an unknown printer took Link galley of
              type and scrambled it to make Link type specimen book. Lorem Ipsum
              is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry standard dummy text ever since
              the 1500s, when an unknown printer took Link galley of type and
              scrambled it to make Link type specimen book.
            </p>

            <div className="row h-100 align-items-center">
              <div className="col-lg-6 col-md-7">
                <div className="location">
                  <b>Location:</b> Hall 1, Building C , King Street ,{" "}
                  <span>USA</span>
                </div>
              </div>

              <div className="col-lg-6 col-md-5 text-right">
                <Link href="#" className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default SecondDay;

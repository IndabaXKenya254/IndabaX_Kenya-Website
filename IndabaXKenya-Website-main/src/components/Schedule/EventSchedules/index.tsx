"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import FirstDay from "./FirstDay";
import SecondDay from "./SecondDay";
import ThirdDay from "./ThirdDay";
import FourthDay from "./FourthDay";

const EventSchedules: React.FC = () => {
  return (
    <>
      <div className="schedule-area bg-image ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Schedule Plan</span>
            <h2>
              Information of <b>Event</b> <br /> Schedules
            </h2>

            <div className="bg-title">Events</div>

            <Link href="#" className="btn btn-primary">
              Buy Tickets Now!
            </Link>

            <div className="bar"></div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <Tabs className="event-tabs">
                <TabList>
                  <Tab>
                    First Day
                    <span>4 April 2024</span>
                  </Tab>

                  <Tab>
                    Second Day
                    <span>5 April 2024</span>
                  </Tab>

                  <Tab>
                    Third Day
                    <span>6 April 2024</span>
                  </Tab>

                  <Tab>
                    Fourth Day
                    <span>7 April 2024</span>
                  </Tab>
                </TabList>

                <TabPanel>
                  <FirstDay />
                </TabPanel>

                <TabPanel>
                  <SecondDay />
                </TabPanel>

                <TabPanel>
                  <ThirdDay />
                </TabPanel>

                <TabPanel>
                  <FourthDay />
                </TabPanel>
              </Tabs>
            </div>

            <div className="col-lg-12">
              <div className="btn-box">
                <Link href="#" className="btn btn-primary">
                  Download Schedule (PDF)
                </Link>
                <Link href="#" className="btn btn-secondary">
                  Connect Via Instagram
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Shape Image */}
        <div className="shape1">
          <Image
            src="/images/shapes/1.png"
            alt="shape1"
            width={77}
            height={77}
          />
        </div>
        <div className="shape2 rotateme">
          <Image
            src="/images/shapes/2.png"
            alt="shape2"
            width={38}
            height={38}
          />
        </div>
        <div className="shape3 rotateme">
          <Image
            src="/images/shapes/3.png"
            alt="shape3"
            width={51}
            height={57}
          />
        </div>
        <div className="shape4">
          <Image
            src="/images/shapes/4.png"
            alt="shape4"
            width={29}
            height={29}
          />
        </div>
      </div>
    </>
  );
};

export default EventSchedules;

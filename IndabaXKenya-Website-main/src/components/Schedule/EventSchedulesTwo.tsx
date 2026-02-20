"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Image from "next/image";

const EventSchedulesTwo: React.FC = () => {
  return (
    <>
      <div className="schedule-area bg-image ptb-120">
        <div className="container">
          <div className="section-title">
            <span>Schedule Plan</span>
            <h2>
              Information of <b>Event</b> <br /> Schedules
            </h2>

          </div>

          <div className="row">
            <Swiper
              navigation={true}
              modules={[Navigation]}
              className="schedule-slides"
            >
              <SwiperSlide className="col-lg-12 col-md-12">
                <div className="schedule-slides-item">
                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 01
                          <span>4 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author">
                        <Image
                          src="/images/author1.jpg"
                          title="Riley"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital Marketing Theory</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i> By{" "}
                            <Link href="#">Riley</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 01
                          <span>4 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author5.jpg"
                          title="Gilbert"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author2.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital World Event Information</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i> By{" "}
                            <Link href="#">Gilbert</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 01
                          <span>4 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author6.jpg"
                          title="Steven Lucy"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author7.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">
                            HTML, CSS and Bootstrap Introduction
                          </Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i>
                            By <Link href="#">Brian</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 01
                          <span>4 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author8.jpg"
                          title="Steven Lucy"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author9.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital World Event Information</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i>
                            By <Link href="#">Roberto</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>

              <SwiperSlide className="col-lg-12 col-md-12">
                <div className="schedule-slides-item">
                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 02
                          <span>5 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author">
                        <Image
                          src="/images/author1.jpg"
                          title="Steven Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital Marketing Theory</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i>
                            By <Link href="#">Ramon</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 02
                          <span>5 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author5.jpg"
                          title="Steven Lucy"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author2.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital World Event Information</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i>
                            By <Link href="#">Steven Smith</Link> CEO of
                            EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 02
                          <span>5 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author6.jpg"
                          title="Steven Lucy"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author7.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">
                            HTML, CSS and Bootstrap Introduction
                          </Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i>
                            By <Link href="#">Miles</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="single-schedule">
                    <div className="schedule-date">
                      <div className="d-table">
                        <div className="d-table-cell">
                          Day - 02
                          <span>5 April 2024</span>
                        </div>
                      </div>
                    </div>

                    <div className="schedule-content">
                      <div className="author author-multi">
                        <Image
                          src="/images/author8.jpg"
                          title="Steven Lucy"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author9.jpg"
                          title="Jonaton Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author3.jpg"
                          title="John Smith"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                        <Image
                          src="/images/author4.jpg"
                          title="John Doe"
                          alt="schedule"
                          width={150}
                          height={150}
                        />
                      </div>

                      <div className="schedule-info">
                        <h3>
                          <Link href="#">Digital World Event Information</Link>
                        </h3>

                        <ul>
                          <li>
                            <i className="icofont-user-suited"></i> By{" "}
                            <Link href="#">Nathaniel</Link> CEO of EnvyTheme
                          </li>
                          <li>
                            <i className="icofont-wall-clock"></i> 13:00AM -
                            20:00PM
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>

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

        {/* Shape Images */}
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

export default EventSchedulesTwo;

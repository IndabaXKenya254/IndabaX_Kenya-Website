"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
import ContactForm from "./ContactForm";

const FaqContent: React.FC = () => {
  return (
    <>
      <div className="faq-area ptb-120">
        <div className="container">
          <div className="faq-accordion">
            <Accordion>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Which material types can you work with?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Is Smart Lock required for instant apps?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Can I have multiple activities in a single feature?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Can I share resources between features?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Is Smart Lock required for instant apps?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Can I have multiple activities in a single feature?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    Can I share resources between features?
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Quis ipsum suspendisse ultrices gravida.
                  </p>
                </AccordionItemPanel>
              </AccordionItem>
            </Accordion>
          </div>

          {/* ContactForm */}
          <ContactForm />
        </div>
      </div>
    </>
  );
};

export default FaqContent;

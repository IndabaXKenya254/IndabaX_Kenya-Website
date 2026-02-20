"use client";

import React from "react";

const ContactInfo: React.FC = () => {
  return (
    <>
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="contact-box">
            <div className="icon">
              <i className="icofont-email"></i>
            </div>

            <div className="content">
              <h4>E-mail</h4>
              <p>info@deeplearningindabaxkenya.com</p>
              <p>support@deeplearningindabaxkenya.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactInfo;

import React from "react";
import { useNavigate } from "react-router-dom";
import './HomePage.css'
import ImageSlider from "./ImageSlider.jsx";
const HomePage = () => {
  const navigate = useNavigate();
  const slide = [
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp1.jpg', title : 'image1'},
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp2.jpg', title : 'image2'},
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp3.jpg', title : 'image3'},
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp4.jpg', title : 'image4' },
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp5.jpg', title : 'image5'},
    {url:	'https://www.nirmanjashpur.in/web_assets/images/njsp6.jpg', title : 'image6'},
  ]
  return (
    <div className="home-container">
      {/* 🔹 About Section */}
      <section className="section">
        <div className="about-container">
          <div className="about-text">
            <p>डिजिटल - रायपुर</p>
            <h1>निर्माण रायपुर पोर्टल</h1>
            <button
              className="link-forward"
              onClick={() => navigate("/login")}
            >
              आगे बढ़े
            </button>
          </div>
          <div>
            <video controls muted playsInline autoPlay>
              <source src="https://www.nirmanjashpur.in/assets/video/nirman.mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* 🔹 Display Section */}
      <div className="info">
        <div className="info-container">
          <div className="box"></div>
          <img
            src="/images/cm.png"
            alt="overlap"
            className="overlap-img"
          />
        </div>
        <div className="info-text">
          <h1>परिचय</h1>
          <h2>निर्माण रायपुर को जानें</h2>
          <ul>
            <li>
              <i className="fa-solid fa-hand-point-right pe-2 pb-3"></i>
              <p>जशपुर जिला प्रशासन द्वारा एक अग्रणी पहल।</p>
            </li>
            <li>
              <i className="fa-solid fa-hand-point-right pe-2 pb-3"></i>
              <span>
                शासन को डिजिटाइज़ करता है और प्रक्रियाओं को सुव्यवस्थित
                करने के लिए सरकारी योजनाओं को एकीकृत करता है।
              </span>
            </li>
            <li>
              <i className="fa-solid fa-hand-point-right pe-2 pb-3"></i>
              <p>
                डिजिटल इंडिया इनिशिएटिव और 'सबका साथ , सबका विकास, सबका
                विश्वास' के सिद्धांतों के साथ संरेखित करता है
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* 🔹 Details Section */}
      <section className="details">
        <div className="details-text">
          <h1>निर्माण रायपुर संबंधी</h1>
          <p>
            निर्माण रायपुर पोर्टल जिला प्रशासन की एक अनोखी पहल है, जिसका
            उद्देश्य जिले का डिजिटलीकरण और सशक्तिकरण करना है। यह पोर्टल
            जिले की जनसंख्या को जोड़कर, योजना निर्माण में उनकी भागीदारी
            सुनिश्चित करता है और उन्हें वास्तविक समय में डेटा तक पहुंच
            प्रदान करता है। साथ ही, यह पोर्टल निम्न सुविधाएं प्रदान करता है:
            <br />• परियोजनाओं पर निगरानी  
            <br />• जियो-टैग्ड दस्तावेजीकरण  
            <br />• विज़ुअल स्टेटस इंडिकेटर  
            <br />• केंद्रीकृत डैशबोर्ड  
            <br />
            यह पोर्टल डिजिटल साक्षरता को बढ़ावा देने, प्रक्रियाओं को तकनीक
            के माध्यम से डिजिटल करने, पारदर्शिता बढ़ाने और साक्ष्य-आधारित
            निर्णय लेने में मदद करता है।
          </p>
        </div>
        <div className="details-image">
            <ImageSlider slides = {slide}  alt="image-sliding" />
        </div>
      </section>

      {/* 🔹 Footer Section */}
      <footer className="footer">
        <div className="footer-content">
          <img
            src="https://www.nirmanjashpur.in/web_assets/images/njsplogo.png"
            alt="jaspurlogo"
            className="logo"
          />

          <div className="footer-contact">
            <h1>महत्वपूर्ण संपर्क</h1>
            <ul>
              <p>
                <i className="fas fa-envelope"></i>
                Email :
                <a href="mailto:dplc-jashpur@cg.gov.in">
                  dplc-raipur@cg.gov.in
                </a>
              </p>
              <p>
                <i className="fas fa-phone"></i>
                Phone : <a href="tel:7049790009">7049790009</a>
              </p>
            </ul>
          </div>

          <div className="footer-links">
            <h1>महत्वपूर्ण लिंक</h1>
            <ul>
              <li>
                <a href="https://jashpur.nic.in/" target="_blank" rel="noreferrer">
                  <i className="fas-solid fa-chevron-right"></i>
                  रायपुर जिला आधिकारिक वेबसाइट
                </a>
              </li>
              <li>
                <a href="https://jashpur.nic.in/" target="_blank" rel="noreferrer">
                  <i className="fas-solid fa-chevron-right"></i>
                  स्वास्थ्य रायपुर
                </a>
              </li>
              <li>
                <a href="https://jashpur.nic.in/" target="_blank" rel="noreferrer">
                  <i className="fas-solid fa-chevron-right"></i>
                  समय-सीमा रायपुर
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-social">
            <h1>तकनीकी सहायता</h1>
            <p>निर्माण रायपुर वेबसाइट से संबंधित किसी भी सहायता हेतु:</p>
            <button>
              <a href="tel:7049790009">7049790009</a>
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            Copyright © 2025. निर्माण रायपुर | Designed & Developed By{" "}
            <a
              href="https://www.linkedin.com/company/turing-club-of-programmers-nitrr/?originalSubdomain=in"
              className="turingclub"
              target="_blank"
              rel="noopener noreferrer"
            >
              Turing Club of Programmers NIT Raipur
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

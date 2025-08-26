import React, { useState } from "react";

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("❌ कृपया सभी फ़ील्ड भरें");
      setSuccess("");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("❌ कृपया वैध ईमेल पता दर्ज करें");
      setSuccess("");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error scenarios
        if (response.status === 401) {
          throw new Error("❌ गलत ईमेल या पासवर्ड");
        } else if (response.status === 400) {
          throw new Error("❌ " + (data.message || "गलत डेटा प्रदान किया गया"));
        } else if (response.status === 500) {
          throw new Error("❌ सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें");
        } else {
          throw new Error("❌ " + (data.message || "लॉगिन में त्रुटि हुई"));
        }
      }

      // Check if login was successful
      if (!data.success) {
        throw new Error("❌ " + (data.message || "लॉगिन में त्रुटि हुई"));
      }

      // Success response - store user data and token
      console.log("Login successful:", data);
      
      if (data.data?.token) {
        localStorage.setItem("authToken", data.data.token);
      }
      if (data.data?.user) {
        localStorage.setItem("userData", JSON.stringify(data.data.user));
      }

      setSuccess("✅ सफलतापूर्वक लॉगिन हो गए!");
      setError("");

      // Call success callback with user data after a short delay
      setTimeout(() => {
        onLoginSuccess({
          user: data.data.user,
          token: data.data.token
        });
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError("❌ नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें");
      } else {
        setError(error.message || "❌ लॉगिन में त्रुटि हुई");
      }
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "fit-content",
        backgroundSize: "cover",
        backgroundPosition: "start",
        color: "black",
        paddingRight: "200px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "12px",
          marginTop: "10vh",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          width: "350px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#565b56ff",
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h1
            style={{
              margin: "0",
              fontSize: "26px",
              fontWeight: "bold",
              color: "#ff620d",
            }}
          >
            निर्माण - लॉगिन
          </h1>
          <p
            style={{
              marginTop: "10px",
              fontSize: "16px",
              color: "#ffffffff",
            }}
          >
            कृपया अपना ईमेल और पासवर्ड दर्ज करे।
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label htmlFor="email" style={{ textAlign: "left" }}>
            ईमेल पता
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            disabled={isLoading}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          
          <label htmlFor="password" style={{ textAlign: "left" }}>
            पासवर्ड
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="पासवर्ड"
            disabled={isLoading}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              opacity: isLoading ? 0.6 : 1,
            }}
          />

          {error && (
            <p style={{ color: "red", margin: "5px 0", fontSize: "14px" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: "green", margin: "5px 0", fontSize: "14px" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              fontSize: "20px",
              background: isLoading ? "#ccc" : "#249335ff",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.3s",
            }}
          >
            {isLoading ? "लॉगिन हो रहा है..." : "Log in"}
          </button>
        </form>

        {/* Demo credentials display */}
        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          backgroundColor: "#f0f0f0", 
          borderRadius: "5px",
          fontSize: "12px"
        }}>
          <strong>Demo Credentials:</strong><br/>
          Email: technical2.approver@raipur.gov.in<br/>
          Password: Tech@54321
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

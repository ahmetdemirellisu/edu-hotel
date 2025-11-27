import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Search, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import backgroundImage from "figma:asset/9bf36aafa693f4a63cbdf015b397abd2911f2e4f.png";

// IMPORTANT: your backend base URL from Vite env
const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
console.log("API_URL =", API_URL);


export function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // form state
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // for now backend expects "email" field; we send identifier there
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier, // can be email or phone for now
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // success: store token, user, etc.
      // You can improve this later with context / Redux / router navigation.
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userEmail", data.user?.email ?? "");
      localStorage.setItem("userName", data.user?.name ?? "");

      console.log("Logged in:", data.user);

      // redirect to main page
      navigate("/main");

      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="border-2 border-white px-3 py-1">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-white tracking-widest">E D U   H O T E L</h1>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">
                My SU
              </a>
              <button className="hover:text-gray-300 transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <a href="#" className="hover:text-gray-300 transition-colors">
                TR
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />

        {/* Content with relative positioning to appear above background */}
        <div className="relative z-10">
          <div className="flex justify-center">
            {/* Login Form */}
            <div className="w-full max-w-md">
              <Card className="border-gray-200">
                <CardContent className="space-y-6 pt-6">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="loginMethod">Login with</Label>
                      <select
                        id="loginMethod"
                        value={loginMethod}
                        onChange={(e) =>
                          setLoginMethod(e.target.value as "email" | "phone")
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366]"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone Number</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">
                        {loginMethod === "email"
                          ? "Email Address"
                          : "Phone Number"}
                      </Label>
                      <Input
                        id="username"
                        type={loginMethod === "email" ? "email" : "tel"}
                        placeholder={
                          loginMethod === "email"
                            ? "Enter your email"
                            : "Enter your phone number"
                        }
                        className="border-gray-300"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="border-gray-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#003366] hover:bg-[#002244] text-white"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login to your account"}
                    </Button>

                    <div className="space-y-3">
                      <a
                        href="#"
                        className="text-sm text-[#003366] hover:underline block"
                      >
                        Forgot your password?
                      </a>
                      <Link
                        to="/signup"
                        className="text-sm text-[#003366] hover:underline block"
                      >
                        First time user? Create account
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#003366] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="border-2 border-white px-3 py-1 inline-block mb-4">
                <div className="text-sm">Sabancı</div>
                <div className="text-sm">Üniversitesi</div>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Orta Mahalle, Üniversite Caddesi No: 27
                <br />
                Tuzla, İstanbul 34956 Turkey
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Academic
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Research
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Campus Life
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Library
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    SuCourse
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Email
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Phone: +90 (216) 483 9000</li>
                <li>Email: info@sabanciuniv.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2025 Sabancı University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

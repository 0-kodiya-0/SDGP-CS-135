"use client";

import { useState, useEffect } from "react";
import { FaGoogle, FaMicrosoft, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setIsMounted] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = () => {
    setIsPasswordVisible(true);
  };

  const handleMouseUp = () => {
    setIsPasswordVisible(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Signed in successfully!");
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center bg-background text-foreground px-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-lg shadow-lg bg-card border border-border"
      >
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-3xl font-bold text-center mb-6 text-foreground"
        >
          Welcome Back
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-foreground mb-6"
        >
          Sign in to continue your journey
        </motion.p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div whileFocus={{ scale: 1.05 }}>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 border border-border focus:ring-ring rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-transform"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>
          <motion.div whileFocus={{ scale: 1.05 }} className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
            <input
              type={isPasswordVisible ? "text" : "password"}
              id="password"
              className="w-full px-4 py-3 pr-12 border border-input rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-transform"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-muted-foreground hover:text-foreground"
            >
              {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-3 mt-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-transform shadow-md"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>
        <div className="mt-6 flex items-center justify-between">
          <hr className="w-full border-border" />
          <span className="px-2 text-sm text-muted-foreground">OR</span>
          <hr className="w-full border-border" />
        </div>
        <div className="mt-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-lg hover:bg-card-hover transition-transform shadow-md"
          >
            <FaGoogle className="text-red-500" /> Sign in with Google
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-lg hover:bg-card-hover transition-transform shadow-md"
          >
            <FaMicrosoft className="text-blue-500" /> Sign in with Microsoft
          </motion.button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {`Don't have an account?`} <Link href="/signup" className="text-blue-accent hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}

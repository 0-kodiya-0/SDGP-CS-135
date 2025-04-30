"use client";

import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setIsMounted] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseDown = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  };

  const handleMouseUp = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Account created successfully!");
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
          Create an Account
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-foreground mb-6"
        >
          Join us and explore amazing features!
        </motion.p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div whileFocus={{ scale: 1.05 }}>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-3 border border-border focus:ring-ring rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-transform"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </motion.div>
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
              onMouseDown={() => handleMouseDown(setIsPasswordVisible)}
              onMouseUp={() => handleMouseUp(setIsPasswordVisible)}
              onMouseLeave={() => handleMouseUp(setIsPasswordVisible)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-muted-foreground hover:text-foreground"
            >
              {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </motion.div>
          <motion.div whileFocus={{ scale: 1.05 }} className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">Confirm Password</label>
            <input
              type={isConfirmPasswordVisible ? "text" : "password"}
              id="confirmPassword"
              className="w-full px-4 py-3 pr-12 border border-input rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-transform"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onMouseDown={() => handleMouseDown(setIsConfirmPasswordVisible)}
              onMouseUp={() => handleMouseUp(setIsConfirmPasswordVisible)}
              onMouseLeave={() => handleMouseUp(setIsConfirmPasswordVisible)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-muted-foreground hover:text-foreground"
            >
              {isConfirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </motion.div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-3 mt-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-transform shadow-md"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/signin" className="text-blue-accent hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}

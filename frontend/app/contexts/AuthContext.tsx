"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // load saved auth on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setUser(parsed.user || null);
      setToken(parsed.token || null);
    } catch (err) {
      console.error("Error reading auth from storage", err);
    }
  }, []);

  // persist auth
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("auth", JSON.stringify({ user, token }));
    } catch (err) {
      console.error("Error writing auth to storage", err);
    }
  }, [user, token]);

  // common JSON fetch helper
  const postJson = async (url, payload) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { ok, data } = await postJson(
        "http://localhost:5000/api/user/register",
        payload
      );
      setLoading(false);
      if (!ok) {
        const msg =
          (data && (data.message || data.error)) || "Registration failed";
        return { ok: false, error: msg, raw: data };
      }
      // if backend returns user/token on register, store them
      const outToken =
        data?.token || data?.accessToken || data?.data?.token || null;
      const outUser = data?.user || data?.data?.user || null;
      if (outToken || outUser) {
        setToken(outToken);
        setUser(outUser);
      }
      return { ok: true, data };
    } catch (err) {
      setLoading(false);
      return { ok: false, error: err.message || String(err) };
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const { ok, data } = await postJson(
        "http://localhost:5000/api/user/login",
        payload
      );
      setLoading(false);
      if (!ok) {
        const msg = (data && (data.message || data.error)) || "Login failed";
        return { ok: false, error: msg, raw: data };
      }
      // typical response shapes: { token, user } or { data: { token, user } } or { accessToken, user }
      const outToken =
        data?.token || data?.accessToken || data?.data?.token || null;
      const outUser = data?.user || data?.data?.user || null;

      // If backend returns token/user, persist them
      if (outToken || outUser) {
        setToken(outToken);
        setUser(outUser);
      } else {
        // If backend returns something else (e.g. only message), keep that in data
      }

      return { ok: true, data };
    } catch (err) {
      setLoading(false);
      return { ok: false, error: err.message || String(err) };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth");
    }
  };

  return (
    <AuthContext.Provider
      value={{ register, login, logout, user, token, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

"use client";

import axios, { endpoints } from "src/lib/axios";
import { setSession } from "./utils";
import { JWT_STORAGE_KEY } from "./constant";

/** **************************************
 * Sign in
 *************************************** */

export const signInWithPassword = async ({ email, password }) => {
  try {
    const res = await axios.post(endpoints.auth.signIn, { email, password });
    const { token: accessToken } = res.data;

    if (!accessToken) {
      throw new Error("[AUTH_004] 토큰이 만료되었습니다.");
    }

    setSession(accessToken);
  } catch (error) {
    console.error("Error during sign in:", error);
    throw error;
  }
};

export const signInWithAdminID = async ({ adminId, adminPw }) => {
  console.log(adminId, adminPw);
  try {
    const res = await axios.post(endpoints.admin.signIn, { adminId, adminPw });
    const { token: accessToken } = res.data;

    if (!accessToken) {
      throw new Error("[AUTH_002] 토큰이 만료되었습니다.");
    }

    setSession(accessToken);
  } catch (error) {
    console.error("Error during sign in:", error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */

export const signUp = async ({
  email,
  name,
  shop_name,
  password,
  phone,
  business_number,
  bank_type,
  bank_account,
}) => {
  try {
    const res = await axios.post(endpoints.auth.signUp, {
      email,
      name,
      shop_name,
      password,
      phone,
      business_number,
      bank_type,
      bank_account,
    });
    const { token: accessToken } = res.data;

    if (!accessToken) {
      throw new Error("[AUTH_003] 토큰이 발급되지 않았습니다.");
    }

    setSession(accessToken);
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */

export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
};

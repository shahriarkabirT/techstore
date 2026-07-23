import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { hashPassword } from "@/lib/auth";
import { sendOTPEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "Invalid or empty request body" },
        { status: 400 },
      );
    }

    const { name, email, password, phone, address, otpPreference } = body;

    // Validation
    if (!name || !email || !password || !phone || !address) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Check global settings for OTP
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (!settings.emailOtpEnabled && !settings.smsOtpEnabled) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration is temporarily unavailable (OTP system offline).",
        },
        { status: 503 },
      );
    }

    // Determine which method to use
    let method: "email" | "sms" = "email";
    if (settings.emailOtpEnabled && settings.smsOtpEnabled) {
      method = otpPreference === "sms" ? "sms" : "email";
    } else if (settings.smsOtpEnabled) {
      method = "sms";
    } else {
      method = "email";
    }

    const emailLower = email.toLowerCase();

    // Prevent duplicate phone error if phone is used by someone else
    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser && existingPhoneUser.email !== emailLower) {
      if (
        existingPhoneUser.isEmailVerified ||
        existingPhoneUser.isPhoneVerified
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Phone number is already registered to a verified account.",
          },
          { status: 409 },
        );
      } else {
        // The other account is unverified, so we can delete it to free up the phone number
        await User.findByIdAndDelete(existingPhoneUser._id);
      }
    }

    const existingUser = await User.findOne({ email: emailLower });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const hashedPassword = await hashPassword(password);

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { success: false, message: "Email already registered and verified" },
          { status: 409 },
        );
      }

      // Update unverified user to "register again"
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.phone = phone;
      existingUser.address = address;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.lastOtpMethod = method;
      await existingUser.save();
    } else {
      // Create new user
      await User.create({
        name,
        email: emailLower,
        password: hashedPassword,
        phone,
        address,
        role: "user",
        provider: "local",
        isEmailVerified: false,
        otp,
        otpExpires,
        lastOtpMethod: method,
      });
    }

    // Send OTP via chosen method
    let otpResponse;
    if (method === "sms") {
      otpResponse = await sendSMS(phone, `Your verification code is: ${otp}`);
    } else {
      otpResponse = await sendOTPEmail(emailLower, otp);
    }

    if (!otpResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to send verification ${method === "sms" ? "SMS" : "email"}. Please try again.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Verification code sent to your ${method === "sms" ? "phone" : "email"}. Please verify to complete registration.`,
        email: emailLower,
        requiresVerification: true,
        method,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

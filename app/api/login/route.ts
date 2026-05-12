import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = "admin@gmail.com";

// hashed version of: 123456
const HASHED_PASSWORD =
  "$2b$10$j1eXNJ/eQ1lfpnJLCZjy9ukXSFl00FIaQQhvIeWzURcYZK6tnVk8K";

export async function POST(req: Request) {
  const body = await req.json();

  const { email, password } = body;

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json(
      { message: "Invalid email" },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, HASHED_PASSWORD);

  if (!isMatch) {
    return NextResponse.json(
      { message: "Invalid password" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    {
      email,
      role: "admin",
    },
    "mysecretkey",
    {
      expiresIn: "7d",
    }
  );

  const response = NextResponse.json({
    message: "Login successful",
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    path: "/",
  });

  return response;
}
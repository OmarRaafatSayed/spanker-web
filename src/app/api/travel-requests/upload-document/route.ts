import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      id: "doc-" + Date.now(),
      file_url: "/mock/uploaded-document.pdf",
      status: "uploaded",
    },
    message: "Document uploaded successfully",
  });
}
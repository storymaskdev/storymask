import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only images are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Image is too large. Max 5MB." }, { status: 400 });
    }

    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    if (!apiUser || !apiSecret) {
      return NextResponse.json(
        { ok: false, error: "Image moderation is not configured." },
        { status: 500 }
      );
    }

    const sightForm = new FormData();
    sightForm.append("media", file);
    sightForm.append("models", "nudity-2.1,violence,gore,wad,offensive");
    sightForm.append("api_user", apiUser);
    sightForm.append("api_secret", apiSecret);

    const response = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: sightForm,
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      console.log("Sightengine error:", result);
      return NextResponse.json({ ok: false, error: "Image moderation failed." }, { status: 500 });
    }

    const nudity = Math.max(
      result.nudity?.sexual_activity || 0,
      result.nudity?.sexual_display || 0,
      result.nudity?.erotica || 0,
      result.nudity?.very_suggestive || 0
    );

    const violence = result.violence?.prob || 0;
    const gore = result.gore?.prob || 0;
    const weapon = result.weapon || 0;
    const alcohol = result.alcohol || 0;
    const drugs = result.drugs || 0;
    const offensive = result.offensive?.prob || 0;

    const blocked =
      nudity > 0.35 ||
      violence > 0.55 ||
      gore > 0.35 ||
      weapon > 0.6 ||
      alcohol > 0.75 ||
      drugs > 0.6 ||
      offensive > 0.75;

    if (blocked) {
      return NextResponse.json({
        ok: false,
        error: "This image cannot be published because it may contain inappropriate content.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Image moderation error:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong while checking the image." },
      { status: 500 }
    );
  }
}
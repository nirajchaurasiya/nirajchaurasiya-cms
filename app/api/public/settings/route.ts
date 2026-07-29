import { NextResponse } from "next/server";

import { dbConnect } from "@/lib/mongodb";
import SiteSettingsModel from "@/models/SiteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const settings = await SiteSettingsModel.findOne({
      key: "primary",
    })
      .select({
        _id: 0,
        publicSiteName: 1,
        tagline: 1,
        contactEmail: 1,
        showEmailPublicly: 1,
        publicSiteUrl: 1,
        defaultSeoTitle: 1,
        defaultSeoDescription: 1,
        defaultOgImageUrl: 1,
        socials: 1,
        updatedAt: 1,
      })
      .lean()
      .exec();

    if (!settings) {
      return NextResponse.json(
        {
          error: "Public settings have not been configured.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      settings: {
        ...settings,

        contactEmail: settings.showEmailPublicly ? settings.contactEmail : "",
      },
    });
  } catch (error) {
    console.error("Failed to load public settings:", error);

    return NextResponse.json(
      {
        error: "Public settings could not be loaded.",
      },
      {
        status: 500,
      },
    );
  }
}

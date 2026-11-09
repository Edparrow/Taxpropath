import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyProfile, requireCustomer } from "@/lib/account";
import { AccountHeading } from "../account-heading";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit Profile", robots: { index: false } };

export default async function EditProfilePage() {
  const user = await requireCustomer("/account/edit");
  const profile = await getMyProfile(user.id);

  return (
    <div>
      <AccountHeading
        title="Edit Profile"
        description={`Your email (${user.email}) is your login and can't be changed here.`}
      >
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-[13.5px] font-semibold text-navy-950 transition-colors hover:border-navy-950"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to profile
        </Link>
      </AccountHeading>
      <ProfileForm profile={profile} />
    </div>
  );
}
